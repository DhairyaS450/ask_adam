'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

// TODO: 

export default function OnboardingStep1() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to proceed.');
      return;
    }

    if (!firstName || !lastName) {
      setError('Please enter both your first and last name.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Use setDoc with merge: true to ensure document/preferences object exists
      await setDoc(userDocRef, { 
        preferences: { 
          firstName: firstName,
          lastName: lastName,
          name: `${firstName} ${lastName}` // Update the general 'name' as well
        }
      }, { merge: true });

      // Navigate to the next step
      router.push('/onboarding/step-2'); 
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(err.message || 'Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      {/* Progress Indicator Placeholder */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Welcome! Let's Start Your Profile</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Tell us a bit about yourself.</p>
        
        {/* Add Progress Indicator */}
        <ProgressIndicator currentStep={1} totalSteps={6} />

        <form onSubmit={handleNext} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-gray-600 dark:disabled:text-gray-400"
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
