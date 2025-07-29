import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI-Powered Nutrition Coaching System
 */
export class AINutritionCoach {

  /**
   * Generate personalized meal plans based on fitness goals and preferences
   */
  static async generatePersonalizedMealPlan(userProfile: {
    fitnessGoals: string[];
    dietaryRestrictions: string[];
    preferences: string[];
    activityLevel: string;
    bodyMetrics: {
      weight: number;
      height: number;
      age: number;
      gender: string;
    };
    currentWorkoutPlan: any;
  }): Promise<{
    dailyMealPlan: any;
    nutritionStrategy: string;
    macroTargets: any;
    supplementRecommendations: string[];
    mealTimingAdvice: string;
  }> {
    try {
      const prompt = `You are a certified sports nutritionist creating a personalized meal plan:

USER PROFILE:
- Fitness Goals: ${userProfile.fitnessGoals.join(", ")}
- Dietary Restrictions: ${userProfile.dietaryRestrictions.join(", ")}
- Food Preferences: ${userProfile.preferences.join(", ")}
- Activity Level: ${userProfile.activityLevel}
- Body Metrics: ${JSON.stringify(userProfile.bodyMetrics)}
- Current Workout Plan: ${JSON.stringify(userProfile.currentWorkoutPlan)}

Create a comprehensive nutrition plan including:
1. Daily meal plan with specific foods and portions
2. Macro targets (protein, carbs, fats, calories)
3. Meal timing relative to workouts
4. Evidence-based supplement recommendations
5. Hydration guidelines

Focus on sustainable, practical nutrition that supports their fitness goals.

Respond with JSON:
{
  "dailyMealPlan": {
    "breakfast": {
      "foods": ["Food item with portion"],
      "macros": {"protein": 25, "carbs": 40, "fats": 15, "calories": 350},
      "notes": "Why this meal supports goals"
    },
    "snack1": {...},
    "lunch": {...},
    "snack2": {...},
    "dinner": {...},
    "postWorkout": {...}
  },
  "nutritionStrategy": "Overall nutritional approach explanation",
  "macroTargets": {
    "dailyProtein": 120,
    "dailyCarbs": 200,
    "dailyFats": 60,
    "dailyCalories": 2000
  },
  "supplementRecommendations": ["Evidence-based supplements"],
  "mealTimingAdvice": "When to eat relative to workouts"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified sports nutritionist providing evidence-based nutrition plans."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
      
    } catch (error) {
      console.error("Meal plan generation error:", error);
      throw new Error("Failed to generate personalized meal plan");
    }
  }

  /**
   * Analyze food photos and provide nutritional feedback
   */
  static async analyzeFoodPhoto(imageUrl: string, userGoals: string[]): Promise<{
    nutritionalAnalysis: string;
    recommendations: string[];
    macroEstimate: any;
    alignmentWithGoals: string;
  }> {
    try {
      const prompt = `You are a nutritionist analyzing this food photo for someone with goals: ${userGoals.join(", ")}

Provide:
1. Detailed nutritional analysis of visible foods
2. Estimated macros and calories
3. How well this aligns with their fitness goals
4. Specific recommendations for improvement

Be encouraging but provide actionable nutrition advice.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified nutritionist providing food analysis and recommendations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
      
    } catch (error) {
      console.error("Food photo analysis error:", error);
      return {
        nutritionalAnalysis: "Unable to analyze image, but focus on balanced nutrition",
        recommendations: ["Include lean protein", "Add vegetables", "Monitor portion sizes"],
        macroEstimate: { protein: 0, carbs: 0, fats: 0, calories: 0 },
        alignmentWithGoals: "Focus on whole foods to support your fitness goals"
      };
    }
  }

  /**
   * Generate dynamic nutrition adjustments based on workout performance
   */
  static async adjustNutritionForPerformance(workoutData: any, currentNutrition: any, performanceMetrics: any): Promise<{
    adjustments: string[];
    reasoning: string;
    newMacroTargets: any;
    timingSuggestions: string[];
  }> {
    try {
      const prompt = `You are a sports nutritionist optimizing nutrition for performance:

RECENT WORKOUT: ${JSON.stringify(workoutData)}
CURRENT NUTRITION: ${JSON.stringify(currentNutrition)}
PERFORMANCE METRICS: ${JSON.stringify(performanceMetrics)}

Analyze and provide:
1. Specific nutrition adjustments needed
2. Scientific reasoning for changes
3. Updated macro targets
4. Meal timing optimizations

Focus on evidence-based adjustments that will improve training adaptations.

Respond with JSON:
{
  "adjustments": ["Specific nutritional changes"],
  "reasoning": "Scientific explanation",
  "newMacroTargets": {"protein": 130, "carbs": 250, "fats": 70},
  "timingSuggestions": ["When to eat for optimal performance"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a sports nutritionist optimizing nutrition for athletic performance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
      
    } catch (error) {
      console.error("Nutrition adjustment error:", error);
      return {
        adjustments: ["Maintain current nutrition approach"],
        reasoning: "Current nutrition appears adequate",
        newMacroTargets: currentNutrition,
        timingSuggestions: ["Continue current meal timing"]
      };
    }
  }
}