import OpenAI from "openai";
import type { ExerciseProgress } from "@shared/schema";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ExerciseInsight {
  exercise: string;
  progressTrend: "improving" | "plateauing" | "declining";
  strengthLevel: "beginner" | "intermediate" | "advanced";
  insights: string[];
  recommendations: string[];
  confidenceScore: number;
}

export async function generateExerciseInsights(
  exerciseName: string,
  progressData: ExerciseProgress[]
): Promise<ExerciseInsight> {
  if (!process.env.OPENAI_API_KEY) {
    return generateMockInsights(exerciseName, progressData);
  }

  try {
    // Prepare progress data for AI analysis
    const progressSummary = progressData.slice(-10).map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      weight: entry.bestSet.weight || 0,
      reps: entry.bestSet.reps,
      oneRepMax: entry.bestSet.oneRepMax || 0,
      volume: entry.totalVolume || 0
    }));

    const prompt = `Analyze this exercise progress data for ${exerciseName}:

Progress Data (last 10 sessions):
${JSON.stringify(progressSummary, null, 2)}

Please provide analysis in JSON format with:
- progressTrend: "improving", "plateauing", or "declining"
- strengthLevel: "beginner", "intermediate", or "advanced" 
- insights: Array of 3-4 specific insights about their progress
- recommendations: Array of 3-4 actionable recommendations for improvement
- confidenceScore: 0-1 score of analysis confidence

Focus on:
1. Weight progression patterns
2. Volume trends
3. Strength development rate
4. Training consistency
5. Potential plateaus or improvements needed`;

    if (!openai) {
      throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert strength and conditioning coach with 15+ years experience analyzing workout progress data. Provide detailed, actionable insights based on exercise science principles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content!);
    
    return {
      exercise: exerciseName,
      progressTrend: analysis.progressTrend,
      strengthLevel: analysis.strengthLevel,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      confidenceScore: analysis.confidenceScore
    };

  } catch (error) {
    console.error("AI exercise insight generation failed:", error);
    return generateMockInsights(exerciseName, progressData);
  }
}

function generateMockInsights(exerciseName: string, progressData: ExerciseProgress[]): ExerciseInsight {
  if (progressData.length === 0) {
    return {
      exercise: exerciseName,
      progressTrend: "improving",
      strengthLevel: "beginner",
      insights: ["Start tracking your progress to get personalized insights"],
      recommendations: ["Begin with consistent training schedule"],
      confidenceScore: 0.5
    };
  }

  const recentData = progressData.slice(-5);
  const oldData = progressData.slice(0, 5);
  
  // Simple trend analysis
  const recentAvgWeight = recentData.reduce((sum, entry) => sum + (entry.bestSet.weight || 0), 0) / recentData.length;
  const oldAvgWeight = oldData.reduce((sum, entry) => sum + (entry.bestSet.weight || 0), 0) / oldData.length;
  
  const improvementRate = oldAvgWeight > 0 ? (recentAvgWeight - oldAvgWeight) / oldAvgWeight : 0;
  
  let progressTrend: "improving" | "plateauing" | "declining" = "plateauing";
  if (improvementRate > 0.05) progressTrend = "improving";
  else if (improvementRate < -0.05) progressTrend = "declining";

  const maxWeight = Math.max(...progressData.map(entry => entry.bestSet.weight || 0));
  let strengthLevel: "beginner" | "intermediate" | "advanced" = "beginner";
  
  // Basic strength level estimation (rough guidelines)
  if (exerciseName.toLowerCase().includes("bench")) {
    if (maxWeight > 225) strengthLevel = "advanced";
    else if (maxWeight > 135) strengthLevel = "intermediate";
  } else if (exerciseName.toLowerCase().includes("squat")) {
    if (maxWeight > 315) strengthLevel = "advanced";
    else if (maxWeight > 185) strengthLevel = "intermediate";
  } else if (exerciseName.toLowerCase().includes("deadlift")) {
    if (maxWeight > 405) strengthLevel = "advanced";
    else if (maxWeight > 225) strengthLevel = "intermediate";
  }

  return {
    exercise: exerciseName,
    progressTrend,
    strengthLevel,
    insights: [
      `Your ${exerciseName} shows ${progressTrend} trend over recent sessions`,
      `Current strength level appears to be ${strengthLevel}`,
      `You've completed ${progressData.length} tracked sessions`,
      `Best recorded weight: ${maxWeight}lbs`
    ],
    recommendations: [
      progressTrend === "plateauing" ? "Consider progressive overload or deload week" : "Keep up the consistent training",
      "Focus on proper form before adding weight",
      "Track rest periods between sets for optimal recovery",
      "Consider working with a trainer for technique refinement"
    ],
    confidenceScore: 0.7
  };
}

export async function generateWorkoutVolumeInsights(
  volumeData: { date: string; volume: number; duration: number }[]
): Promise<{
  trend: string;
  recommendations: string[];
  weeklyAverage: number;
}> {
  if (!process.env.OPENAI_API_KEY || volumeData.length === 0) {
    return {
      trend: "insufficient data",
      recommendations: ["Complete more workouts to generate insights"],
      weeklyAverage: 0
    };
  }

  try {
    const recentWeeks = volumeData.slice(-14); // Last 2 weeks
    const weeklyAverage = recentWeeks.reduce((sum, day) => sum + day.volume, 0) / recentWeeks.length;

    const prompt = `Analyze this workout volume data:
${JSON.stringify(recentWeeks, null, 2)}

Provide insights on training volume trends and recommendations for optimal progress.
Respond in JSON format with:
- trend: Brief description of volume pattern
- recommendations: Array of 3-4 specific recommendations
- weeklyAverage: Calculated weekly average volume`;

    if (!openai) {
      throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a strength coach analyzing workout volume patterns for optimal progression."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const analysis = JSON.parse(response.choices[0].message.content!);
    
    return {
      trend: analysis.trend,
      recommendations: analysis.recommendations,
      weeklyAverage: weeklyAverage
    };

  } catch (error) {
    console.error("Volume insights generation failed:", error);
    const weeklyAverage = volumeData.reduce((sum, day) => sum + day.volume, 0) / volumeData.length;
    
    return {
      trend: "steady progression",
      recommendations: [
        "Maintain consistent training frequency",
        "Gradually increase volume over time",
        "Allow adequate recovery between sessions"
      ],
      weeklyAverage: Math.round(weeklyAverage)
    };
  }
}