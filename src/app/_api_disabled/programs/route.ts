import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Program, Section, Department } from '@/lib/types';

// GET - Fetch all programs and sections
export async function GET(request: NextRequest) {
  try {
    const programsRef = collection(db, 'programs');
    const programsSnapshot = await getDocs(programsRef);

    const programs = programsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Program[];

    const sectionsRef = collection(db, 'sections');
    const sectionsSnapshot = await getDocs(sectionsRef);

    const sections = sectionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Section[];

    const departmentsRef = collection(db, 'departments');
    const departmentsSnapshot = await getDocs(departmentsRef);

    const departments = departmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Department[];

    // Join department names with programs
    const programWithDeptNames = programs.map((program) => {
      const department = departments.find(d => d.id === program.departmentId);
      return {
        ...program,
        departmentName: department ? department.name : null
      };
    });

    return NextResponse.json({ programs: programWithDeptNames, sections, departments });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST - Create new program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === 'section') {
      // Create section
      const sectionData = {
        programId: body.programId,
        programName: body.programName,
        sectionName: body.sectionName,
        year: parseInt(body.year),
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'sections'), sectionData);

      const section: Section = {
        id: docRef.id,
        ...sectionData,
        createdAt: new Date()
      };

      return NextResponse.json({ section, success: true });
    } else {
      // Create program
      const programData = {
        name: body.name,
        code: body.code,
        departmentId: body.departmentId || null,
        description: body.description || '',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'programs'), programData);

      const program: Program = {
        id: docRef.id,
        ...programData,
        createdAt: new Date()
      };

      return NextResponse.json({ program, success: true });
    }
  } catch (error) {
    console.error('Error creating program/section:', error);
    return NextResponse.json(
      { error: 'Failed to create program/section' },
      { status: 500 }
    );
  }
}
