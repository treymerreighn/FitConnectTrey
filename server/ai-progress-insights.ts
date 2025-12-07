import { isAIAvailable, generateVisionCompletion, getProviderName } from "./ai-provider.ts";

export interface ProgressInsight {
  overallAssessment: string;
  muscleDefinition: {
    score: number;
    notes: string;
  };
  posture: {
    score: number;
    notes: string;
  };
  bodyComposition: {
    assessment: string;
    changes: string[];
  };
  recommendations: string[];
  motivationalMessage: string;
}

function getFallbackInsight(): ProgressInsight {
  return {
    overallAssessment: "Photo uploaded successfully! Track your progress over time to see your transformation.",
    muscleDefinition: {
      score: 5,
      notes: "Continue tracking your progress photos for detailed muscle definition analysis.",
    },
    posture: {
      score: 5,
      notes: "Regular photo tracking helps monitor posture improvements over time.",
    },
    bodyComposition: {
      assessment: "Photo recorded for progress tracking.",
      changes: ["Photo saved to your progress timeline"],
    },
    recommendations: [
      "Take photos in consistent lighting for best comparison",
      "Use the same pose and angle each time",
      "Track weekly or bi-weekly for visible changes",
      "Combine with weight and measurement tracking",
    ],
    motivationalMessage: "Every photo is a step forward on your fitness journey! Keep documenting your progress.",
  };
}

function validateInsight(result: any): ProgressInsight {
  return {
    overallAssessment: result.overallAssessment || "Progress analysis completed.",
    muscleDefinition: {
      score: Math.max(1, Math.min(10, result.muscleDefinition?.score || 5)),
      notes: result.muscleDefinition?.notes || "Muscle definition analysis performed.",
    },
    posture: {
      score: Math.max(1, Math.min(10, result.posture?.score || 5)),
      notes: result.posture?.notes || "Posture assessment completed.",
    },
    bodyComposition: {
      assessment: result.bodyComposition?.assessment || "Body composition evaluated.",
      changes: Array.isArray(result.bodyComposition?.changes) ? result.bodyComposition.changes : [],
    },
    recommendations: Array.isArray(result.recommendations)
      ? result.recommendations
      : ["Continue your current fitness routine."],
    motivationalMessage: result.motivationalMessage || "Keep up the great work on your fitness journey!",
  };
}

export async function analyzeProgressPhoto(
  imageBase64: string,
  previousInsights?: ProgressInsight[]
): Promise<ProgressInsight> {
  if (!isAIAvailable()) {
    console.log("[ProgressInsights] No AI provider available - using fallback");
    return getFallbackInsight();
  }

  try {
    const systemPrompt = `You are a certified fitness professional and body composition expert. Analyze progress photos to provide detailed, constructive insights about fitness transformation.

Guidelines:
- Be encouraging and professional
- Focus on visible improvements and areas for growth
- Provide actionable fitness advice
- Rate muscle definition and posture on 1-10 scale
- Identify specific body composition changes
- Give 3-5 specific recommendations
- End with a motivational message

Previous insights context: ${previousInsights ? JSON.stringify(previousInsights.slice(-2)) : "None"}

Respond in valid JSON format:
{
  "overallAssessment": "string",
  "muscleDefinition": {"score": number, "notes": "string"},
  "posture": {"score": number, "notes": "string"},
  "bodyComposition": {"assessment": "string", "changes": ["string"]},
  "recommendations": ["string"],
  "motivationalMessage": "string"
}`;

    const userPrompt = "Analyze this progress photo and provide detailed fitness insights. Consider muscle definition, posture, body composition changes, and provide actionable recommendations.";

    console.log(`[ProgressInsights] Analyzing photo with ${getProviderName()}...`);

    const responseText = await generateVisionCompletion(systemPrompt, userPrompt, imageBase64, {
      maxTokens: 800,
      temperature: 0.7,
    });

    const result = JSON.parse(responseText);
    return validateInsight(result);
  } catch (error) {
    console.error("[ProgressInsights] Error analyzing progress photo:", error);
    return getFallbackInsight();
  }
}

export async function compareProgressPhotos(
  currentImageBase64: string,
  previousImageBase64: string,
  timePeriod: string
): Promise<ProgressInsight> {
  if (!isAIAvailable()) {
    console.log("[ProgressInsights] No AI provider available - using fallback for comparison");
    return {
      ...getFallbackInsight(),
      overallAssessment: `Photos from ${timePeriod} apart have been saved. Enable AI for detailed comparison analysis.`,
    };
  }

  try {
    const systemPrompt = `You are a certified fitness professional analyzing progress photos taken ${timePeriod} apart. Compare the two images to identify specific changes and transformations.

Focus on:
- Visible muscle growth or definition changes
- Body fat reduction or redistribution  
- Posture improvements
- Overall physique transformation
- Specific areas of improvement
- Areas that need continued focus

Respond in valid JSON format:
{
  "overallAssessment": "string",
  "muscleDefinition": {"score": number, "notes": "string"},
  "posture": {"score": number, "notes": "string"},
  "bodyComposition": {"assessment": "string", "changes": ["string"]},
  "recommendations": ["string"],
  "motivationalMessage": "string"
}`;

    const userPrompt = `Compare these two progress photos taken ${timePeriod} apart. Analyze the transformation and provide detailed insights on changes, improvements, and recommendations.`;

    console.log(`[ProgressInsights] Comparing photos with ${getProviderName()}...`);

    const responseText = await generateVisionCompletion(systemPrompt, userPrompt, currentImageBase64, {
      maxTokens: 1000,
      temperature: 0.7,
    });

    const result = JSON.parse(responseText);
    return validateInsight(result);
  } catch (error) {
    console.error("[ProgressInsights] Error comparing progress photos:", error);
    return {
      ...getFallbackInsight(),
      overallAssessment: `Comparison over ${timePeriod} recorded. Try again later for AI analysis.`,
    };
  }
}
