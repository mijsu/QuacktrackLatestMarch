import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ScheduleItem, MAX_START_SLOT } from '@/lib/types';

// PATCH - Update schedule item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { day, startSlot, duration, professorId } = body;

    // Validate
    if (startSlot + duration > MAX_START_SLOT) {
      return NextResponse.json(
        { error: 'Time exceeds 9:00 PM limit', valid: false },
        { status: 400 }
      );
    }

    // Get all schedule items to check conflicts
    const scheduleRef = collection(db, 'schedule');
    const snapshot = await getDocs(scheduleRef);
    const schedule = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduleItem[];

    // Check for conflicts
    const hasConflict = schedule.some((item) => {
      if (item.id === id) return false;
      if (item.day !== day) return false;

      const itemEnd = item.startSlot + item.duration;
      const timeOverlap = startSlot < itemEnd && (startSlot + duration) > item.startSlot;
      const profOverlap = item.professorId === professorId;

      return timeOverlap && profOverlap;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Conflict detected (Professor)', valid: false },
        { status: 400 }
      );
    }

    // Update the document
    const docRef = doc(db, 'schedule', id);
    await updateDoc(docRef, {
      day,
      startSlot,
      duration,
      professorId,
      ...body // Include any other fields from body
    });

    // Fetch updated document
    const updatedDoc = await getDoc(docRef);
    const updatedItem = { id: updatedDoc.id, ...updatedDoc.data() } as ScheduleItem;

    return NextResponse.json({ item: updatedItem, valid: true });
  } catch (error) {
    console.error('Error updating schedule item:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule item' },
      { status: 500 }
    );
  }
}
