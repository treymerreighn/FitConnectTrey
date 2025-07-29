import fs from 'fs';
import path from 'path';
import { Exercise } from '../shared/schema';
import { BASIC_EXERCISES } from './simple-exercise-builder';

/**
 * Loads exercises from multiple sources in priority order:
 * 1. AI-generated comprehensive library (exerciseLibrary.json)
 * 2. Basic fallback exercises
 */
export function loadExerciseLibrary(): Exercise[] {
  try {
    // Try to load AI-generated exercises first
    const libraryPath = path.join(__dirname, 'exerciseLibrary.json');
    
    if (fs.existsSync(libraryPath)) {
      const libraryData = fs.readFileSync(libraryPath, 'utf8');
      const exercises: Exercise[] = JSON.parse(libraryData);
      
      if (Array.isArray(exercises) && exercises.length > 0) {
        console.log(`📚 Loaded ${exercises.length} exercises from comprehensive library`);
        return exercises;
      }
    }
  } catch (error) {
    console.log('⚠️ Could not load comprehensive exercise library, using basic exercises');
  }
  
  // Fallback to basic exercises
  console.log(`📚 Using ${BASIC_EXERCISES.length} basic exercises as fallback`);
  return BASIC_EXERCISES;
}

/**
 * Gets the current exercise count from the loaded library
 */
export function getExerciseCount(): number {
  return loadExerciseLibrary().length;
}

/**
 * Filters exercises by muscle group
 */
export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  const exercises = loadExerciseLibrary();
  return exercises.filter(exercise => 
    exercise.muscleGroups.some(mg => 
      mg.toLowerCase().includes(muscleGroup.toLowerCase())
    )
  );
}

/**
 * Gets exercises by difficulty level
 */
export function getExercisesByDifficulty(difficulty: "Beginner" | "Intermediate" | "Advanced"): Exercise[] {
  const exercises = loadExerciseLibrary();
  return exercises.filter(exercise => exercise.difficulty === difficulty);
}