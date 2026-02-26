import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, professorId } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user document
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role: role as 'admin' | 'professor',
      professorId: professorId || undefined,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'users'), userData);

    const user: User = {
      id: docRef.id,
      ...userData
    };

    return NextResponse.json({ user, success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
