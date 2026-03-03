import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Program, Section } from '@/lib/types';

// PATCH - Partially update program or section (for department assignment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body;

    const docRef = doc(db, type === 'section' ? 'sections' : 'programs', id);

    const updateData: any = {};

    if (type === 'section') {
      if (body.sectionName !== undefined) {
        updateData.sectionName = body.sectionName;
      }
      if (body.year !== undefined) {
        updateData.year = parseInt(body.year);
      }
    } else {
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.code !== undefined) {
        updateData.code = body.code;
      }
      if (body.departmentId !== undefined) {
        updateData.departmentId = body.departmentId;
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const item = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ [type === 'section' ? 'section' : 'program']: item, success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item', success: false },
      { status: 500 }
    );
  }
}

// PUT - Update program or section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body;

    const docRef = doc(db, type === 'section' ? 'sections' : 'programs', id);

    if (type === 'section') {
      await updateDoc(docRef, {
        sectionName: body.sectionName,
        year: parseInt(body.year),
      });
    } else {
      await updateDoc(docRef, {
        code: body.code,
        name: body.name,
        departmentId: body.departmentId || null,
        description: body.description || '',
      });
    }

    const updatedDoc = await getDoc(docRef);
    const item = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ [type === 'section' ? 'section' : 'program']: item, success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Delete program or section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'program';

    await deleteDoc(doc(db, type === 'section' ? 'sections' : 'programs', id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item', success: false },
      { status: 500 }
    );
  }
}
