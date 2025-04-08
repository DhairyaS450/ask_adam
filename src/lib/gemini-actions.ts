// Define the structure of exercises and workout days, mirroring workout/page.tsx
// TODO: Consider moving these types to a shared location
interface Exercise {
    id?: string; // ID might not be present initially if coming from Gemini
    name: string;
    sets: number;
    reps: string | number;
}

interface WorkoutDay {
    id?: string; // ID might not be present initially if coming from Gemini
    name: string;
    exercises: Exercise[];
}


// --- Action Implementations (Placeholders) ---

// These functions currently just log the action.
// In a real application, they would interact with your state management (e.g., update Zustand store, call API, etc.)
// and potentially trigger UI updates.

function handleCreateWorkoutDay(data: WorkoutDay) {
  console.log('ACTION: CREATE_WORKOUT_DAY', data);
  // TODO: Implement actual logic to add a workout day to the state/database
}

function handleEditWorkoutDay(data: WorkoutDay & { id: string }) { // Edit requires an ID
  console.log('ACTION: EDIT_WORKOUT_DAY', data);
  // TODO: Implement actual logic to edit a workout day in the state/database
}

function handleDeleteWorkoutDay(data: { id: string }) { // Delete requires an ID
  console.log('ACTION: DELETE_WORKOUT_DAY', data);
  // TODO: Implement actual logic to delete a workout day from the state/database
}

// --- Action Parsing Logic ---

const ACTION_MARKERS = [
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
  actions.forEach(action => {
    try {
      switch (action.type) {
        case 'CREATE_WORKOUT_DAY':
          // TODO: Add validation for action.data shape
          handleCreateWorkoutDay(action.data as WorkoutDay);
          break;
        case 'EDIT_WORKOUT_DAY':
          // TODO: Add validation for action.data shape (needs id)
          if (action.data && typeof action.data.id === 'string') {
             handleEditWorkoutDay(action.data as WorkoutDay & { id: string });
          } else {
             console.warn('Skipping EDIT_WORKOUT_DAY: Missing or invalid ID.', action.data);
          }
          break;
        case 'DELETE_WORKOUT_DAY':
          // TODO: Add validation for action.data shape (needs id)
           if (action.data && typeof action.data.id === 'string') {
               handleDeleteWorkoutDay(action.data as { id: string });
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