import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// GET - Fetch all professors (users with role 'professor')
export async function GET(request: NextRequest) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'professor'));
    const snapshot = await getDocs(q);

    const professors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch departments to include names
    const departmentsRef = collection(db, 'departments');
    const deptsSnapshot = await getDocs(departmentsRef);
    const departments = deptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ professors, departments });
  } catch (error) {
    console.error('Error fetching professors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professors' },
      { status: 500 }
    );
  }
}

// POST - Create professor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if email already exists
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const existingEmail = snapshot.docs.find(doc => doc.data().email === body.email);

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const professorData: any = {
      name: body.name,
      email: body.email,
      password: body.password || 'password123',
      role: 'professor',
      specialization: body.specialization || '',
      departmentIds: body.departmentIds || [],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`,
      createdAt: new Date()
    };

    // Add professorId if provided
    if (body.professorId) {
      professorData.professorId = body.professorId;
    }

    const docRef = await addDoc(collection(db, 'users'), professorData);

    const professor = {
      id: docRef.id,
      ...professorData
    };

    return NextResponse.json({ professor, success: true });
  } catch (error) {
    console.error('Error creating professor:', error);
    return NextResponse.json(
      { error: 'Failed to create professor', success: false },
      { status: 500 }
    );
  }
}

// PUT - Update professor
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Professor ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'users', body.id);
    const updateData: any = {
      name: body.name,
      email: body.email,
      specialization: body.specialization || '',
      departmentIds: body.departmentIds || [],
    };

    if (body.professorId) {
      updateData.professorId = body.professorId;
    }

    if (body.password) {
      updateData.password = body.password;
    }

    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating professor:', error);
    return NextResponse.json(
      { error: 'Failed to update professor', success: false },
      { status: 500 }
    );
  }
}
