'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header'; 
import Sidebar from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, UserCircleIcon, HeartIcon, CalendarDaysIcon, ScaleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Define the structure for user preferences
interface UserPreferences {
  // From Step 1
  firstName?: string;
  lastName?: string;
  name?: string; // Combined name
  // From Step 2
  age?: number | null;
  gender?: string;
  height?: number | { ft: number; in: number; } | null; // Can be number (cm) or object (ft/in)
  heightUnit?: 'cm' | 'ft';
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs';
  // From Step 3
  primaryGoal?: string;
  secondaryGoal?: string | null;
  // From Step 4
  activityLevel?: string; // Consider enum: 'sedentary', 'lightly_active', etc.
  availableDays?: string[]; // Array of day names
  workoutDuration?: string; // Consider enum: '30_mins', '1_hour', etc.
  // From Step 5
  availableEquipment?: string[]; // Array of equipment names
  hasGymMembership?: boolean;
  // From Step 6
  injuries?: string | null;
  medicalConditions?: string | null;
  otherLimitations?: string | null;
  onboardingComplete?: boolean;
  
  // Original/other settings fields (ensure they are kept if needed)
  theme?: string; // Example from signup default
}

// Default preferences for new users or if data is missing
const defaultPreferences: Partial<UserPreferences> = { // Use Partial as not all fields might be set initially
  firstName: '',
  lastName: '',
  name: '',
  age: null,
  gender: '',
  height: null,
  heightUnit: 'ft',
  weight: null,
  weightUnit: 'lbs',
  primaryGoal: '',
  secondaryGoal: null,
  activityLevel: '',
  availableDays: [],
  workoutDuration: '',
  availableEquipment: [],
  hasGymMembership: false,
  injuries: null,
  medicalConditions: null,
  otherLimitations: null,
  onboardingComplete: false,
  theme: 'system',
};

// The main content component for the settings page
function SettingsPageContent() {
  const { user, userData, loading: authLoading, refreshUserData, deleteAccount } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'' | 'success' | 'error'>('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Effect to load user preferences when auth state is ready
  useEffect(() => {
    if (!authLoading && user) {
      // Prioritize userData from context if available
      if (userData?.preferences) {
        console.log("Loading preferences from AuthContext:", userData.preferences);
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
               console.log("Loading preferences from Firestore:", docSnap.data().preferences);
               setPreferences({ ...defaultPreferences, ...docSnap.data().preferences });
            } else {
              console.log("No preferences found in Firestore, using defaults.");
              // Use defaults if no document or preferences field exists
              setPreferences(defaultPreferences);
              // Optionally, save these defaults back to Firestore if the doc exists but prefs don't
              if (docSnap.exists()) {
                  console.log("Saving default preferences back to Firestore.");
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

  // Handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    console.log(`handleChange - Name: ${name}, Value: ${value}, Type: ${type}`); // Log input changes

    setPreferences(prev => {
      if (!prev) return prev; // Should ideally not happen if initialized

      let newValue: any = value;

      // --- Type Conversions --- 
      // Convert empty string to null for optional number fields
      if ((name === 'age' || name === 'weight' || name === 'heightCm' || name === 'heightFt' || name === 'heightIn') && value === '') {
        newValue = null;
      }
      // Convert to number for number inputs (if not null)
      else if (type === 'number' && newValue !== null) {
        newValue = parseFloat(value);
        if (isNaN(newValue)) newValue = null; // Handle non-numeric input in number fields
      }
      // Convert string 'true'/'false' back to boolean for selects
      else if (name === 'hasGymMembership') {
        newValue = value === 'true';
      }
      // Convert comma-separated string to array for specific fields
      else if (name === 'availableDays' || name === 'availableEquipment') {
        // Split by comma, trim whitespace, filter out empty strings
        newValue = value.split(',').map(item => item.trim()).filter(Boolean);
      } 

      // --- State Update Logic --- 
      const updatedPrefs = { ...prev };

      // Handle height updates based on unit and specific input name
      if (name === 'heightUnit') {
         updatedPrefs.heightUnit = value as 'ft' | 'cm';
         // Reset height value when unit changes to avoid inconsistency
         updatedPrefs.height = null;
      } else if (name === 'heightCm') {
          // Only update if unit is 'cm'
          if (updatedPrefs.heightUnit === 'cm') {
             updatedPrefs.height = newValue; // Should be number or null
          }
      } else if (name === 'heightFt' || name === 'heightIn') {
          // Only update if unit is 'ft'
          if (updatedPrefs.heightUnit === 'ft') {
              const currentHeight = typeof prev.height === 'object' && prev.height !== null ? { ...prev.height } : { ft: null, in: null };
              if (name === 'heightFt') {
                  currentHeight.ft = newValue; // number or null
              } else { // heightIn
                  currentHeight.in = newValue; // number or null
              }
              // Store as object only if at least one value is present
              updatedPrefs.height = (currentHeight.ft !== null || currentHeight.in !== null) ? currentHeight : null;
          }
      } else {
          // Standard update for other fields
          // Use type assertion for safety if needed, but direct assignment is often fine
          (updatedPrefs as any)[name] = newValue;
      }

      console.log("Updated preferences state:", updatedPrefs); // Log state after update
      return updatedPrefs;
    });

    // Reset save status on any change
    setSaveStatus('');
  };

  // Function to save preferences to Firestore
  const handleSave = async () => {
    if (!user || !preferences) return;
    setIsSaving(true);
    setSaveStatus('');
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Create an object containing only the 'preferences' field to update
      const updateData = { preferences };
      console.log("Saving preferences:", updateData); // Log data before saving
      await updateDoc(userDocRef, updateData);
      setSaveStatus('success');
      console.log('Preferences saved successfully.');
      await refreshUserData(); // Call refreshUserData here
      console.log('AuthContext userData refreshed.');
      router.push('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      // Optionally hide success message after a delay
      if (saveStatus === 'success') {
        setTimeout(() => setSaveStatus(''), 3000); 
      }
    }
  };

  // --- Handle Account Deletion ---
  const handleDeleteAccount = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsDeleting(true);
    try {
      const deleted = await deleteAccount(); // Call the function from context
      if (deleted) {
        // AuthGuard should handle redirect automatically as user becomes null.
        // Optionally, force a redirect if needed:
        // router.push('/login-signup');
        // Alert is handled within deleteAccount function
      } else {
        // Deletion was cancelled or failed, alert is shown in context function
      }
    } catch (err: any) { 
      // Catch potential errors not caught inside deleteAccount (less likely)
      console.error("Error during account deletion process:", err);
      setError(err.message || 'An unexpected error occurred during account deletion.');
    } finally {
      setIsDeleting(false);
    }
  }

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
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={preferences.firstName ?? ''} // Handle potential undefined
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={preferences.lastName ?? ''} // Handle potential undefined
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
                      value={preferences.age ?? ''} // Handle null/undefined
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={preferences.gender ?? ''} // Handle undefined
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
                  <label htmlFor="primaryGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Goal</label>
                  <input
                    type="text"
                    id="primaryGoal"
                    name="primaryGoal"
                    value={preferences.primaryGoal ?? ''} // Handle undefined
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="secondaryGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Goal</label>
                  <input
                    type="text"
                    id="secondaryGoal"
                    name="secondaryGoal"
                    value={preferences.secondaryGoal ?? ''} // Handle null/undefined
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activity Level</label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={preferences.activityLevel ?? ''} // Handle undefined
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly_active">Lightly Active</option>
                    <option value="moderately_active">Moderately Active</option>
                    <option value="very_active">Very Active</option>
                    <option value="extra_active">Extra Active</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="availableDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Days (comma-separated)</label>
                  {/* TEMP FIX: Using text input for array. Needs better UI (e.g., checkboxes) */}
                  <input 
                    type="text"
                    id="availableDays"
                    name="availableDays"
                    value={preferences.availableDays?.join(', ') ?? ''} // Join array for display, handle undefined
                    onChange={handleChange} // TODO: Update handleChange to parse comma-separated string back to array
                    placeholder="e.g., Monday, Wednesday, Friday"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="workoutDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workout Duration Preference</label>
                  <select
                    id="workoutDuration"
                    name="workoutDuration"
                    value={preferences.workoutDuration ?? ''} // Handle undefined
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="30_mins">30 minutes</option>
                    <option value="1_hour">1 hour</option>
                    <option value="1.5_hours">1.5 hours</option>
                    <option value="2_hours">2 hours</option>
                  </select>
                </div>
              </div>

              {/* Time Constraints */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Time Constraints</h2>
                
                <div>
                  <label htmlFor="availableEquipment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Equipment (comma-separated)</label>
                   {/* TEMP FIX: Using text input for array. Needs better UI (e.g., checkboxes) */}
                  <input
                    type="text"
                    id="availableEquipment"
                    name="availableEquipment"
                    value={preferences.availableEquipment?.join(', ') ?? ''} // Join array for display, handle undefined
                    onChange={handleChange} // TODO: Update handleChange to parse comma-separated string back to array
                    placeholder="e.g., Dumbbells, Resistance Bands"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="hasGymMembership" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gym Membership?</label>
                  <select
                    id="hasGymMembership"
                    name="hasGymMembership"
                    value={preferences.hasGymMembership === undefined ? '' : String(preferences.hasGymMembership)} // Convert boolean/undefined to string
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              {/* Health Information */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Health Information</h2>
                
                <div>
                  <label htmlFor="injuries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Injuries</label>
                  <textarea
                    id="injuries"
                    name="injuries"
                    value={preferences.injuries ?? ''} // Handle null/undefined
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please list any injuries that might affect your fitness routine"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medical Conditions</label>
                  <textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    value={preferences.medicalConditions ?? ''} // Handle null/undefined
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please list any medical conditions that might affect your fitness routine"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="otherLimitations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other Limitations</label>
                  <textarea
                    id="otherLimitations"
                    name="otherLimitations"
                    value={preferences.otherLimitations ?? ''} // Handle null/undefined
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please list any other limitations that might affect your fitness routine"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Save Button & Status */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving || isDeleting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black dark:text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <div className="text-sm h-5"> {/* Placeholder for status message alignment */}
                  {saveStatus === 'success' && <span className="text-green-600 dark:text-green-400">Saved successfully!</span>}
                  {saveStatus === 'error' && <span className="text-red-600 dark:text-red-400">Failed to save settings.</span>}
                </div>
              </div>

              {/* --- Delete Account Section --- */}
              <div className="mt-10 pt-6 border-t border-red-200 dark:border-red-700">
                <h3 className="text-lg leading-6 font-medium text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                  Danger Zone
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  <p>Deleting your account is permanent and cannot be undone. All your profile information and chat history will be lost.</p>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isSaving || isDeleting}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                          Deleting...
                        </>
                      ) : (
                         'Delete My Account'
                      )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Default export wraps the content component
export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <SettingsPageContent />
    </div>
  );
}
