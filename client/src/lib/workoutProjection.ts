import { apiRequest } from "@/lib/queryClient";
import { CURRENT_USER_ID } from "@/lib/constants";

type PlannedSet = { reps?: number; weight?: number; duration?: number };
type PlannedExercise = { name: string; exerciseId?: string; sets?: PlannedSet[] };

type ProjectionInput = {
  workoutName?: string;
  exercises: PlannedExercise[];
};

type ProjectionOutput = {
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    targetSets?: number;
    targetReps?: number;
    restTime?: number;
    sets?: Array<{ targetReps?: number; weight?: number; restTime?: number }>;
  }>;
};

function roundToNearest5(n: number) {
  return Math.round(n / 5) * 5;
}

function estimate1RMFromSet(weight?: number, reps?: number): number | null {
  if (!weight || !reps || reps <= 0) return null;
  // Epley formula
  return Math.round(weight * (1 + reps / 30));
}

function computeTargetWeight(oneRM: number, reps?: number) {
  if (!reps || reps <= 0) return 0;
  const est = oneRM / (1 + reps / 30);
  return Math.max(0, roundToNearest5(est));
}

async function resolveExerciseIdByName(name: string): Promise<string | undefined> {
  try {
    const list = await apiRequest("GET", `/api/exercises?search=${encodeURIComponent(name)}`);
    const exact = list.find((e: any) => e.name.toLowerCase() === name.toLowerCase());
    return (exact || list[0])?.id;
  } catch {
    return undefined;
  }
}

async function fetchUserProgress1RM(exerciseId: string): Promise<number | null> {
  try {
    const data = await apiRequest("GET", `/api/exercise-progress/${exerciseId}?userId=${CURRENT_USER_ID}`);
    if (!Array.isArray(data) || data.length === 0) return null;
    // Prefer provided oneRepMax if present; else estimate from (weight, reps)
    let best = 0;
    for (const p of data) {
      if (p.oneRepMax) best = Math.max(best, p.oneRepMax);
      else if (p.weight && p.reps) {
        const est = estimate1RMFromSet(p.weight, p.reps);
        if (est) best = Math.max(best, est);
      }
    }
    return best > 0 ? best : null;
  } catch {
    return null;
  }
}

export async function projectWorkoutForUser(input: ProjectionInput): Promise<ProjectionOutput> {
  const outExercises: ProjectionOutput["exercises"] = [];

  for (const ex of input.exercises) {
    const id = ex.exerciseId || (await resolveExerciseIdByName(ex.name)) || ex.name;
    const oneRM = ex.exerciseId ? await fetchUserProgress1RM(ex.exerciseId) : (await resolveExerciseIdByName(ex.name)) ? await fetchUserProgress1RM((await resolveExerciseIdByName(ex.name))!) : null;

    let sets = ex.sets && ex.sets.length > 0 ? ex.sets : undefined;
    if (sets && oneRM) {
      sets = sets.map(s => ({
        targetReps: s.reps,
        weight: computeTargetWeight(oneRM, s.reps),
      }));
    } else if (sets) {
      // No history: just pass through reps; weight 0
      sets = sets.map(s => ({ targetReps: s.reps, weight: 0 }));
    }

    outExercises.push({
      id,
      name: ex.name,
      sets,
      // if sets undefined, fallback to 3x8 generic
      ...(sets ? {} : { targetSets: 3, targetReps: 8 }),
    });
  }

  return {
    name: input.workoutName || "Workout",
    exercises: outExercises,
  };
}
