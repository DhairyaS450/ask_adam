'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseApp } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import FirebaseDebugger from './firebase-debug';
import { useRouter } from 'next/navigation';

export default function LoginSignupPage() {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Add a debug state
  const [showDebugger, setShowDebugger] = useState(false);

  // Check if Firebase is properly configured
  useEffect(() => {
    try {
      console.log('Firebase app initialized:', !!firebaseApp);
      console.log('Auth service available:', !!auth);
      
      // Set persistence to local when component mounts
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('Persistence set to browserLocalPersistence');
        })
        .catch((error) => {
          console.error('Error setting persistence:', error);
        });
    } catch (err) {
      console.error('Firebase initialization error:', err);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Clear form fields and messages when switching forms
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const redirectToHome = () => {
    // Short delay to show success message before redirecting
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user document exists
      const userRef = doc(db, 'users', auth.currentUser?.uid || '');
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // If user doesn't exist in Firestore yet, create a document
        const userId = auth.currentUser?.uid || '';
        await setDoc(doc(db, 'users', userId), {
          uuid: uuidv4(),
          email: email,
          createdAt: new Date().toISOString(),
        });
      }

      setSuccess('Login successful! Redirecting...');
      redirectToHome();
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    console.log('Signing up with:', email);

    try {
      // Basic validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user document in Firestore with UUID
      await setDoc(doc(db, 'users', userId), {
        uuid: uuidv4(),
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
      });

      setSuccess('Account created successfully! Redirecting...');
      redirectToHome();
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 p-4 overflow-hidden pt-20 md:pt-4">
          <div className="max-w-md mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-fitness-dark dark:text-white">
                {isLogin ? 'Login' : 'Sign Up'}
              </h1>
              <button 
                onClick={() => setShowDebugger(!showDebugger)}
                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
              >
                {showDebugger ? 'Hide Debug' : 'Debug'}
              </button>
            </div>

            {showDebugger && (
              <div className="mb-4">
                <FirebaseDebugger />
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Error and success messages */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
                  {success}
                </div>
              )}

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={toggleForm}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Don't have an account? Sign up
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="signup-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="signup-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Create a password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Confirm your password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={toggleForm}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
