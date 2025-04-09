'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PencilIcon, TrashIcon, PlusCircleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutDay, Exercise } from '@/app/types/workouts';

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutDay[]>([]);
  const [editingExercise, setEditingExercise] = useState<{ dayId: string; exerciseId: string; data: Exercise } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showGuestMessage, setShowGuestMessage] = useState(false);
  const isSavingRef = useRef(false); // Ref to prevent rapid saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounced save

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Function to load data
  const loadWorkoutData = useCallback(async () => {
    console.log("Attempting to load data...");
    setLoading(true);
    setError(null);
    setShowGuestMessage(false);

    if (authLoading) {
        console.log("Auth still loading, waiting...");
        // Optional: keep setLoading(true) until authLoading is false
        return;
    }
     // Explicitly set loading false ONLY when authLoading is false AND data fetch is attempted/done
     if (!authLoading) {
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
             console.log("Load attempt finished, setting loading false.");
             setLoading(false);
        }
    } else {
        console.log("Auth loading is true, deferring load finish.");
        // Keep loading true if auth is still loading
        // setLoading(true) could be set here if needed
    }
  }, [user, authLoading]); // Dependency array

  // Debounced Function to save data
  const saveWorkoutData = useCallback(async (currentWorkoutSplit: WorkoutDay[]) => {
    if (authLoading) {
        console.log("Save deferred: Auth loading.");
        return; // Don't save while auth is still loading
    }
    if (isSavingRef.current) {
        console.log("Save deferred: Already saving.");
        return; // Prevent concurrent saves
    }

    console.log('Attempting to save workout data...');
    isSavingRef.current = true; // Mark as saving

    try {
      if (user) {
        console.log(`Saving data to Firestore for user ${user.uid}...`);
        const userWorkoutDocRef = doc(db, 'userWorkouts', user.uid);
        await setDoc(userWorkoutDocRef, { workoutSplit: currentWorkoutSplit }, { merge: true });
        console.log('Data saved to Firestore.');
        setShowGuestMessage(false);
      } else {
        console.log('Saving data to localStorage...');
        localStorage.setItem('workoutSplit', JSON.stringify(currentWorkoutSplit));
        setShowGuestMessage(true);
        console.log('Data saved to localStorage.');
      }
    } catch (err: any) {
      console.error('Error saving workout data:', err);
      setError('Failed to save workout data.');
    } finally {
         isSavingRef.current = false; // Mark as finished saving
         console.log('Save attempt finished.');
    }
  }, [user, authLoading]); // Dependencies for the save function itself


  // Effect for Initial Load
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]); // Depends only on the load function


  // Effect for Saving Data (Debounced)
  useEffect(() => {
    // Don't save during initial load or immediately after load if loading state is true
    if (!loading && !authLoading) {
       // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        // Set a new timeout to debounce the save
        saveTimeoutRef.current = setTimeout(() => {
            saveWorkoutData(workoutSplit);
        }, 1000); // Debounce saves by 1 second
    }

     // Cleanup function to clear timeout if component unmounts or dependencies change
     return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
     };
  // This effect depends on the workoutSplit state and the saveWorkoutData function.
  // Also depends on loading/authLoading to prevent saving prematurely.
  }, [workoutSplit, saveWorkoutData, loading, authLoading]);


  // --- Edit State Handlers ---
  const handleEditClick = (dayId: string, exercise: Exercise) => {
    // If trying to edit while another is being edited, cancel the previous one
    if (editingExercise && editingExercise.exerciseId !== exercise.id) {
        handleCancelEdit();
    }
    setEditingExercise({ dayId, exerciseId: exercise.id, data: { ...exercise } });
  };

  const handleCancelEdit = () => {
    // If the canceled edit was for a newly added (blank) exercise, remove it
     if (editingExercise && editingExercise.data.name === '' && editingExercise.data.reps === '') {
         handleDeleteExercise(editingExercise.dayId, editingExercise.exerciseId, true); // Pass true to skip confirm
     }
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

    // Basic validation
    if (!data.name.trim() || data.sets <= 0 || !String(data.reps).trim()) { // Ensure reps isn't empty
      alert('Please enter a valid exercise name, number of sets, and reps.');
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

  // --- Workout Day Handlers ---
 const handleAddWorkoutDay = () => {
  const workout_day = prompt('Enter the name of the new workout day');
  if (!workout_day) return;
  const newDay: WorkoutDay = {
     id: uuidv4(),
     name: workout_day,
     exercises: [],
   };
   // Add to the end for conventional feel
   setWorkoutSplit(currentSplit => [...currentSplit, newDay]);
   // TODO: Implement inline editing for the day name itself
   // TODO: Scroll the new day into view
 };

 const handleDeleteWorkoutDay = (dayId: string) => {
   // Use window.confirm for simplicity, replace with modal later if desired
   if (window.confirm('Are you sure you want to delete this workout day and all its exercises?')) {
     // Cancel editing if an exercise within this day is being edited
     if (editingExercise?.dayId === dayId) {
       handleCancelEdit();
     }
     setWorkoutSplit(currentSplit => currentSplit.filter(day => day.id !== dayId));
   }
 };

 // --- Exercise Handlers ---
 const handleAddExercise = (dayId: string) => {
     // Cancel any existing edit first
     if (editingExercise) {
         handleCancelEdit();
     }

    const newExercise: Exercise = {
        id: uuidv4(),
        name: '', // Start blank
        sets: 3,  // Default sets
        reps: '',  // Start blank
    };

    // Add the new exercise
    setWorkoutSplit(currentSplit =>
        currentSplit.map(day =>
            day.id === dayId
            ? { ...day, exercises: [...day.exercises, newExercise] }
            : day
        )
    );

    // Immediately set the new exercise as the one being edited
    setEditingExercise({ dayId: dayId, exerciseId: newExercise.id, data: { ...newExercise } });
    // TODO: Scroll the new row into view
 };

 const handleDeleteExercise = (dayId: string, exerciseId: string, skipConfirm = false) => {
    if (skipConfirm || window.confirm('Are you sure you want to delete this exercise?')) {
        // Prevent deleting while editing the same item (unless it's the cancel scenario)
        if (!skipConfirm && editingExercise?.dayId === dayId && editingExercise?.exerciseId === exerciseId) {
          handleCancelEdit(); // Cancel edit first
        }
        setWorkoutSplit(currentSplit => currentSplit.map(day =>
            day.id === dayId
            ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) }
            : day
        ));
    }
 };


  // --- UI Rendering ---
  if (authLoading || loading) { // Show loading indicator if either auth or data loading is in progress
      return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading workouts...</p>
          {/* TODO: Consider adding a more visually appealing spinner */}
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative md:static">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 overflow-y-auto pt-20 md:pt-4 padding-50"> {/* Added overflow-y-auto */}
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
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Workout Day
            </button>
          </div>

          {workoutSplit.length === 0 && !loading && (
            <p className="text-gray-600 dark:text-gray-400">No workout days defined yet. Add a day to get started!</p>
          )}

          <div className="space-y-6">
            {workoutSplit.map((day) => (
              <div key={day.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6"> {/* Added more padding on medium+ */}
                <div className="flex justify-between items-center mb-3">
                  {/* TODO: Add inline editing for day name */}
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{day.name}</h2>
                  <div className="flex items-center space-x-2">
                     <button
                      onClick={() => handleAddExercise(day.id)}
                      className="p-1 rounded-md text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-green-500"
                      title="Add Exercise"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </button>
                    {/* TODO: Add Edit Day Name Button Here if needed */}
                    <button
                      onClick={() => handleDeleteWorkoutDay(day.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
                      title="Delete Workout Day"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {day.exercises.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">No exercises added for this day.</p>
                ) : (
                  // Responsive Table Container
                  <div className="overflow-x-auto relative mt-4 border dark:border-gray-700 rounded-md">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      {/* Header - hidden on mobile */}
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 hidden md:table-header-group">
                        <tr>
                          <th scope="col" className="py-3 px-4">Exercise</th>
                          <th scope="col" className="py-3 px-4">Sets</th>
                          <th scope="col" className="py-3 px-4">Reps</th>
                          <th scope="col" className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      {/* Body - Becomes block layout on mobile */}
                      <tbody className="block md:table-row-group">
                        {day.exercises.map((exercise) => {
                          const isEditing = editingExercise?.dayId === day.id && editingExercise?.exerciseId === exercise.id;
                          return (
                            // Row - Becomes block on mobile
                            <tr key={exercise.id} className={`block md:table-row border-b dark:border-gray-700 ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                              {isEditing ? (
                                <>
                                  {/* Editing View Cells - Block layout on mobile */}
                                  <td className="px-4 py-2 block md:table-cell border-b md:border-none dark:border-gray-600">
                                    <span className="font-semibold md:hidden mr-2">Exercise:</span>
                                    <input
                                      type="text"
                                      name="name"
                                      value={editingExercise.data.name}
                                      onChange={handleEditChange}
                                      placeholder="Exercise Name"
                                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                      autoFocus // Focus the first input when editing starts
                                    />
                                  </td>
                                  <td className="px-4 py-2 block md:table-cell border-b md:border-none dark:border-gray-600">
                                    <span className="font-semibold md:hidden mr-2">Sets:</span>
                                    <input
                                      type="number"
                                      name="sets"
                                      value={editingExercise.data.sets}
                                      onChange={handleEditChange}
                                      min="1"
                                      placeholder="Sets"
                                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-20 p-2"
                                    />
                                  </td>
                                  <td className="px-4 py-2 block md:table-cell border-b md:border-none dark:border-gray-600">
                                    <span className="font-semibold md:hidden mr-2">Reps:</span>
                                    <input
                                      type="text"
                                      name="reps"
                                      value={editingExercise.data.reps}
                                      onChange={handleEditChange}
                                      placeholder="Reps (e.g. 8-12)"
                                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2"
                                    />
                                  </td>
                                  <td className="px-4 py-2 block md:table-cell text-right md:text-right"> {/* Align right consistently */}
                                      <span className="font-semibold md:hidden mr-2">Actions:</span> {/* Mobile label */}
                                      <div className="inline-flex space-x-2"> {/* Keep buttons inline */}
                                        <button onClick={handleSaveEdit} className="p-1 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500" title="Save">
                                          <CheckIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" title="Cancel">
                                          <XMarkIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  {/* Display View Cells - Block layout on mobile */}
                                  <td className="px-4 py-3 block md:table-cell border-b md:border-none dark:border-gray-600 font-medium text-gray-900 dark:text-white md:py-4">
                                      <span className="font-semibold md:hidden mr-2">Exercise:</span>
                                      {exercise.name}
                                  </td>
                                  <td className="px-4 py-3 block md:table-cell border-b md:border-none dark:border-gray-600 md:py-4">
                                      <span className="font-semibold md:hidden mr-2">Sets:</span>
                                      {exercise.sets}
                                  </td>
                                  <td className="px-4 py-3 block md:table-cell border-b md:border-none dark:border-gray-600 md:py-4">
                                      <span className="font-semibold md:hidden mr-2">Reps:</span>
                                      {exercise.reps}
                                  </td>
                                  <td className="px-4 py-3 block md:table-cell text-right md:text-right md:py-4">
                                      <span className="font-semibold md:hidden mr-2">Actions:</span>
                                      <div className="inline-flex space-x-2">
                                        <button
                                          onClick={() => handleEditClick(day.id, exercise)}
                                          className="p-1 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          title="Edit Exercise"
                                          disabled={!!editingExercise} // Disable edit if another is being edited
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteExercise(day.id, exercise.id)}
                                          className="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
                                          title="Delete Exercise"
                                          disabled={!!editingExercise} // Disable delete if another is being edited
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
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
        </main>
      </div>
    </div>
  );
}