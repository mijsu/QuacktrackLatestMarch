import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Department } from '@/lib/types';

// GET - Fetch all departments
export async function GET(request: NextRequest) {
  try {
    const snapshot = await getDocs(collection(db, 'departments'));
    const departments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Department[];

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST - Create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if department code already exists
    const snapshot = await getDocs(collection(db, 'departments'));
    const existingCode = snapshot.docs.some(
      (doc) => doc.data().code === code
    );

    if (existingCode) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      );
    }

    const departmentData = {
      name,
      code,
      description: description || '',
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'departments'), departmentData);

    return NextResponse.json({
      department: {
        id: docRef.id,
        ...departmentData
      }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}

// PATCH - Update a department
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, code, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;

    const docRef = doc(db, 'departments', id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a department
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'departments', id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
