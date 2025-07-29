import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Next-Level AI Workout Intelligence System
 */
export class AIWorkoutIntelligence {

  /**
   * Smart Exercise Sequencing - AI determines optimal exercise order
   */
  static async optimizeExerciseSequence(exercises: any[], userGoals: string[], fitnessLevel: string): Promise<any[]> {
    try {
      const exerciseData = exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        muscleGroups: ex.muscleGroups,
        difficulty: ex.difficulty
      }));

      const prompt = `You are an exercise science expert. Optimize the sequence of these exercises for maximum effectiveness:

EXERCISES: ${JSON.stringify(exerciseData)}
USER GOALS: ${userGoals.join(", ")}
FITNESS LEVEL: ${fitnessLevel}

Reorder exercises considering:
1. Muscle group activation patterns
2. Energy system demands
3. Fatigue management
4. Movement quality preservation
5. Goal-specific adaptations

Return the exercises in optimal order with brief reasoning for each placement.

Respond with JSON:
{
  "optimizedSequence": [
    {
      "exerciseName": "Name",
      "position": 1,
      "reasoning": "Why this exercise goes here"
    }
  ],
  "overallStrategy": "Explanation of the sequencing strategy"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an exercise science expert optimizing workout sequences for maximum effectiveness."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Reorder exercises based on AI optimization
      const optimizedExercises = [];
      for (const item of result.optimizedSequence || []) {
        const exercise = exercises.find(ex => ex.name === item.exerciseName);
        if (exercise) {
          optimizedExercises.push({
            ...exercise,
            aiReasoning: item.reasoning
          });
        }
      }

      return optimizedExercises.length > 0 ? optimizedExercises : exercises;
      
    } catch (error) {
      console.error("Exercise sequencing error:", error);
      return exercises;
    }
  }

  /**
   * Dynamic Difficulty Adjustment - AI adjusts workout intensity in real-time
   */
  static async adjustWorkoutDifficulty(currentWorkout: any, userPerformanceData: any, userFeedback: string): Promise<{
    adjustedWorkout: any;
    modifications: string[];
    reasoning: string;
  }> {
    try {
      const prompt = `You are an AI fitness coach analyzing real-time performance data:

CURRENT WORKOUT: ${JSON.stringify(currentWorkout)}
PERFORMANCE DATA: ${JSON.stringify(userPerformanceData)}
USER FEEDBACK: "${userFeedback}"

Adjust workout difficulty in real-time considering:
1. Heart rate data (if available)
2. Reported exertion level
3. Form quality indicators
4. Historical performance
5. Safety considerations

Provide specific modifications for sets, reps, weight, or rest periods.

Respond with JSON:
{
  "adjustedWorkout": {updated workout object},
  "modifications": ["List of specific changes made"],
  "reasoning": "Why these adjustments optimize the workout"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an AI fitness coach making real-time workout adjustments for optimal training adaptation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || '{"adjustedWorkout": null, "modifications": [], "reasoning": "No adjustments needed"}');
      
    } catch (error) {
      console.error("Difficulty adjustment error:", error);
      return {
        adjustedWorkout: currentWorkout,
        modifications: ["Continue with current parameters"],
        reasoning: "Maintaining current workout structure"
      };
    }
  }

  /**
   * Predictive Recovery Analytics - AI predicts optimal rest and recovery
   */
  static async predictRecoveryNeeds(workoutHistory: any[], sleepData: any, stressLevel: string): Promise<{
    recoveryRecommendation: string;
    nextWorkoutAdjustments: string[];
    activeRecoveryOptions: string[];
    riskAssessment: string;
  }> {
    try {
      const prompt = `You are a sports science AI analyzing recovery needs:

WORKOUT HISTORY (Last 7 days): ${JSON.stringify(workoutHistory)}
SLEEP DATA: ${JSON.stringify(sleepData)}
STRESS LEVEL: ${stressLevel}

Predict optimal recovery strategy considering:
1. Training load accumulation
2. Sleep quality and duration
3. Stress impact on recovery
4. Injury risk factors
5. Performance optimization

Provide specific, actionable recovery recommendations.

Respond with JSON:
{
  "recoveryRecommendation": "Primary recovery strategy",
  "nextWorkoutAdjustments": ["Specific workout modifications"],
  "activeRecoveryOptions": ["Recommended active recovery activities"],
  "riskAssessment": "Current injury/overtraining risk level"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a sports science AI providing evidence-based recovery recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || '{"recoveryRecommendation": "Standard recovery protocol", "nextWorkoutAdjustments": [], "activeRecoveryOptions": [], "riskAssessment": "Low risk"}');
      
    } catch (error) {
      console.error("Recovery prediction error:", error);
      return {
        recoveryRecommendation: "Focus on adequate sleep and hydration",
        nextWorkoutAdjustments: ["Monitor energy levels"],
        activeRecoveryOptions: ["Light walking", "Gentle stretching"],
        riskAssessment: "Low risk - continue current program"
      };
    }
  }

  /**
   * Intelligent Exercise Substitution - AI finds perfect exercise alternatives
   */
  static async findIntelligentSubstitutions(targetExercise: string, reason: string, availableEquipment: string[], userLimitations: string[]): Promise<{
    recommendations: Array<{
      exercise: string;
      reasoning: string;
      effectiveness: number;
      modifications: string[];
    }>;
    alternativeApproach: string;
  }> {
    try {
      const exercises = await storage.getAllExercises();
      const exerciseList = exercises.map(ex => `${ex.name} (${ex.category}, equipment: ${ex.equipment.join("/")}, muscles: ${ex.muscleGroups.join("/")}, difficulty: ${ex.difficulty})`).join("\n");

      const prompt = `You are an exercise science expert finding intelligent substitutions:

TARGET EXERCISE: ${targetExercise}
SUBSTITUTION REASON: ${reason}
AVAILABLE EQUIPMENT: ${availableEquipment.join(", ")}
USER LIMITATIONS: ${userLimitations.join(", ")}

AVAILABLE EXERCISES:
${exerciseList}

Find the best substitutions that:
1. Target the same primary muscle groups
2. Match the movement pattern when possible
3. Work with available equipment
4. Respect user limitations
5. Maintain training stimulus

Rank substitutions by effectiveness (1-100 scale).

Respond with JSON:
{
  "recommendations": [
    {
      "exercise": "Exercise name from list",
      "reasoning": "Why this is an excellent substitute",
      "effectiveness": 95,
      "modifications": ["Any needed modifications"]
    }
  ],
  "alternativeApproach": "Creative training approach if no direct substitutes exist"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an exercise science expert providing intelligent exercise substitutions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || '{"recommendations": [], "alternativeApproach": "Consider bodyweight alternatives"}');
      
    } catch (error) {
      console.error("Exercise substitution error:", error);
      return {
        recommendations: [
          {
            exercise: "Modified version of target exercise",
            reasoning: "Maintains similar movement pattern",
            effectiveness: 80,
            modifications: ["Adjust range of motion", "Reduce resistance"]
          }
        ],
        alternativeApproach: "Focus on fundamental movement patterns with available equipment"
      };
    }
  }
}