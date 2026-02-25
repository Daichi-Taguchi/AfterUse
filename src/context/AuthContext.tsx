import React, { createContext, useContext, useMemo, useState } from 'react';
import { signInWithPhoneOtp, signOutUser, updateUserProfile } from '../services/auth.service';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (payload: Pick<User, 'name' | 'organization' | 'email'>) => Promise<void>;
  updateCurrentUser: (nextUser: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (phone: string, otp: string) => {
    setLoading(true);
    try {
      const result = await signInWithPhoneOtp(phone, otp);
      setUser(result.user);
      return { isNewUser: result.isNewUser };
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (payload: Pick<User, 'name' | 'organization' | 'email'>) => {
    if (!user) {
      throw new Error('Login is required.');
    }
    setLoading(true);
    try {
      const updated = await updateUserProfile(user.id, payload);
      setUser(updated);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentUser = (nextUser: User) => {
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      completeProfile,
      updateCurrentUser,
      signOut
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
