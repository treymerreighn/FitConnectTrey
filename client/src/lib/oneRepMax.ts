/**
 * One Rep Max (1RM) Calculation Utilities
 * 
 * Multiple formulas for calculating estimated 1RM from sub-maximal lifts.
 * All calculations are free (no API costs) - pure mathematics.
 */

export interface OneRepMaxResult {
  weight: number;
  reps: number;
  estimatedMax: number;
  formula: string;
}

/**
 * Brzycki Formula (most popular, accurate for 1-10 reps)
 * 1RM = Weight × (36 / (37 - Reps))
 * 
 * Best for: Compound movements (bench, squat, deadlift)
 * Accurate range: 1-10 reps
 */
export function brzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 10) return epley(weight, reps); // Fall back to Epley for higher reps
  
  return weight * (36 / (37 - reps));
}

/**
 * Epley Formula (good for higher reps)
 * 1RM = Weight × (1 + Reps / 30)
 * 
 * Best for: Higher rep ranges (10-15 reps)
 * Accurate range: 1-15 reps
 */
export function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  
  return weight * (1 + reps / 30);
}

/**
 * Calculate estimated 1RM using Brzycki formula (most widely accepted)
 */
export function calculateOneRepMax(weight: number, reps: number): OneRepMaxResult {
  if (reps < 1) {
    throw new Error('Reps must be at least 1');
  }
  
  if (weight <= 0) {
    throw new Error('Weight must be positive');
  }
  
  // Use Brzycki as primary formula (most widely accepted)
  const estimatedMax = brzycki(weight, reps);
  
  return {
    weight,
    reps,
    estimatedMax: Math.round(estimatedMax * 10) / 10, // Round to 1 decimal
    formula: 'Brzycki'
  };
}

/**
 * Calculate percentage of 1RM for a given weight
 * Useful for programming training loads
 */
export function percentageOf1RM(actualWeight: number, estimatedMax: number): number {
  if (estimatedMax === 0) return 0;
  return Math.round((actualWeight / estimatedMax) * 100);
}

/**
 * Get the best 1RM estimate from multiple sets
 * Returns the highest estimated max from all sets
 */
export interface WorkoutSet {
  weight: number;
  reps: number;
}

export function getBest1RM(sets: WorkoutSet[]): OneRepMaxResult | null {
  if (sets.length === 0) return null;
  
  let bestEstimate: OneRepMaxResult | null = null;
  
  for (const set of sets) {
    // Only consider sets with at least 1 rep completed
    if (set.reps >= 1 && set.weight > 0) {
      const result = calculateOneRepMax(set.weight, set.reps);
      
      if (!bestEstimate || result.estimatedMax > bestEstimate.estimatedMax) {
        bestEstimate = result;
      }
    }
  }
  
  return bestEstimate;
}

/**
 * Track 1RM progress over time
 * Returns array of 1RM estimates sorted by date
 */
export interface MaxProgressPoint {
  date: Date;
  estimatedMax: number;
  weight: number;
  reps: number;
}

export function track1RMProgress(
  workoutHistory: Array<{ date: Date | string; sets: WorkoutSet[] }>
): MaxProgressPoint[] {
  const progress: MaxProgressPoint[] = [];
  
  for (const workout of workoutHistory) {
    const best = getBest1RM(workout.sets);
    
    if (best) {
      progress.push({
        date: typeof workout.date === 'string' ? new Date(workout.date) : workout.date,
        estimatedMax: best.estimatedMax,
        weight: best.weight,
        reps: best.reps
      });
    }
  }
  
  return progress.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get recommended training weights based on 1RM
 * Returns weights for different training intensities
 */
export interface TrainingWeights {
  light: number;    // 60-70% - High volume, technique
  moderate: number; // 70-85% - Hypertrophy
  heavy: number;    // 85-95% - Strength
  max: number;      // 95-100% - Peak strength
}

export function getTrainingWeights(estimatedMax: number): TrainingWeights {
  return {
    light: Math.round(estimatedMax * 0.65),      // 65%
    moderate: Math.round(estimatedMax * 0.775),  // 77.5%
    heavy: Math.round(estimatedMax * 0.90),      // 90%
    max: Math.round(estimatedMax * 0.975)        // 97.5%
  };
}
