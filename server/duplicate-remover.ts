import { Exercise } from '../shared/schema.ts';

/**
 * Removes duplicate exercises based on name similarity
 * Keeps the more comprehensive version (AI-generated over basic)
 */
export function removeDuplicateExercises(exercises: Exercise[]): Exercise[] {
  const uniqueExercises = new Map<string, Exercise>();
  
  // Function to normalize exercise names for comparison
  const normalizeName = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Function to check if two names are similar
  const areNamesSimilar = (name1: string, name2: string): boolean => {
    const norm1 = normalizeName(name1);
    const norm2 = normalizeName(name2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Check if one name contains the other (for variations like "Push-ups" vs "Push-up")
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Check for common variations
    const variations = [
      ['pushup', 'push up', 'push-up'],
      ['pullup', 'pull up', 'pull-up'],
      ['situp', 'sit up', 'sit-up'],
      ['chinup', 'chin up', 'chin-up'],
      ['squat', 'squats'],
      ['lunge', 'lunges'],
      ['plank', 'planks']
    ];
    
    for (const group of variations) {
      if (group.some(v => norm1.includes(v)) && group.some(v => norm2.includes(v))) {
        return true;
      }
    }
    
    return false;
  };

  // Function to determine which exercise to keep (prefer AI-generated)
  const selectBetterExercise = (existing: Exercise, candidate: Exercise): Exercise => {
    // Prefer AI-generated exercises (they have more comprehensive data)
    if (existing.id.startsWith('ai-gen-') && !candidate.id.startsWith('ai-gen-')) {
      return existing;
    }
    if (!existing.id.startsWith('ai-gen-') && candidate.id.startsWith('ai-gen-')) {
      return candidate;
    }
    
    // If both are same type, prefer the one with more instructions
    if (candidate.instructions.length > existing.instructions.length) {
      return candidate;
    }
    
    return existing;
  };

  // Process exercises and remove duplicates
  for (const exercise of exercises) {
    const normalizedName = normalizeName(exercise.name);
    let isDuplicate = false;
    
    // Check against existing exercises
    for (const [existingKey, existingExercise] of uniqueExercises) {
      if (areNamesSimilar(exercise.name, existingExercise.name)) {
        // Found a duplicate - keep the better one
        const betterExercise = selectBetterExercise(existingExercise, exercise);
        uniqueExercises.set(existingKey, betterExercise);
        isDuplicate = true;
        break;
      }
    }
    
    // If not a duplicate, add it
    if (!isDuplicate) {
      uniqueExercises.set(normalizedName, exercise);
    }
  }

  const result = Array.from(uniqueExercises.values());
  console.log(`🧹 Removed duplicates: ${exercises.length} → ${result.length} exercises`);
  
  return result;
}

/**
 * Logs duplicate removal statistics
 */
export function logDuplicateRemovalStats(before: Exercise[], after: Exercise[]): void {
  const removed = before.length - after.length;
  if (removed > 0) {
    console.log(`📊 Duplicate removal stats:`);
    console.log(`   • Original: ${before.length} exercises`);
    console.log(`   • Unique: ${after.length} exercises`);
    console.log(`   • Duplicates removed: ${removed}`);
    
    // Show which exercises were kept vs removed
    const keptNames = new Set(after.map(e => e.name.toLowerCase()));
    const removedExercises = before.filter(e => !keptNames.has(e.name.toLowerCase()));
    
    if (removedExercises.length > 0) {
      console.log(`   • Removed exercises: ${removedExercises.map(e => e.name).join(', ')}`);
    }
  }
}