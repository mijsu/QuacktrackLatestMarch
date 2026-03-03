import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Subject } from '@/lib/types';

// GET - Fetch all subjects
export async function GET(request: NextRequest) {
  try {
    const subjectsRef = collection(db, 'subjects');
    const snapshot = await getDocs(subjectsRef);

    const subjects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Subject[];

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST - Create new subject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const totalHours = (parseInt(body.lectureHours) || 0) + (parseInt(body.labHours) || 0);

    const subjectData = {
      code: body.code,
      name: body.name,
      year: parseInt(body.year),
      semester: parseInt(body.semester),
      units: parseInt(body.units),
      lectureHours: parseInt(body.lectureHours) || 0,
      labHours: parseInt(body.labHours) || 0,
      totalHours: totalHours,
      programId: body.programId || null,
      programName: body.programName || null,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'subjects'), subjectData);

    const subject: Subject = {
      id: docRef.id,
      ...subjectData,
      createdAt: new Date()
    };

    return NextResponse.json({ subject, success: true });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
