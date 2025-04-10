'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // Assuming firebase config is exported from here

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null; // To store additional user data from Firestore
  loading: boolean;
  refreshUserData: () => Promise<void>; // Add refresh function signature
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

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
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
