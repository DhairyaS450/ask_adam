'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { doc, deleteDoc, DocumentData, onSnapshot, Unsubscribe } from 'firebase/firestore';
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

  useEffect(() => {
    let unsubscribeFirestore: Unsubscribe | null = null; // Variable to hold the Firestore listener unsubscribe function

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous Firestore listener if it exists
      if (unsubscribeFirestore) {
        console.log("Unsubscribing from previous Firestore listener.");
        unsubscribeFirestore();
        unsubscribeFirestore = null; // Reset variable
      }

      if (currentUser) {
        setLoading(true); // Start loading when setting up new listener
        const userDocRef = doc(db, 'users', currentUser.uid);
        console.log("Setting up Firestore listener for UID:", currentUser.uid);
        
        // Set up the real-time listener
        unsubscribeFirestore = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
              console.log("AuthContext: User data updated from snapshot:", docSnap.data());
            } else {
              console.log("AuthContext: No user data found in Firestore for UID:", currentUser.uid);
              setUserData(null); // Reset if no data found
            }
            setLoading(false); // Stop loading once data (or lack thereof) is confirmed
          }, 
          (error) => {
            console.error("AuthContext: Error fetching user data snapshot:", error);
            setUserData(null);
            setLoading(false); // Stop loading on error
          }
        );
      } else {
        // No user logged in
        setUserData(null); // Clear user data
        setLoading(false); // Stop loading
      }
    });

    // Cleanup function for the main useEffect
    return () => {
      console.log("Cleaning up AuthContext listeners.");
      unsubscribeAuth(); // Unsubscribe from auth state changes
      // Unsubscribe from Firestore listener if it's active
      if (unsubscribeFirestore) {
        console.log("Unsubscribing from active Firestore listener during cleanup.");
        unsubscribeFirestore();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Manual refresh function - might be less necessary with onSnapshot, but can keep for explicit refresh scenarios
  const refreshUserData = async () => {
    // With onSnapshot, data should be up-to-date. 
    // This function might now be redundant or could force a re-fetch if needed, 
    // but onSnapshot usually handles it.
    console.log("refreshUserData called - data should be live via onSnapshot.");
    if (user && !loading) {
        // Optionally, you could re-trigger the fetch logic here if needed,
        // but usually not required with onSnapshot.
        // Example: Force re-fetch (though snapshot should handle it)
        // setLoading(true);
        // const userDocRef = doc(db, 'users', user.uid);
        // try { ... getDoc ... } finally { setLoading(false); }
    } else {
      console.log("Cannot refresh user data: no user logged in or already loading.");
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
