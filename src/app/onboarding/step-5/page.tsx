'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

// TODO: Add Progress Indicator Component

const EQUIPMENT_OPTIONS = [
  'Bodyweight Only',
  'Dumbbells',
  'Resistance Bands',
  'Kettlebells',
  'Pull-up Bar',
  'Bench',
  'Barbell & Plates',
  'Squat Rack',
  'Cable Machine',
  'Treadmill / Running Space',
  'Stationary Bike',
  'Rowing Machine',
  'Elliptical',
  'Stairs / Step Machine',
  'Jump Rope',
  'Foam Roller',
  'Yoga Mat',
  'Other (Specify if gym member)'
];

export default function OnboardingStep5() {
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [hasGymMembership, setHasGymMembership] = useState<string>(''); // 'yes', 'no', or ''
  // Optional: State for specific gym equipment if needed later
  // const [specificGymEquipment, setSpecificGymEquipment] = useState('');
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
          if (prefs.availableEquipment) setAvailableEquipment(prefs.availableEquipment);
          if (prefs.hasGymMembership !== undefined) setHasGymMembership(prefs.hasGymMembership ? 'yes' : 'no');
        }
      }
    };
    fetchData();
  }, [user]);

  const handleEquipmentChange = (equipment: string) => {
    setAvailableEquipment(prev =>
      prev.includes(equipment) ? prev.filter(item => item !== equipment) : [...prev, equipment]
    );
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to proceed.');
      return;
    }

    if (availableEquipment.length === 0) {
      setError('Please select at least one equipment option (e.g., Bodyweight Only).');
      return;
    }
    if (!hasGymMembership) {
        setError('Please indicate if you have a gym membership.');
        return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const dataToSave = {
        availableEquipment: availableEquipment,
        hasGymMembership: hasGymMembership === 'yes',
        // Add specificGymEquipment if implemented
      };

      await setDoc(userDocRef, { preferences: dataToSave }, { merge: true });

      router.push('/onboarding/step-6'); // Navigate to the next step
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
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Equipment Availability</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Let ADAM know what tools you have access to.</p>

        {/* Add Progress Indicator */}
        <ProgressIndicator currentStep={5} totalSteps={6} />

        <form onSubmit={handleNext} className="space-y-6">
          {/* Available Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What equipment do you have access to? (Select all that apply) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQUIPMENT_OPTIONS.map(option => (
                <label key={option} className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    value={option}
                    checked={availableEquipment.includes(option)}
                    onChange={() => handleEquipmentChange(option)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gym Membership */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Do you have a gym membership? <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gymMembership"
                  value="yes"
                  checked={hasGymMembership === 'yes'}
                  onChange={(e) => setHasGymMembership(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-800 dark:text-gray-200">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gymMembership"
                  value="no"
                  checked={hasGymMembership === 'no'}
                  onChange={(e) => setHasGymMembership(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-800 dark:text-gray-200">No</span>
              </label>
            </div>
          </div>

          {/* Optional: Text area for specific gym equipment if 'Yes' */} 
          {/* {hasGymMembership === 'yes' && (
            <div>
              <label htmlFor="specificGymEquipment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Any specific equipment at your gym you'd like ADAM to know about? (Optional)
              </label>
              <textarea
                id="specificGymEquipment"
                name="specificGymEquipment"
                rows={3}
                value={specificGymEquipment}
                onChange={(e) => setSpecificGymEquipment(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </div>
          )} */} 

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
              disabled={loading || availableEquipment.length === 0 || !hasGymMembership}
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
