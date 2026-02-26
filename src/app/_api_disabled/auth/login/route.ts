import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    // In a real app, you'd verify password hash here
    // For now, we'll accept any password (NOT SECURE - for demo only)
    // TODO: Implement proper password hashing with bcrypt

    const user = {
      id: userDoc.id,
      ...userData
    };

    return NextResponse.json({ user, success: true });
  } catch (error) {
    // Log full error for server diagnostics
    console.error('Login error:', error?.message ?? error, error);

    // Return additional detail to help debugging (safe for staging/dev).
    // If this is a production deployment you may want to remove or redact
    // error details to avoid leaking internal information.
    const detail = typeof error === 'object' && error !== null && 'message' in error
      ? (error as any).message
      : String(error);

    return NextResponse.json(
      { error: 'Login failed', detail },
      { status: 500 }
    );
  }
}
