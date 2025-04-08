'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PencilIcon, TrashIcon, PlusCircleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { db } from '@/lib/firebase'; // Import db instance
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Define data structures
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string | number; // Allow rep ranges like '8-12'
}

interface WorkoutDay {
  id: string;
  name: string; // e.g., "Push Day", "Pull Day"
  exercises: Exercise[];
}

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutDay[]>([]);
  const [editingExercise, setEditingExercise] = useState<{ dayId: string; exerciseId: string; data: Exercise } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showGuestMessage, setShowGuestMessage] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Function to load data
  const loadWorkoutData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowGuestMessage(false);

    if (authLoading) return; // Wait for auth state to settle

    try {
      if (user) {
        console.log(`User ${user.uid} logged in. Fetching from Firestore...`);
        const userWorkoutDocRef = doc(db, 'userWorkouts', user.uid);
        const docSnap = await getDoc(userWorkoutDocRef);
        if (docSnap.exists() && docSnap.data().workoutSplit) {
          setWorkoutSplit(docSnap.data().workoutSplit);
          console.log('Loaded data from Firestore:', docSnap.data().workoutSplit);
        } else {
          console.log('No workout data found in Firestore for user, initializing empty.');
          setWorkoutSplit([]); // Initialize if no data exists
        }
      } else {
        console.log('User not logged in. Fetching from localStorage...');
        const localData = localStorage.getItem('workoutSplit');
        if (localData) {
          setWorkoutSplit(JSON.parse(localData));
          console.log('Loaded data from localStorage:', JSON.parse(localData));
          setShowGuestMessage(true); // Show message for guests
        } else {
          console.log('No workout data found in localStorage, initializing empty.');
          setWorkoutSplit([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading workout data:', err);
      setError('Failed to load workout data.');
      setWorkoutSplit([]); // Reset to empty on error
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Function to save data
  const saveWorkoutData = useCallback(async () => {
    if (authLoading || loading) return; // Don't save while auth is changing or initial load is happening

    console.log('Workout data changed, attempting to save...');

    try {
      if (user) {
        console.log(`Saving data to Firestore for user ${user.uid}...`);
        const userWorkoutDocRef = doc(db, 'userWorkouts', user.uid);
        // Use setDoc with merge: true or updateDoc to avoid overwriting other potential fields
        await setDoc(userWorkoutDocRef, { workoutSplit }, { merge: true }); 
        console.log('Data saved to Firestore.');
        setShowGuestMessage(false); // Hide guest message if user logs in and saves
      } else {
        console.log('Saving data to localStorage...');
        localStorage.setItem('workoutSplit', JSON.stringify(workoutSplit));
        setShowGuestMessage(true); // Ensure message is shown for guests
        console.log('Data saved to localStorage.');
      }
    } catch (err: any) {
      console.error('Error saving workout data:', err);
      setError('Failed to save workout data.');
      // Optionally, add user feedback about the save failure
    }
  }, [workoutSplit, user, authLoading, loading]);

  // Load data on mount and when user/authLoading changes
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  // Save data whenever workoutSplit changes (and user/auth state is stable)
  // Debounce or throttle this in a real app if updates are very frequent
  useEffect(() => {
    // Avoid saving during initial load or immediately after loading
    if (!loading) {
      saveWorkoutData();
    }
  }, [workoutSplit, saveWorkoutData, loading]);

  // --- Edit State Handlers ---
  const handleEditClick = (dayId: string, exercise: Exercise) => {
    setEditingExercise({ dayId, exerciseId: exercise.id, data: { ...exercise } });
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingExercise) return;
    const { name, value } = e.target;
    setEditingExercise({
      ...editingExercise,
      data: {
        ...editingExercise.data,
        // Handle 'sets' specifically as a number
        [name]: name === 'sets' ? parseInt(value, 10) || 0 : value,
      },
    });
  };

  const handleSaveEdit = () => {
    if (!editingExercise) return;

    const { dayId, exerciseId, data } = editingExercise;

    // Basic validation (optional)
    if (!data.name.trim() || data.sets <= 0) {
      alert('Please enter a valid exercise name and number of sets.');
      return;
    }

    setWorkoutSplit(currentSplit =>
      currentSplit.map(day =>
        day.id === dayId
          ? { 
              ...day, 
              exercises: day.exercises.map(ex => 
                ex.id === exerciseId ? { ...data } : ex // Update the specific exercise
              )
            }
          : day
      )
    );
    setEditingExercise(null); // Exit editing mode
  };

  const handleDeleteExercise = (dayId: string, exerciseId: string) => {
    // Prevent deleting while editing the same item
    if (editingExercise?.dayId === dayId && editingExercise?.exerciseId === exerciseId) {
      handleCancelEdit();
    }
    setWorkoutSplit(workoutSplit.map(day => 
        day.id === dayId
        ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) }
        : day
    ));
  };

  const handleDeleteWorkoutDay = (dayId: string) => {
    if (window.confirm('Are you sure you want to delete this workout day and all its exercises?')) {
      // Also ensure we're not trying to edit something within the day being deleted
      if (editingExercise?.dayId === dayId) {
        handleCancelEdit();
      }
      setWorkoutSplit(workoutSplit.filter(day => day.id !== dayId));
    }
  };

  const handleAddWorkoutDay = () => {
    const newDayName = prompt('Enter name for the new workout day (e.g., Push Day):');
    if (newDayName) {
      const newDay: WorkoutDay = {
        id: uuidv4(),
        name: newDayName,
        exercises: [],
      };
      setWorkoutSplit([...workoutSplit, newDay]);
    }
  };

  const handleAddExercise = (dayId: string) => {
    const exerciseName = prompt('Enter exercise name:');
    const sets = prompt('Enter number of sets:');
    const reps = prompt('Enter number of reps (e.g., 10 or 8-12):');

    if (exerciseName && sets && reps) {
        const setsNumber = parseInt(sets, 10);
        if (!isNaN(setsNumber)) {
            const newExercise: Exercise = {
                id: uuidv4(),
                name: exerciseName,
                sets: setsNumber,
                reps: reps, // Keep as string or number
            };
            setWorkoutSplit(workoutSplit.map(day => 
                day.id === dayId 
                ? { ...day, exercises: [...day.exercises, newExercise] } 
                : day
            ));
        } else {
            alert('Please enter a valid number for sets.');
        }
    }
 };

  // --- UI Rendering --- 
  if (authLoading || loading) {
      return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading workouts...</p>
          {/* Consider adding a spinner here */}
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 overflow-y-auto pt-20 md:pt-4 padding-50">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">My Workout Split</h1>
          
          {showGuestMessage && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm">
              You are not logged in. Workouts are saved locally in this browser only. Log in to save and sync across devices.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
              Error: {error}
            </div>
          )}

          <div className="mb-6">
            <button 
              onClick={handleAddWorkoutDay}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Workout Day
            </button>
          </div>

          {workoutSplit.length === 0 && !loading && (
            <p className="text-gray-600 dark:text-gray-400">No workout days defined yet. Add a day to get started!</p>
          )}

          <div className="space-y-6"> 
            {workoutSplit.map((day) => (
              <div key={day.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{day.name}</h2>
                  <div>
                    <button 
                      onClick={() => handleAddExercise(day.id)}
                      className="p-1 rounded-md text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 transition-colors"
                      title="Add Exercise"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </button>
                    {/* Add Edit Day Name Button Here if needed */}
                    <button 
                      onClick={() => handleDeleteWorkoutDay(day.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Delete Workout Day"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {day.exercises.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No exercises added for this day.</p>
                ) : (
                  <div className="overflow-x-auto relative mt-4">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="py-3 px-6">Exercise</th>
                          <th scope="col" className="py-3 px-6">Sets</th>
                          <th scope="col" className="py-3 px-6">Reps</th>
                          <th scope="col" className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((exercise) => {
                          const isEditing = editingExercise?.dayId === day.id && editingExercise?.exerciseId === exercise.id;
                          return (
                            <tr key={exercise.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                              {isEditing ? (
                                <>
                                  {/* Editing View */}
                                  <td className="py-2 px-6">
                                    <input 
                                      type="text" 
                                      name="name"
                                      value={editingExercise.data.name}
                                      onChange={handleEditChange}
                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-6">
                                    <input 
                                      type="number" 
                                      name="sets"
                                      value={editingExercise.data.sets}
                                      onChange={handleEditChange}
                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-6">
                                    <input 
                                      type="text" // Keep as text for ranges like 8-12
                                      name="reps"
                                      value={editingExercise.data.reps}
                                      onChange={handleEditChange}
                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-6 text-right">
                                    <button onClick={handleSaveEdit} className="p-1 rounded-md text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 mr-1" title="Save">
                                      <CheckIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={handleCancelEdit} className="p-1 rounded-md text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Cancel">
                                      <XMarkIcon className="h-5 w-5" />
                                    </button>
                                  </td>
                                </>                                  
                              ) : (
                                <>
                                  {/* Display View */}
                                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">{exercise.name}</td>
                                  <td className="py-4 px-6">{exercise.sets}</td>
                                  <td className="py-4 px-6">{exercise.reps}</td>
                                  <td className="py-4 px-6 text-right">
                                    <button 
                                      onClick={() => handleEditClick(day.id, exercise)}
                                      className="p-1 rounded-md text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 mr-1 transition-colors" 
                                      title="Edit Exercise"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteExercise(day.id, exercise.id)}
                                      className="p-1 rounded-md text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      title="Delete Exercise"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                </>                                  
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Old Table - Keep for reference or remove */}
          {/* 
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Workout</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {workouts.map((workout, index) => (
                  <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[1]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{workout[2]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleEdit(index)}
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleDelete(index)}
                        >
                          <TrashIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          */}
        </main>
      </div>
    </div>
  )
}
