'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define public routes
const PUBLIC_ROUTES = ['/login-signup'];

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string; // Optional: Specify where to redirect unauthenticated users
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, redirectTo = '/login-signup' }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // Check if the current path is public
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Wait until loading is finished
    if (!loading) {
      // If user is not logged in AND it's not a public route, redirect
      if (!user && !isPublicRoute) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, redirectTo, pathname]); // Add pathname to dependency array

  // Check if the current path is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // If loading, show a loading indicator (or null)
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  // If it's a public route OR the user is authenticated, render the children
  if (isPublicRoute || user) {
    return <>{children}</>;
  }

  // If not loading, not a public route, and no user, return null (redirect is handling navigation)
  return null;
};

export default AuthGuard;
