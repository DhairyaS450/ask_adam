'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function OnboardingStep2() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightValue1, setHeightValue1] = useState(''); // For ft or cm
  const [heightValue2, setHeightValue2] = useState(''); // For inches
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Optional: Load existing data if user comes back to this step
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().preferences) {
          const prefs = docSnap.data().preferences;
          if (prefs.age) setAge(prefs.age);
          if (prefs.gender) setGender(prefs.gender);
          if (prefs.height) {
            setHeightUnit(prefs.height.unit || 'cm');
            if (prefs.height.unit === 'ft') {
              setHeightValue1(prefs.height.feet || '');
              setHeightValue2(prefs.height.inches || '');
            } else {
              setHeightValue1(prefs.height.value || '');
            }
          }
          if (prefs.weight) {
            setWeightUnit(prefs.weight.unit || 'kg');
            setWeightValue(prefs.weight.value || '');
          }
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

    // Basic Validation
    if (!age || !gender) {
      setError('Please fill in your age and gender.');
      return;
    }
    if (!weightValue) {
        setError('Please enter your weight.');
        return;
    }
    if (heightUnit === 'cm' && !heightValue1) {
        setError('Please enter your height in cm.');
        return;
    }
    if (heightUnit === 'ft' && (!heightValue1 || !heightValue2)) {
        setError('Please enter your height in feet and inches.');
        return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);

      let heightData = {};
      if (heightUnit === 'cm') {
        heightData = { value: parseInt(heightValue1, 10), unit: 'cm' };
      } else {
        heightData = { feet: parseInt(heightValue1, 10), inches: parseInt(heightValue2, 10), unit: 'ft' };
      }

      const weightData = { value: parseFloat(weightValue), unit: weightUnit };

      await updateDoc(userDocRef, {
        'preferences.age': parseInt(age, 10),
        'preferences.gender': gender,
        'preferences.height': heightData,
        'preferences.weight': weightData,
      });

      router.push('/onboarding/step-3'); // Navigate to the next step
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
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">Physical Characteristics</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">This helps ADAM tailor recommendations to you.</p>

        <ProgressIndicator currentStep={2} totalSteps={6} />

        <form onSubmit={handleNext} className="space-y-4">
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              required
              min="13" // Example minimum age
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              required
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:text-white"
              disabled={loading}
            >
              <option value="" disabled>Select...</option>
              {GENDER_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
            <div className="flex items-center space-x-2 mb-2">
              <button type="button" onClick={() => setHeightUnit('cm')} className={`px-3 py-1 rounded ${heightUnit === 'cm' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>cm</button>
              <button type="button" onClick={() => setHeightUnit('ft')} className={`px-3 py-1 rounded ${heightUnit === 'ft' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>ft/in</button>
            </div>
            {heightUnit === 'cm' ? (
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                placeholder="cm"
                required
                value={heightValue1}
                onChange={(e) => setHeightValue1(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            ) : (
              <div className="flex space-x-2">
                <input
                  id="heightFt"
                  name="heightFt"
                  type="number"
                  placeholder="ft"
                  required
                  value={heightValue1}
                  onChange={(e) => setHeightValue1(e.target.value)}
                  className="mt-1 block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
                <input
                  id="heightIn"
                  name="heightIn"
                  type="number"
                  placeholder="in"
                  required
                  min="0" max="11"
                  value={heightValue2}
                  onChange={(e) => setHeightValue2(e.target.value)}
                  className="mt-1 block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight</label>
             <div className="flex items-center space-x-2 mb-2">
               <button type="button" onClick={() => setWeightUnit('kg')} className={`px-3 py-1 rounded ${weightUnit === 'kg' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>kg</button>
               <button type="button" onClick={() => setWeightUnit('lbs')} className={`px-3 py-1 rounded ${weightUnit === 'lbs' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>lbs</button>
            </div>
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1" // Allow decimals
              placeholder={weightUnit}
              required
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
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
              onClick={() => router.back()} // Go back to step 1
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
