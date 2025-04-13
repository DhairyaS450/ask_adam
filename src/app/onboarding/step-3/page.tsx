'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

const FITNESS_GOALS = [
  'Build Muscle',
  'Lose Weight',
  'Improve General Fitness',
  'Increase Strength',
  'Improve Endurance',
  'Stay Fit / Maintain Weight',
  'Train for Specific Event (e.g., Marathon, Competition)',
  'Improve Flexibility / Mobility',
  'Reduce Stress',
  'Other'
];

export default function OnboardingStep3() {
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [secondaryGoal, setSecondaryGoal] = useState(''); // Optional
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Load existing data
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().preferences) {
          const prefs = docSnap.data().preferences;
          if (prefs.primaryGoal) setPrimaryGoal(prefs.primaryGoal);
          if (prefs.secondaryGoal) setSecondaryGoal(prefs.secondaryGoal);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to proceed.');
      return;
    }

    if (!primaryGoal) {
      setError('Please select your primary fitness goal.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'preferences.primaryGoal': primaryGoal,
        'preferences.secondaryGoal': secondaryGoal || null, // Store null if empty
      });

      router.push('/onboarding/step-4'); // Navigate to the next step
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(err.message || 'Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Fitness Goals</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">What do you want to achieve?</p>

        {/* Add Progress Indicator */}
        <ProgressIndicator currentStep={3} totalSteps={6} />

        <form onSubmit={handleNext} className="space-y-6">
          {/* Primary Goal */}
          <div>
            <label htmlFor="primaryGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Goal <span className="text-red-500">*</span>
            </label>
            <select
              id="primaryGoal"
              name="primaryGoal"
              required
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:text-white"
              disabled={loading}
            >
              <option value="" disabled>Select your main goal...</option>
              {FITNESS_GOALS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Secondary Goal (Optional) */}
          <div>
            <label htmlFor="secondaryGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Secondary Goal (Optional)
            </label>
            <select
              id="secondaryGoal"
              name="secondaryGoal"
              value={secondaryGoal}
              onChange={(e) => setSecondaryGoal(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:text-white"
              disabled={loading}
            >
              <option value="">Select an additional goal (optional)...</option>
              {FITNESS_GOALS.filter(goal => goal !== primaryGoal).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.back()} 
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-gray-600 dark:disabled:text-gray-400"
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
