import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// GET - Get single professor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Professor not found' },
        { status: 404 }
      );
    }

    const professor = { id: docSnap.id, ...docSnap.data() };
    return NextResponse.json({ professor });
  } catch (error) {
    console.error('Error fetching professor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professor' },
      { status: 500 }
    );
  }
}

// PATCH - Partially update professor (for profile updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const docRef = doc(db, 'users', id);
    const updateData: any = {};

    // Only update fields that are provided
    if (body.name !== undefined && body.name !== '') {
      updateData.name = body.name;
      // Update avatar when name changes
      updateData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`;
    }
    if (body.email !== undefined && body.email !== '') {
      updateData.email = body.email;
    }
    if (body.professorId !== undefined) {
      updateData.professorId = body.professorId;
    }
    if (body.specialization !== undefined) {
      updateData.specialization = body.specialization;
    }
    if (body.departmentIds !== undefined && Array.isArray(body.departmentIds)) {
      updateData.departmentIds = body.departmentIds;
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const professor = {
      id: updatedDoc.id,
      email: updatedDoc.data().email,
      name: updatedDoc.data().name,
      role: updatedDoc.data().role,
      professorId: updatedDoc.data().professorId,
      avatar: updatedDoc.data().avatar,
      createdAt: updatedDoc.data().createdAt,
    };

    return NextResponse.json({ professor, success: true });
  } catch (error) {
    console.error('Error updating professor:', error);
    return NextResponse.json(
      { error: 'Failed to update professor', success: false },
      { status: 500 }
    );
  }
}

// PUT - Update professor (full update for admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('PUT request body:', body);

    // Check if document exists
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Professor not found', success: false },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Only update fields that are provided and not empty
    if (body.name !== undefined && body.name !== '') {
      updateData.name = body.name;
      // Update avatar when name changes
      updateData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`;
    }
    if (body.email !== undefined && body.email !== '') {
      updateData.email = body.email;
    }
    if (body.specialization !== undefined) {
      updateData.specialization = body.specialization;
    }
    if (body.professorId !== undefined) {
      updateData.professorId = body.professorId;
    }
    if (body.departmentIds !== undefined && Array.isArray(body.departmentIds)) {
      updateData.departmentIds = body.departmentIds;
    }

    // Only update password if provided
    if (body.password && body.password !== '') {
      updateData.password = body.password;
    }

    console.log('Update data:', updateData);

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', success: false },
        { status: 400 }
      );
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const professor = {
      id: updatedDoc.id,
      email: updatedDoc.data().email,
      name: updatedDoc.data().name,
      role: updatedDoc.data().role,
      professorId: updatedDoc.data().professorId,
      specialization: updatedDoc.data().specialization,
      avatar: updatedDoc.data().avatar,
      createdAt: updatedDoc.data().createdAt,
    };

    console.log('Updated professor:', professor);

    return NextResponse.json({ professor, success: true });
  } catch (error) {
    console.error('Error updating professor:', error);
    return NextResponse.json(
      { error: 'Failed to update professor', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Delete professor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, 'users', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting professor:', error);
    return NextResponse.json(
      { error: 'Failed to delete professor', success: false },
      { status: 500 }
    );
  }
}
