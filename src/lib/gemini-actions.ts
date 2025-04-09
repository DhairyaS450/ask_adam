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

async function handleUpdateUserProfile(profileData: Record<string, any>) {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found for updating profile.");
    // Optionally throw an error or handle appropriately
    return;
  }

  if (!profileData || Object.keys(profileData).length === 0) {
      console.warn("Skipping UPDATE_USER_PROFILE: No data provided.", profileData);
      return;
  }

  const userProfileRef = doc(db, "users", user.uid);

  try {
    // Use setDoc with merge: true to update existing fields or create the doc if it doesn't exist
    await setDoc(userProfileRef, { preferences: profileData }, { merge: true });
    console.log(`User profile updated successfully for user ${user.uid}`);
  } catch (error) {
    console.error(`Error updating user profile for user ${user.uid}:`, error);
    // Optionally re-throw or handle the error based on application needs
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
  'UPDATE_PROFILE',
] as const;

type ActionType = typeof ACTION_MARKERS[number];

interface ParsedResponse {
  textResponse: string;
  actions: { type: string; data: any }[];
}

/**
 * Cleans a JSON string by removing markdown code block syntax and other formatting
 * @param {string} jsonStr - The JSON string to clean
 * @returns {string} - The cleaned JSON string
 */
const cleanJsonString = (jsonStr: string) => {
  // Remove markdown code block markers at the beginning (```json, ```, etc.)
  let cleaned = jsonStr.replace(/^```(\w+)?\s*/, '');
  
  // Remove trailing code block markers
  cleaned = cleaned.replace(/\s*```$/, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
};

/**
 * Parses a Gemini response string to separate the conversational text
 * from the action blocks.
 * @param responseText The full response text from Gemini.
 * @returns An object containing the clean text response and an array of identified actions.
 */
export function parseGeminiResponse(responseText: string): ParsedResponse {
  // Split response to extract the message part and actions part
  const parts = responseText.split(/Actions/);
  const message = parts[0].trim();

  if (!message) {
    console.error("Empty message part in response");
    return {
      textResponse: "I received your message but couldn't generate a proper response.",
      actions: []
    };
  }
  
  // If there's no action part, return just the message
  if (parts.length === 1) {
    return {
      textResponse: message,
      actions: []
    };
  }

  // Extract actions
  const actions: { type: string; data: any }[] = [];
  const actionBlocks = parts[1].trim().split(/\n(?=[A-Z_]+\n)/);
  
  for (const block of actionBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    
    // Split by the first newline to separate action type from data
    const firstNewlineIndex = trimmedBlock.indexOf('\n');
    if (firstNewlineIndex === -1) continue;
    
    const actionType = trimmedBlock.substring(0, firstNewlineIndex).trim();
    let jsonStr = trimmedBlock.substring(firstNewlineIndex).trim();
    
    if (!actionType || !jsonStr) continue;
    
    try {
      // Clean the JSON string before parsing
      jsonStr = cleanJsonString(jsonStr);
      
      // Log the cleaned JSON string for debugging
      console.info(`Attempting to parse cleaned JSON: ${jsonStr}`);
      
      const data = JSON.parse(jsonStr);
      actions.push({
        type: actionType,
        data
      });
    } catch (e) {
      console.error(`Error parsing JSON data for action ${actionType}:`, e);
      console.error(`JSON string was:`, jsonStr);
    }
  }

  return { textResponse: message, actions };
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
        case 'UPDATE_PROFILE':
          // TODO: Add validation for action.data shape
          await handleUpdateUserProfile(action.data as Record<string, any>);
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