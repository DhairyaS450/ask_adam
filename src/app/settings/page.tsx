'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header'; 
import Sidebar from '@/components/layout/Sidebar';

// Define the structure for user preferences
interface UserPreferences {
  height: string;
  weight: string;
  age: string;
  gender: string;
  goals: string;
  medicalConditions: string;
  injuries: string;
  dietaryPreferences: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  timeConstraints: string;
  availableSpaceEquipment: string;
}

// Default preferences for new users or if data is missing
const defaultPreferences: UserPreferences = {
  height: '',
  weight: '',
  age: '',
  gender: '',
  goals: '',
  medicalConditions: '',
  injuries: '',
  dietaryPreferences: '',
  fitnessLevel: 'beginner',
  timeConstraints: '',
  availableSpaceEquipment: '',
};

// The main content component for the settings page
function SettingsPageContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'' | 'success' | 'error'>('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Effect to load user preferences when auth state is ready
  useEffect(() => {
    if (!authLoading && user) {
      // Prioritize userData from context if available
      if (userData?.preferences) {
        // Merge defaults with loaded data to ensure all fields are present
        setPreferences({ ...defaultPreferences, ...userData.preferences });
        setIsLoading(false);
      } else {
        // If not in context, attempt to fetch directly from Firestore
        const fetchPrefs = async () => {
          setIsLoading(true);
          const userDocRef = doc(db, 'users', user.uid);
          try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data()?.preferences) {
               setPreferences({ ...defaultPreferences, ...docSnap.data().preferences });
            } else {
              // Use defaults if no document or preferences field exists
              setPreferences(defaultPreferences);
              // Optionally, save these defaults back to Firestore if the doc exists but prefs don't
              if (docSnap.exists()) {
                  await updateDoc(userDocRef, { preferences: defaultPreferences });
              }
            }
          } catch (error) {
             console.error("Error fetching preferences directly:", error);
             setPreferences(defaultPreferences); // Fallback to defaults on error
             setSaveStatus('error'); // Indicate there was a load error
          } finally {
            setIsLoading(false);
          }
        };
        fetchPrefs();
      }
    } else if (!authLoading && !user) {
      // If no user after loading, AuthGuard handles redirect
      setIsLoading(false);
    }
  }, [user, userData, authLoading]); // Re-run if user, context data, or loading state changes

 // Function to toggle the mobile sidebar
 const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Generic handler for input/select/textarea changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => prev ? { ...prev, [name]: value } : null);
    if (saveStatus) setSaveStatus(''); // Clear save status on change
  };

  // Function to save preferences to Firestore
  const handleSave = async () => {
    if (!user || !preferences) return;
    setIsSaving(true);
    setSaveStatus('');
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Update the 'preferences' field in the user's document
      await updateDoc(userDocRef, {
        preferences: preferences
      });
      setSaveStatus('success');
      console.log('Preferences updated successfully!');
      // TODO: Consider updating AuthContext's userData locally for immediate reflection
    } catch (error) {
      console.error("Error updating preferences:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      // Hide status message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Show loading state while fetching auth or preferences
  if (isLoading || authLoading) {
    // A more centered loading indicator could be used here
    return <div className="flex justify-center items-center h-screen">Loading settings...</div>; 
  }

  // If preferences couldn't be loaded (should be rare after adding defaults)
  if (!preferences) {
     return <div className="flex justify-center items-center h-screen">Could not load user preferences. Please try again later.</div>
  }

  // Render the settings form
  return (
     <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 overflow-hidden pt-20 md:pt-4">
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-fitness-dark dark:text-white">Your Profile Settings</h1>
            {/* Form container */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={preferences.height}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={preferences.weight}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={preferences.age}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={preferences.gender}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fitness Profile */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Fitness Profile</h2>
                
                <div>
                  <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fitness Level</label>
                  <select
                    id="fitnessLevel"
                    name="fitnessLevel"
                    value={preferences.fitnessLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="goals" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fitness Goals</label>
                  <textarea
                    id="goals"
                    name="goals"
                    value={preferences.goals}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What are you hoping to achieve with your fitness routine?"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Time Constraints */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Time Constraints</h2>
                
                <div>
                  <label htmlFor="timeConstraints" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Constraints</label>
                  <textarea
                    id="timeConstraints"
                    name="timeConstraints"
                    value={preferences.timeConstraints}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., 30 minutes/day, 3 times/week, specific days/times"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Available Space and Equipment */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Available Space & Equipment</h2>
                
                <div>
                  <label htmlFor="availableSpaceEquipment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Space & Equipment</label>
                  <textarea
                    id="availableSpaceEquipment"
                    name="availableSpaceEquipment"
                    value={preferences.availableSpaceEquipment}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g., Commercial gym access, home gym with dumbbells and bands, only bodyweight"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Health Information */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Health Information</h2>
                
                <div>
                  <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medical Conditions</label>
                  <textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    value={preferences.medicalConditions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please list any medical conditions that might affect your fitness routine"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="injuries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Injuries or Limitations</label>
                  <textarea
                    id="injuries"
                    name="injuries"
                    value={preferences.injuries}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any injuries or physical limitations we should be aware of?"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="dietaryPreferences" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dietary Preferences</label>
                  <textarea
                    id="dietaryPreferences"
                    name="dietaryPreferences"
                    value={preferences.dietaryPreferences}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any dietary preferences or restrictions?"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Save Button & Status */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black dark:text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <div className="text-sm h-5"> {/* Placeholder for status message alignment */}
                  {saveStatus === 'success' && <span className="text-green-600 dark:text-green-400">Saved successfully!</span>}
                  {saveStatus === 'error' && <span className="text-red-600 dark:text-red-400">Failed to save settings.</span>}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Default export wraps the content component with AuthGuard
export default function SettingsPage() {
  return (
    // AuthGuard ensures only logged-in users can access this page
    <AuthGuard>
      <SettingsPageContent />
    </AuthGuard>
  );
}
