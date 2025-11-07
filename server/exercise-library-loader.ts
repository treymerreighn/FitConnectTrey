import fs from 'fs';
import path from 'path';
import { Exercise } from '../shared/schema.ts';
import { BASIC_EXERCISES } from './simple-exercise-builder';
import { removeDuplicateExercises, logDuplicateRemovalStats } from './duplicate-remover';

/**
 * Loads exercises from multiple sources and removes duplicates:
 * 1. AI-generated comprehensive library (exerciseLibrary.json)
 * 2. Basic fallback exercises
 * 3. Combines and deduplicates
 */
export function loadExerciseLibrary(): Exercise[] {
  let allExercises: Exercise[] = [];
  
  try {
    // Try to load AI-generated exercises first
    const libraryPath = path.join(__dirname, 'exerciseLibrary.json');
    
    if (fs.existsSync(libraryPath)) {
      const libraryData = fs.readFileSync(libraryPath, 'utf8');
      const aiExercises: Exercise[] = JSON.parse(libraryData);
      
      if (Array.isArray(aiExercises) && aiExercises.length > 0) {
        console.log(`📚 Loaded ${aiExercises.length} AI-generated exercises`);
        allExercises = [...aiExercises];
      }
    }
  } catch (error) {
    console.log('⚠️ Could not load AI exercise library');
  }
  
  // Always include basic exercises as foundation
  console.log(`📚 Adding ${BASIC_EXERCISES.length} basic exercises`);
  allExercises = [...allExercises, ...BASIC_EXERCISES];
  
  // Remove duplicates - AI exercises take priority
  const uniqueExercises = removeDuplicateExercises(allExercises);
  logDuplicateRemovalStats(allExercises, uniqueExercises);
  
  return uniqueExercises;
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