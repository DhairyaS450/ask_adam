
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

export type { Exercise, WorkoutDay };
