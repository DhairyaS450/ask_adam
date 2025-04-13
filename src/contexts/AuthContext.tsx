'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { doc, getDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Assuming firebase config is exported from here

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null; // To store additional user data from Firestore
  loading: boolean;
  refreshUserData: () => Promise<void>; // Add refresh function signature
  deleteAccount: () => Promise<boolean>; // Add deleteAccount function signature
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore
  const fetchUserData = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        console.log("User data fetched:", docSnap.data());
      } else {
        console.log("No user data found in Firestore for UID:", userId);
        setUserData(null); // Reset if no data found
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid); // Use the fetch function
      } else {
        setUserData(null); // Clear user data on logout
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Manual refresh function
  const refreshUserData = async () => {
    if (user) {
      setLoading(true); // Optional: Indicate loading during refresh
      await fetchUserData(user.uid);
      setLoading(false);
    } else {
      console.log("Cannot refresh user data: no user logged in.");
    }
  };

  // Function to delete account (Firestore data + Auth record)
  const deleteAccount = async (): Promise<boolean> => {
    if (!user) {
      console.error("Cannot delete account: no user logged in.");
      alert("Error: You must be logged in to delete your account.");
      return false;
    }

    // *** IMPORTANT: Always confirm deletion with the user ***
    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete your account? This action is irreversible and will remove all your data.'
    );

    if (!confirmed) {
      return false;
    }

    setLoading(true);
    try {
      // 1. Delete Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      console.log("Firestore user document deleted.");

      // 2. Delete Firebase Auth user
      // Note: This might require recent re-authentication. Handle errors appropriately.
      await deleteUser(user);
      console.log("Firebase Auth user deleted.");

      // Reset state (user will be null after auth deletion triggers onAuthStateChanged)
      setUserData(null);
      alert("Account successfully deleted.");
      // Let onAuthStateChanged handle setting user to null and final loading state
      return true;

    } catch (error: any) {
      console.error("Error deleting account:", error);
      // Handle specific errors, e.g., 'auth/requires-recent-login'
      if (error.code === 'auth/requires-recent-login') {
        alert('This operation requires you to recently sign in again. Please log out and log back in before deleting your account.');
        // Consider triggering a re-authentication flow here if needed
      } else {
        alert(`Failed to delete account: ${error.message}`);
      }
      setLoading(false); // Reset loading on error
      return false;
    }
    // setLoading(false) is handled by onAuthStateChanged or error case
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
