'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

// TODO: Add Progress Indicator Component

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Little to no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (Light exercise/sports 1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (Moderate exercise/sports 3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (Hard exercise/sports 6-7 days a week)' },
  { value: 'extra_active', label: 'Extra Active (Very hard exercise/sports & physical job)' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WORKOUT_DURATIONS = [
  '< 30 minutes',
  '30-45 minutes',
  '45-60 minutes',
  '60+ minutes',
];

export default function OnboardingStep4() {
  const [activityLevel, setActivityLevel] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState('');
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
          if (prefs.activityLevel) setActivityLevel(prefs.activityLevel);
          if (prefs.availableDays) setAvailableDays(prefs.availableDays);
          if (prefs.workoutDuration) setWorkoutDuration(prefs.workoutDuration);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleDayChange = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to proceed.');
      return;
    }

    if (!activityLevel || availableDays.length === 0 || !workoutDuration) {
      setError('Please fill in all fields for this step.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'preferences.activityLevel': activityLevel,
        'preferences.availableDays': availableDays,
        'preferences.workoutDuration': workoutDuration,
      });

      router.push('/onboarding/step-5'); // Navigate to the next step
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
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Activity & Availability</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Help ADAM understand your current fitness level and schedule.</p>

        {/* Add Progress Indicator */}
        <ProgressIndicator currentStep={4} totalSteps={6} />

        <form onSubmit={handleNext} className="space-y-6">
          {/* Activity Level */}
          <div>
            <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Activity Level <span className="text-red-500">*</span>
            </label>
            <select
              id="activityLevel"
              name="activityLevel"
              required
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:text-white"
              disabled={loading}
            >
              <option value="" disabled>Select your activity level...</option>
              {ACTIVITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Available Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Days Available for Workouts <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <label key={day} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    value={day}
                    checked={availableDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Workout Duration Preference */}
          <div>
            <label htmlFor="workoutDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Preferred Workout Duration <span className="text-red-500">*</span>
            </label>
            <select
              id="workoutDuration"
              name="workoutDuration"
              required
              value={workoutDuration}
              onChange={(e) => setWorkoutDuration(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:text-white"
              disabled={loading}
            >
              <option value="" disabled>Select duration...</option>
              {WORKOUT_DURATIONS.map(duration => (
                <option key={duration} value={duration}>{duration}</option>
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
              disabled={loading || availableDays.length === 0}
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
