import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Subject } from '@/lib/types';

// PUT - Update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const docRef = doc(db, 'subjects', id);
    await updateDoc(docRef, {
      code: body.code,
      name: body.name,
      type: body.type,
      year: parseInt(body.year),
      semester: parseInt(body.semester),
      units: parseInt(body.units),
      hours: parseInt(body.hours),
    });

    const updatedDoc = await getDoc(docRef);
    const subject = { id: updatedDoc.id, ...updatedDoc.data() } as Subject;

    return NextResponse.json({ subject, success: true });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Failed to update subject', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Delete subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, 'subjects', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Failed to delete subject', success: false },
      { status: 500 }
    );
  }
}
