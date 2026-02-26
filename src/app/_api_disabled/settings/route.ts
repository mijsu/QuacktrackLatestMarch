import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { SystemSettings } from '@/lib/types';

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    // Directly get the document with ID 'system'
    const settingsDoc = await getDoc(doc(db, 'settings', 'system'));

    if (!settingsDoc.exists()) {
      // Create default settings
      const defaultSettings: SystemSettings = {
        id: 'system',
        systemName: 'PTC QuackTrack',
        academicYear: '2024-2025',
        currentSemester: 1,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'settings', 'system'), defaultSettings);

      return NextResponse.json({ settings: defaultSettings });
    }

    const settings = { id: settingsDoc.id, ...settingsDoc.data() } as SystemSettings;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Update system settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const settingsData = {
      id: 'system',
      systemName: body.systemName || 'PTC QuackTrack',
      academicYear: body.academicYear || '2024-2025',
      currentSemester: parseInt(body.currentSemester) || 1,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'settings', 'system'), settingsData);

    return NextResponse.json({ settings: settingsData, success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
