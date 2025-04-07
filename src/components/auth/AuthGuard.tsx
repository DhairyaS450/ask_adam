'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string; // Optional: Specify where to redirect unauthenticated users
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, redirectTo = '/login-signup' }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished
    if (!loading) {
      // If user is not logged in, redirect
      if (!user) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, redirectTo]);

  // If loading, show nothing or a loading spinner
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  // If user is authenticated, render the children
  if (user) {
    return <>{children}</>;
  }

  // If not loading and no user, return null (or redirect happens)
  return null;
};

export default AuthGuard;
