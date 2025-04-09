import { WorkoutDay } from '@/app/types/workouts';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/firebase';

// Flag to track if a save or load operation is in progress (prevents concurrent operations)
let isSaving = false;
let isLoading = false;

// --- Helper Functions ---

/**
 * Gets the current user ID from the Firebase Auth system
 * @returns The current user's ID or null if not logged in
 */
function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Loads the current workout split from Firestore or localStorage
 * @returns The current workout split array
 */
async function loadCurrentWorkoutSplit(): Promise<WorkoutDay[]> {
  if (isLoading) {
    console.warn('Load operation already in progress, deferring');
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  isLoading = true;
  const userId = getCurrentUserId();
  
  try {
    if (userId) {
      // User is logged in, fetch from Firestore
      console.log(`Loading workout data from Firestore for user ${userId}...`);
      const userWorkoutDocRef = doc(db, 'userWorkouts', userId);
      const docSnap = await getDoc(userWorkoutDocRef);
      
      if (docSnap.exists() && docSnap.data().workoutSplit) {
        console.log('Loaded data from Firestore');
        return docSnap.data().workoutSplit;
      } else {
        console.log('No existing workout data in Firestore for this user');
        return [];
      }
    } else {
      // User is not logged in, fetch from localStorage
      console.log('Loading workout data from localStorage...');
      const localData = typeof window !== 'undefined' ? localStorage.getItem('workoutSplit') : null;
      
      if (localData) {
        console.log('Loaded data from localStorage');
        return JSON.parse(localData);
      } else {
        console.log('No existing workout data in localStorage');
        return [];
      }
    }
  } catch (error) {
    console.error('Error loading workout data:', error);
    return []; // Return empty array on error
  } finally {
    isLoading = false;
  }
}

/**
 * Saves the updated workout split to Firestore or localStorage
 * @param workoutSplit The workout split to save
 */
async function saveWorkoutSplit(workoutSplit: WorkoutDay[]): Promise<void> {
  if (isSaving) {
    console.warn('Save operation already in progress, deferring');
    while (isSaving) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const userId = getCurrentUserId();
  isSaving = true;
  
  console.log('Saving workout split:', workoutSplit);
  console.log('User ID:', userId);
  
  try {
    if (userId) {
      // User is logged in, save to Firestore
      console.log(`Saving workout data to Firestore for user ${userId}...`);
      const userWorkoutDocRef = doc(db, 'userWorkouts', userId);
      await setDoc(userWorkoutDocRef, { workoutSplit }, { merge: true });
      console.log('Data saved to Firestore');
    } else {
      // User is not logged in, save to localStorage
      if (typeof window !== 'undefined') {
        console.log('Saving workout data to localStorage...');
        localStorage.setItem('workoutSplit', JSON.stringify(workoutSplit));
        console.log('Data saved to localStorage');
      } else {
        console.warn('Cannot save to localStorage: Window is not defined');
      }
    }
  } catch (error) {
    console.error('Error saving workout data:', error);
    throw error; // Re-throw to let caller handle it
  } finally {
    isSaving = false;
  }
}

// --- Action Implementations ---

async function handleCreateWorkoutDay(data: WorkoutDay) {
  console.log('ACTION: CREATE_WORKOUT_DAY', data);
  
  if (isSaving) {
    console.warn('Save operation already in progress, deferring');
    while (isSaving) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  try {
    // Load current workout split
    const currentWorkoutSplit = await loadCurrentWorkoutSplit();
    
    // Create new workout day with generated ID if not provided
    const newDay: WorkoutDay = {
      ...data,
      id: data.id || uuidv4(),
      exercises: data.exercises.map(exercise => ({
        ...exercise,
        id: exercise.id || uuidv4()
      }))
    };
    
    // Add new day to workout split
    const updatedWorkoutSplit = [...currentWorkoutSplit, newDay];
    console.log('Updated workout split:', updatedWorkoutSplit);
    
    // Save updated workout split
    await saveWorkoutSplit(updatedWorkoutSplit);
    
  } catch (error) {
    console.error('Error in handleCreateWorkoutDay:', error);
  }
}

async function handleEditWorkoutDay(data: WorkoutDay & { id: string }) {
  console.log('ACTION: EDIT_WORKOUT_DAY', data);
  
  if (isSaving) {
    console.warn('Save operation already in progress, deferring');
    while (isSaving) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  try {
    // Load current workout split
    const currentWorkoutSplit = await loadCurrentWorkoutSplit();
    
    // Update the specific workout day
    const updatedWorkoutSplit = currentWorkoutSplit.map(day => 
      day.id === data.id ? {
        ...day,
        name: data.name,
        exercises: data.exercises.map(exercise => ({
          ...exercise,
          id: exercise.id || uuidv4()
        }))
      } : day
    );
    
    // Save updated workout split
    await saveWorkoutSplit(updatedWorkoutSplit);
    
  } catch (error) {
    console.error('Error in handleEditWorkoutDay:', error);
  }
}

async function handleDeleteWorkoutDay(data: { id: string }) {
  console.log('ACTION: DELETE_WORKOUT_DAY', data);
  
  if (isSaving) {
    console.warn('Save operation already in progress, deferring');
    while (isSaving) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  try {
    // Load current workout split
    const currentWorkoutSplit = await loadCurrentWorkoutSplit();
    
    // Remove the specified workout day
    const updatedWorkoutSplit = currentWorkoutSplit.filter(day => day.id !== data.id);
    
    // Save updated workout split
    await saveWorkoutSplit(updatedWorkoutSplit);
    
  } catch (error) {
    console.error('Error in handleDeleteWorkoutDay:', error);
  }
}

// --- Action Parsing Logic ---

export const ACTION_MARKERS = [
  'CREATE_WORKOUT_DAY',
  'EDIT_WORKOUT_DAY',
  'DELETE_WORKOUT_DAY',
] as const;

type ActionType = typeof ACTION_MARKERS[number];

interface ParsedResponse {
  textResponse: string;
  actions: { type: ActionType; data: any }[];
}

/**
 * Parses a Gemini response string to separate the conversational text
 * from the action blocks.
 * @param responseText The full response text from Gemini.
 * @returns An object containing the clean text response and an array of identified actions.
 */
export function parseGeminiResponse(responseText: string): ParsedResponse {
  console.log("Parsing Gemini response:", responseText);
  let currentText = responseText.trim();
  const actions: { type: ActionType; data: any }[] = [];

  // Iterate as long as action markers are found at the *end* of the remaining text
  let actionFoundInIteration;
  do {
    actionFoundInIteration = false;
    for (const marker of ACTION_MARKERS) {
      // Check if the text ends with the marker preceded by a newline (or start of string)
      const markerIndex = currentText.lastIndexOf(`\n${marker}`);
      if (markerIndex !== -1 && currentText.endsWith(marker) || (markerIndex === -1 && currentText.startsWith(marker))) {
         // Temporary split point: right before the marker or at the start
         const splitPoint = markerIndex === -1 ? 0 : markerIndex;
         const potentialJsonBlock = currentText.substring(splitPoint + (markerIndex === -1 ? marker.length : marker.length + 1)).trim(); // +1 for newline

          if (potentialJsonBlock.startsWith('{') && potentialJsonBlock.endsWith('}')) {
                try {
                    const jsonData = JSON.parse(potentialJsonBlock);
                    actions.unshift({ type: marker, data: jsonData }); // Add action to the beginning (reverse order)
                    currentText = currentText.substring(0, splitPoint).trim(); // Remove the action and JSON block
                    actionFoundInIteration = true;
                    break; // Found an action, restart the loop for the remaining text
                } catch (e) {
                    console.warn(`Could not parse JSON for action ${marker}:`, e);
                    // Proceed without modifying currentText, potentially leaving the malformed action
                }
            }
        // If it doesn't look like JSON, assume it's just part of the text response
      }
       else {
         // Handle case where marker might be followed by JSON directly without newline (robustness)
         const directMarkerIndex = currentText.lastIndexOf(marker + '\n{'); // Look for marker directly followed by JSON start
         if (directMarkerIndex !== -1 && currentText.substring(directMarkerIndex + marker.length).trim().startsWith('{')) {
             const potentialJsonBlock = currentText.substring(directMarkerIndex + marker.length).trim();
              if (potentialJsonBlock.endsWith('}')) {
                   try {
                       const jsonData = JSON.parse(potentialJsonBlock);
                       actions.unshift({ type: marker, data: jsonData });
                       currentText = currentText.substring(0, directMarkerIndex).trim();
                       actionFoundInIteration = true;
                       break;
                   } catch (e) {
                       console.warn(`Could not parse JSON for action ${marker} (direct):`, e);
                   }
               }
           }
       }
    }
  } while (actionFoundInIteration);

  return { textResponse: currentText, actions };
}

/**
 * Parses the Gemini response and executes the identified actions.
 * @param responseText The full response text from Gemini.
 * @returns The cleaned text response (without action blocks).
 */
export function parseAndExecuteActions(responseText: string): string {
  const { textResponse, actions } = parseGeminiResponse(responseText);

  // Execute actions in the order they appeared in the response
  actions.forEach(async (action) => {
    try {
      switch (action.type) {
        case 'CREATE_WORKOUT_DAY':
          // TODO: Add validation for action.data shape
          await handleCreateWorkoutDay(action.data as WorkoutDay);
          break;
        case 'EDIT_WORKOUT_DAY':
          // TODO: Add validation for action.data shape (needs id)
          if (action.data && typeof action.data.id === 'string') {
             await handleEditWorkoutDay(action.data as WorkoutDay & { id: string });
          } else {
             console.warn('Skipping EDIT_WORKOUT_DAY: Missing or invalid ID.', action.data);
          }
          break;
        case 'DELETE_WORKOUT_DAY':
          // TODO: Add validation for action.data shape (needs id)
           if (action.data && typeof action.data.id === 'string') {
               await handleDeleteWorkoutDay(action.data as { id: string });
           } else {
               console.warn('Skipping DELETE_WORKOUT_DAY: Missing or invalid ID.', action.data);
           }
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error, 'Data:', action.data);
    }
  });

  return textResponse;
}