'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

export default function OnboardingStep6() {
  const [injuries, setInjuries] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [otherLimitations, setOtherLimitations] = useState('');
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
          if (prefs.injuries) setInjuries(prefs.injuries);
          if (prefs.medicalConditions) setMedicalConditions(prefs.medicalConditions);
          if (prefs.otherLimitations) setOtherLimitations(prefs.otherLimitations);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to proceed.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'preferences.injuries': injuries || null,
        'preferences.medicalConditions': medicalConditions || null,
        'preferences.otherLimitations': otherLimitations || null,
        'preferences.onboardingComplete': true // Mark onboarding as complete
      });

      // Navigate to the onboarding completion / Meet Adam step
      router.push('/onboarding/complete'); 
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
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Medical Information & Limitations</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Sharing this (optional) information helps ADAM provide safer and more suitable recommendations.</p>

        {/* Add Progress Indicator */}
        <ProgressIndicator currentStep={6} totalSteps={6} />

         {/* Disclaimer */}
         <div className="p-3 mb-4 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800" role="alert">
          <span className="font-medium">Important:</span> Ask ADAM is an AI assistant and cannot provide medical advice. The information provided is for educational purposes only. Always consult with a qualified healthcare professional before starting any new fitness program or if you have any health concerns.
        </div>

        <form onSubmit={handleFinish} className="space-y-4">
          {/* Injuries */}
          <div>
            <label htmlFor="injuries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current or Past Injuries (Optional)
            </label>
            <textarea
              id="injuries"
              name="injuries"
              rows={3}
              placeholder="e.g., Previous shoulder injury, recurring knee pain"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Medical Conditions */}
          <div>
            <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Relevant Medical Conditions (Optional)
            </label>
            <textarea
              id="medicalConditions"
              name="medicalConditions"
              rows={3}
              placeholder="e.g., Asthma, Diabetes, High Blood Pressure"
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Other Limitations */}
          <div>
            <label htmlFor="otherLimitations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Other Limitations or Considerations (Optional)
            </label>
            <textarea
              id="otherLimitations"
              name="otherLimitations"
              rows={3}
              placeholder="e.g., Pregnancy, recent surgery, specific exercise modifications needed"
              value={otherLimitations}
              onChange={(e) => setOtherLimitations(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
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
              {loading ? 'Saving...' : 'Finish Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
