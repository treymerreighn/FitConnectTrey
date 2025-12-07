import { isAIAvailable, generateCompletion, getProviderName } from "./ai-provider.ts";
import type { StrengthInsight } from "../shared/schema.ts";

interface WorkoutExercise {
  name: string;
  sets: Array<{
    reps: number;
    weight?: number;
  }>;
}

interface WorkoutHistoryEntry {
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
}

interface StrengthInsightResult {
  summary: string;
  volumeAnalysis: string;
  strengthTrends: Array<{
    exercise: string;
    trend: "increasing" | "decreasing" | "maintaining" | "new";
    note: string;
  }>;
  muscleGroupFocus: string[];
  personalRecords: Array<{
    exercise: string;
    achievement: string;
    previousBest?: string;
  }>;
  recommendations: string[];
  motivationalMessage: string;
  recoveryTips: string[];
  nextWorkoutSuggestion?: string;
}

/**
 * AI-Powered Strength Insights System
 * Analyzes workouts and provides personalized insights for premium users
 */
export class AIStrengthInsights {
  
  /**
   * Generate insights for a completed workout
   */
  static async generateWorkoutInsights(
    currentWorkout: {
      exercises: WorkoutExercise[];
      duration?: number;
      workoutType?: string;
    },
    workoutHistory: WorkoutHistoryEntry[] = [],
    userGoals: string[] = []
  ): Promise<StrengthInsightResult> {
    // Check if AI is available, use fallback if not
    if (!isAIAvailable()) {
      console.log("[StrengthInsights] No AI provider - using fallback insights");
      return this.generateFallbackInsights(currentWorkout);
    }

    try {
      // Calculate basic stats for context
      const totalVolume = this.calculateTotalVolume(currentWorkout.exercises);
      const exerciseList = currentWorkout.exercises.map(e => e.name).join(', ');
      
      // Find potential PRs
      const potentialPRs = this.detectPotentialPRs(currentWorkout.exercises, workoutHistory);

      const systemPrompt = "You are an expert strength coach who provides encouraging, data-driven insights after workouts. Be specific and personalized. Always respond in valid JSON.";

      const userPrompt = `Analyze this completed workout and provide personalized insights.

CURRENT WORKOUT:
${JSON.stringify(currentWorkout, null, 2)}

TOTAL VOLUME: ${totalVolume} lbs
EXERCISES: ${exerciseList}
USER GOALS: ${userGoals.length > 0 ? userGoals.join(", ") : "General fitness"}

RECENT WORKOUT HISTORY (last 5 workouts):
${JSON.stringify(workoutHistory.slice(-5), null, 2)}

POTENTIAL PERSONAL RECORDS DETECTED:
${JSON.stringify(potentialPRs, null, 2)}

Provide:
1. Quick energizing summary (2-3 sentences)
2. Volume analysis (high/medium/low)
3. Strength trends per exercise
4. Muscle groups worked
5. Personal records achieved
6. 2-3 recommendations
7. Motivational message
8. Recovery tips
9. Next workout suggestion

Use emojis sparingly (💪 🔥 ⚡).

Respond in JSON:
{
  "summary": "string",
  "volumeAnalysis": "string",
  "strengthTrends": [{"exercise": "string", "trend": "increasing|decreasing|maintaining|new", "note": "string"}],
  "muscleGroupFocus": ["string"],
  "personalRecords": [{"exercise": "string", "achievement": "string", "previousBest": "string"}],
  "recommendations": ["string"],
  "motivationalMessage": "string",
  "recoveryTips": ["string"],
  "nextWorkoutSuggestion": "string"
}`;

      console.log(`[StrengthInsights] Generating with ${getProviderName()}...`);
      
      const responseText = await generateCompletion(systemPrompt, userPrompt, {
        maxTokens: 1200,
        temperature: 0.7,
        jsonMode: true,
      });

      const result = JSON.parse(responseText);
      
      // Validate and structure the response
      return this.validateInsightResponse(result);

    } catch (error) {
      console.error("Strength insights generation error:", error);
      // Return graceful fallback
      return this.generateFallbackInsights(currentWorkout);
    }
  }

  /**
   * Generate a weekly strength summary
   */
  static async generateWeeklySummary(
    weekWorkouts: WorkoutHistoryEntry[],
    previousWeekWorkouts: WorkoutHistoryEntry[] = [],
    userGoals: string[] = []
  ): Promise<{
    weeklyVolume: number;
    workoutCount: number;
    topExercises: string[];
    summary: string;
    achievements: string[];
    areasToFocus: string[];
    motivationalMessage: string;
  }> {
    const thisWeekVolume = weekWorkouts.reduce((sum, w) => 
      sum + this.calculateTotalVolume(w.exercises), 0);
    const lastWeekVolume = previousWeekWorkouts.reduce((sum, w) => 
      sum + this.calculateTotalVolume(w.exercises), 0);

    // Fallback if no AI available
    if (!isAIAvailable()) {
      return {
        weeklyVolume: thisWeekVolume,
        workoutCount: weekWorkouts.length,
        topExercises: this.getTopExercises(weekWorkouts),
        summary: `Completed ${weekWorkouts.length} workouts this week with ${thisWeekVolume.toLocaleString()} lbs total volume!`,
        achievements: thisWeekVolume > lastWeekVolume 
          ? ["Volume increased from last week! 📈"] 
          : ["Consistency is key - you showed up!"],
        areasToFocus: ["Keep building momentum"],
        motivationalMessage: "Every workout counts! 💪",
      };
    }

    try {
      const systemPrompt = "You are a motivating strength coach providing weekly summaries. Always respond in valid JSON.";

      const userPrompt = `Analyze this week's training:

THIS WEEK (${weekWorkouts.length} workouts):
${JSON.stringify(weekWorkouts, null, 2)}

LAST WEEK (${previousWeekWorkouts.length} workouts):
Volume comparison: ${thisWeekVolume} lbs vs ${lastWeekVolume} lbs

USER GOALS: ${userGoals.join(", ") || "General fitness"}

Provide a motivating weekly summary.

Respond in JSON:
{
  "summary": "string",
  "achievements": ["string"],
  "areasToFocus": ["string"],
  "topExercises": ["string"],
  "motivationalMessage": "string"
}`;

      console.log(`[WeeklySummary] Generating with ${getProviderName()}...`);
      
      const responseText = await generateCompletion(systemPrompt, userPrompt, {
        maxTokens: 800,
        temperature: 0.7,
        jsonMode: true,
      });

      const result = JSON.parse(responseText);

      return {
        weeklyVolume: thisWeekVolume,
        workoutCount: weekWorkouts.length,
        topExercises: result.topExercises || [],
        summary: result.summary || "Great week of training!",
        achievements: result.achievements || [],
        areasToFocus: result.areasToFocus || [],
        motivationalMessage: result.motivationalMessage || "Keep pushing! 💪",
      };

    } catch (error) {
      console.error("Weekly summary error:", error);
      return {
        weeklyVolume: thisWeekVolume,
        workoutCount: weekWorkouts.length,
        topExercises: this.getTopExercises(weekWorkouts),
        summary: `Completed ${weekWorkouts.length} workouts this week!`,
        achievements: ["Consistency is key - you showed up!"],
        areasToFocus: ["Keep building momentum"],
        motivationalMessage: "Every workout counts! 💪",
      };
    }
  }

  /**
   * Calculate total volume (sets × reps × weight)
   */
  private static calculateTotalVolume(exercises: WorkoutExercise[]): number {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
        const weight = set.weight || 0;
        return setTotal + (set.reps * weight);
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }

  /**
   * Get top exercises from workout history
   */
  private static getTopExercises(workouts: WorkoutHistoryEntry[]): string[] {
    const exerciseCounts = new Map<string, number>();
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const count = exerciseCounts.get(exercise.name) || 0;
        exerciseCounts.set(exercise.name, count + 1);
      }
    }
    
    return Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  /**
   * Detect potential personal records by comparing to history
   */
  private static detectPotentialPRs(
    currentExercises: WorkoutExercise[],
    history: WorkoutHistoryEntry[]
  ): Array<{ exercise: string; currentBest: number; previousBest: number }> {
    const prs: Array<{ exercise: string; currentBest: number; previousBest: number }> = [];

    for (const exercise of currentExercises) {
      // Find max weight in current workout
      const currentMax = Math.max(...exercise.sets.map(s => s.weight || 0));
      if (currentMax === 0) continue;

      // Find max weight in history for this exercise
      let previousMax = 0;
      for (const workout of history) {
        const historyExercise = workout.exercises.find(e => 
          e.name.toLowerCase() === exercise.name.toLowerCase()
        );
        if (historyExercise) {
          const historyMax = Math.max(...historyExercise.sets.map(s => s.weight || 0));
          if (historyMax > previousMax) previousMax = historyMax;
        }
      }

      // Check if current is a PR
      if (currentMax > previousMax && previousMax > 0) {
        prs.push({
          exercise: exercise.name,
          currentBest: currentMax,
          previousBest: previousMax,
        });
      }
    }

    return prs;
  }

  /**
   * Validate and structure the AI response
   */
  private static validateInsightResponse(result: any): StrengthInsightResult {
    return {
      summary: result.summary || "Solid workout completed! 💪",
      volumeAnalysis: result.volumeAnalysis || "Training volume logged successfully.",
      strengthTrends: Array.isArray(result.strengthTrends) 
        ? result.strengthTrends.map((t: any) => ({
            exercise: t.exercise || "Unknown",
            trend: ["increasing", "decreasing", "maintaining", "new"].includes(t.trend) 
              ? t.trend : "maintaining",
            note: t.note || "",
          }))
        : [],
      muscleGroupFocus: Array.isArray(result.muscleGroupFocus) 
        ? result.muscleGroupFocus 
        : ["Full body"],
      personalRecords: Array.isArray(result.personalRecords)
        ? result.personalRecords.map((pr: any) => ({
            exercise: pr.exercise || "",
            achievement: pr.achievement || "",
            previousBest: pr.previousBest,
          }))
        : [],
      recommendations: Array.isArray(result.recommendations)
        ? result.recommendations
        : ["Keep up the great work!"],
      motivationalMessage: result.motivationalMessage || "You're getting stronger every day! 🔥",
      recoveryTips: Array.isArray(result.recoveryTips)
        ? result.recoveryTips
        : ["Get plenty of rest", "Stay hydrated", "Eat protein within 2 hours"],
      nextWorkoutSuggestion: result.nextWorkoutSuggestion,
    };
  }

  /**
   * Generate fallback insights when AI is unavailable
   */
  private static generateFallbackInsights(workout: {
    exercises: WorkoutExercise[];
    duration?: number;
    workoutType?: string;
  }): StrengthInsightResult {
    const exerciseCount = workout.exercises.length;
    const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
    const totalVolume = this.calculateTotalVolume(workout.exercises);

    // Determine muscle groups based on exercise names
    const muscleGroups = this.inferMuscleGroups(workout.exercises);

    return {
      summary: `Great session! You completed ${exerciseCount} exercises with ${totalSets} total sets. 💪`,
      volumeAnalysis: totalVolume > 0 
        ? `Total volume: ${totalVolume.toLocaleString()} lbs lifted this session.`
        : `Completed ${totalSets} sets across ${exerciseCount} exercises.`,
      strengthTrends: workout.exercises.map(e => ({
        exercise: e.name,
        trend: "maintaining" as const,
        note: `${e.sets.length} sets completed`,
      })),
      muscleGroupFocus: muscleGroups,
      personalRecords: [],
      recommendations: [
        "Track your weights to monitor progress over time",
        "Ensure progressive overload by gradually increasing weight or reps",
        "Allow 48 hours between training the same muscle group",
      ],
      motivationalMessage: "Every workout brings you closer to your goals. Keep pushing! 🔥",
      recoveryTips: [
        "Hydrate well post-workout",
        "Consume protein within 2 hours",
        "Get 7-9 hours of sleep for optimal recovery",
      ],
      nextWorkoutSuggestion: muscleGroups.includes("Chest") || muscleGroups.includes("Shoulders")
        ? "Consider training back and biceps next"
        : muscleGroups.includes("Back") || muscleGroups.includes("Biceps")
        ? "Consider training chest and triceps next"
        : muscleGroups.includes("Legs") || muscleGroups.includes("Quadriceps")
        ? "Consider an upper body day next"
        : "Continue with your training split",
    };
  }

  /**
   * Infer muscle groups from exercise names
   */
  private static inferMuscleGroups(exercises: WorkoutExercise[]): string[] {
    const muscleKeywords: Record<string, string[]> = {
      "Chest": ["bench", "chest", "push-up", "pushup", "fly", "pec"],
      "Back": ["row", "pull", "lat", "deadlift", "back"],
      "Shoulders": ["shoulder", "press", "lateral", "delt", "overhead"],
      "Biceps": ["curl", "bicep"],
      "Triceps": ["tricep", "pushdown", "dip", "skull"],
      "Quadriceps": ["squat", "leg press", "lunge", "quad"],
      "Hamstrings": ["hamstring", "leg curl", "romanian"],
      "Glutes": ["glute", "hip thrust", "kickback"],
      "Core": ["ab", "core", "plank", "crunch"],
    };

    const foundGroups = new Set<string>();
    
    for (const exercise of exercises) {
      const nameLower = exercise.name.toLowerCase();
      for (const [muscle, keywords] of Object.entries(muscleKeywords)) {
        if (keywords.some(kw => nameLower.includes(kw))) {
          foundGroups.add(muscle);
        }
      }
    }

    return foundGroups.size > 0 ? Array.from(foundGroups) : ["Full Body"];
  }
}

/**
 * Convenience function to generate workout insights
 */
export async function generateWorkoutInsights(
  workout: {
    exercises: WorkoutExercise[];
    duration?: number;
    workoutType?: string;
  },
  history: WorkoutHistoryEntry[] = [],
  userGoals: string[] = []
): Promise<StrengthInsightResult> {
  return AIStrengthInsights.generateWorkoutInsights(workout, history, userGoals);
}

/**
 * Convenience function to generate weekly summary
 */
export async function generateWeeklySummary(
  weekWorkouts: WorkoutHistoryEntry[],
  previousWeekWorkouts: WorkoutHistoryEntry[] = [],
  userGoals: string[] = []
) {
  return AIStrengthInsights.generateWeeklySummary(weekWorkouts, previousWeekWorkouts, userGoals);
}
