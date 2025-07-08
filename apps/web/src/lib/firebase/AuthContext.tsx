'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks/redux';
import { setUser, clearUser } from '@/domains/auth/store/authSlice';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        
        // Update Redux store with user info
        dispatch(setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ')[1] || '',
          avatarUrl: firebaseUser.photoURL || null,
          isAuthenticated: true,
        }));
      } else {
        setAuthUser(null);
        dispatch(clearUser());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Sign up with email and password
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with display name
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Create user profile in API (skip if API is not configured for Firebase)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await userCredential.user.getIdToken()}`,
          },
          body: JSON.stringify({
            firebaseUid: userCredential.user.uid,
            email,
            firstName,
            lastName,
          }),
        });

        if (!response.ok && response.status !== 404) {
          console.warn('Failed to create user profile in API, but Firebase user was created');
        }
      } catch (error) {
        console.warn('API profile creation failed, but Firebase user was created:', error);
      }

      router.push('/onboarding');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/locations');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists in API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${await result.user.getIdToken()}`,
        },
      });

      if (response.status === 404) {
        // Create profile if it doesn't exist
        const names = result.user.displayName?.split(' ') || ['', ''];
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await result.user.getIdToken()}`,
          },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email: result.user.email,
            firstName: names[0],
            lastName: names.slice(1).join(' '),
            avatarUrl: result.user.photoURL,
          }),
        });
        router.push('/onboarding');
      } else {
        router.push('/locations');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};