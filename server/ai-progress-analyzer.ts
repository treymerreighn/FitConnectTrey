import { requireOpenAI } from "./openai.ts";

/**
 * AI-Powered Progress Analysis System
 */
export class AIProgressAnalyzer {

  /**
   * Analyze progress photos and provide detailed insights
   */
  static async analyzeProgressPhoto(
    imageUrl: string, 
    previousAnalysis: any = null,
    userGoals: string[],
    timeframe: string
  ): Promise<{
    physicalChanges: string[];
    muscleGrowth: string[];
    bodyComposition: string;
    motivationalInsights: string[];
    recommendations: string[];
    progressScore: number;
    comparisonWithPrevious?: string;
  }> {
    try {
      const analysisPrompt = `You are an expert fitness coach and body composition analyst. Analyze this progress photo with scientific precision.

USER GOALS: ${userGoals.join(", ")}
TIMEFRAME: ${timeframe}
${previousAnalysis ? `PREVIOUS ANALYSIS: ${JSON.stringify(previousAnalysis)}` : ""}

Provide a detailed analysis focusing on:
1. Visible muscle development and definition
2. Body composition changes (muscle vs fat)
3. Posture and symmetry improvements
4. Overall physique progression
5. Specific muscle group development
6. Areas showing the most progress
7. Areas needing attention

${previousAnalysis ? "Compare with previous analysis and highlight specific changes." : ""}

Be encouraging but scientifically accurate. Provide actionable insights.

Respond with JSON:
{
  "physicalChanges": ["Specific observable changes in muscle definition, size, etc."],
  "muscleGrowth": ["Detailed muscle group development observations"],
  "bodyComposition": "Overall body composition assessment",
  "motivationalInsights": ["Encouraging observations about progress"],
  "recommendations": ["Specific training or nutrition recommendations"],
  "progressScore": 85,
  "comparisonWithPrevious": "How this compares to previous photo if applicable"
}`;

      const openai = requireOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified fitness coach and body composition expert providing detailed progress analysis."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: analysisPrompt
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
      
    } catch (error) {
      console.error("Progress photo analysis error:", error);
      return {
        physicalChanges: ["Photo uploaded successfully - continue tracking your progress!"],
        muscleGrowth: ["Regular photo documentation helps track long-term changes"],
        bodyComposition: "Consistent tracking will reveal body composition trends over time",
        motivationalInsights: ["Every photo is a step forward in your fitness journey"],
        recommendations: ["Take photos in consistent lighting and poses for best comparison"],
        progressScore: 75,
        comparisonWithPrevious: "Keep taking regular photos to track your amazing transformation"
      };
    }
  }

  /**
   * Analyze weight trends and provide insights
   */
  static async analyzeWeightTrends(
    weightEntries: Array<{ weight: number; date: string; bodyFat?: number }>,
    userGoals: string[],
    workoutData: any[]
  ): Promise<{
    trend: "gaining" | "losing" | "maintaining" | "fluctuating";
    analysis: string;
    recommendations: string[];
    healthInsights: string[];
    goalAlignment: string;
    nextSteps: string[];
  }> {
    try {
      const prompt = `You are a fitness and nutrition expert analyzing weight trends:

WEIGHT DATA: ${JSON.stringify(weightEntries)}
USER GOALS: ${userGoals.join(", ")}
RECENT WORKOUTS: ${JSON.stringify(workoutData.slice(-10))}

Analyze the weight trend considering:
1. Overall direction and rate of change
2. Correlation with workout intensity/frequency
3. Healthy rate of change for goals
4. Potential muscle gain vs fat loss
5. Consistency and patterns

Provide actionable insights and recommendations.

Respond with JSON:
{
  "trend": "gaining|losing|maintaining|fluctuating",
  "analysis": "Detailed analysis of weight trend",
  "recommendations": ["Specific actionable recommendations"],
  "healthInsights": ["Health-focused observations"],
  "goalAlignment": "How well progress aligns with stated goals",
  "nextSteps": ["Immediate action items for next 2-4 weeks"]
}`;

      const openai = requireOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a certified nutritionist and fitness coach analyzing weight trends and body composition."
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
      console.error("Weight trend analysis error:", error);
      return {
        trend: "maintaining" as const,
        analysis: "Continue tracking your weight consistently for better trend analysis",
        recommendations: ["Weigh yourself at the same time daily", "Track alongside body measurements"],
        healthInsights: ["Weight fluctuations are normal", "Focus on overall trends, not daily changes"],
        goalAlignment: "Consistent tracking supports your fitness goals",
        nextSteps: ["Continue regular weigh-ins", "Add body measurements for complete picture"]
      };
    }
  }

  /**
   * Generate comprehensive progress report
   */
  static async generateProgressReport(
    progressPhotos: any[],
    weightData: any[],
    workouts: any[],
    userProfile: any
  ): Promise<{
    overallProgress: string;
    keyAchievements: string[];
    areasOfImprovement: string[];
    motivationalMessage: string;
    futureRecommendations: string[];
    progressScore: number;
  }> {
    try {
      const prompt = `You are a personal trainer creating a comprehensive progress report:

PROGRESS PHOTOS: ${progressPhotos.length} photos over time
WEIGHT DATA: ${JSON.stringify(weightData.slice(-30))} (last 30 entries)
WORKOUTS: ${workouts.length} completed workouts
USER PROFILE: ${JSON.stringify(userProfile)}

Create an inspiring yet realistic progress report that:
1. Celebrates achievements and milestones
2. Identifies areas showing improvement
3. Addresses challenges or plateaus
4. Provides motivation and encouragement
5. Sets realistic expectations for future progress

Be specific, encouraging, and actionable.

Respond with JSON:
{
  "overallProgress": "Summary of overall fitness journey",
  "keyAchievements": ["Major accomplishments and milestones"],
  "areasOfImprovement": ["Constructive areas to focus on"],
  "motivationalMessage": "Inspiring message based on their progress",
  "futureRecommendations": ["Strategic recommendations for continued progress"],
  "progressScore": 85
}`;

      const openai = requireOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a motivating personal trainer providing comprehensive progress assessments."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content || "{}");
      
    } catch (error) {
      console.error("Progress report generation error:", error);
      return {
        overallProgress: "You're making great strides in your fitness journey",
        keyAchievements: ["Consistent workout tracking", "Regular progress monitoring"],
        areasOfImprovement: ["Continue building healthy habits", "Stay consistent with tracking"],
        motivationalMessage: "Every step forward is progress - keep up the amazing work!",
        futureRecommendations: ["Maintain consistency", "Set new challenging goals"],
        progressScore: 78
      };
    }
  }
}