import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProgressInsight {
  overallAssessment: string;
  muscleDefinition: {
    score: number; // 1-10
    notes: string;
  };
  posture: {
    score: number; // 1-10
    notes: string;
  };
  bodyComposition: {
    assessment: string;
    changes: string[];
  };
  recommendations: string[];
  motivationalMessage: string;
}

export async function analyzeProgressPhoto(imageBase64: string, previousInsights?: ProgressInsight[]): Promise<ProgressInsight> {
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

Previous insights context: ${previousInsights ? JSON.stringify(previousInsights.slice(-2)) : 'None'}

Respond in JSON format matching the ProgressInsight interface.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this progress photo and provide detailed fitness insights. Consider muscle definition, posture, body composition changes, and provide actionable recommendations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and structure the response
    const insight: ProgressInsight = {
      overallAssessment: result.overallAssessment || 'Progress analysis completed.',
      muscleDefinition: {
        score: Math.max(1, Math.min(10, result.muscleDefinition?.score || 5)),
        notes: result.muscleDefinition?.notes || 'Muscle definition analysis performed.'
      },
      posture: {
        score: Math.max(1, Math.min(10, result.posture?.score || 5)),
        notes: result.posture?.notes || 'Posture assessment completed.'
      },
      bodyComposition: {
        assessment: result.bodyComposition?.assessment || 'Body composition evaluated.',
        changes: Array.isArray(result.bodyComposition?.changes) ? result.bodyComposition.changes : []
      },
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['Continue your current fitness routine.'],
      motivationalMessage: result.motivationalMessage || 'Keep up the great work on your fitness journey!'
    };

    return insight;

  } catch (error) {
    console.error('Error analyzing progress photo:', error);
    throw new Error('Failed to analyze progress photo. Please try again.');
  }
}

export async function compareProgressPhotos(
  currentImageBase64: string,
  previousImageBase64: string,
  timePeriod: string
): Promise<ProgressInsight> {
  try {
    const systemPrompt = `You are a certified fitness professional analyzing progress photos taken ${timePeriod} apart. Compare the two images to identify specific changes and transformations.

Focus on:
- Visible muscle growth or definition changes
- Body fat reduction or redistribution  
- Posture improvements
- Overall physique transformation
- Specific areas of improvement
- Areas that need continued focus

Provide detailed comparison insights in JSON format.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare these two progress photos taken ${timePeriod} apart. Analyze the transformation and provide detailed insights on changes, improvements, and recommendations.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${previousImageBase64}`,
              }
            },
            {
              type: "image_url", 
              image_url: {
                url: `data:image/jpeg;base64,${currentImageBase64}`,
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    const insight: ProgressInsight = {
      overallAssessment: result.overallAssessment || `Transformation analysis completed for ${timePeriod} period.`,
      muscleDefinition: {
        score: Math.max(1, Math.min(10, result.muscleDefinition?.score || 5)),
        notes: result.muscleDefinition?.notes || 'Muscle definition changes analyzed.'
      },
      posture: {
        score: Math.max(1, Math.min(10, result.posture?.score || 5)),
        notes: result.posture?.notes || 'Posture improvement assessment completed.'
      },
      bodyComposition: {
        assessment: result.bodyComposition?.assessment || 'Body composition transformation evaluated.',
        changes: Array.isArray(result.bodyComposition?.changes) ? result.bodyComposition.changes : []
      },
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['Continue your transformation journey.'],
      motivationalMessage: result.motivationalMessage || `Excellent progress over ${timePeriod}! Keep pushing forward.`
    };

    return insight;

  } catch (error) {
    console.error('Error comparing progress photos:', error);
    throw new Error('Failed to compare progress photos. Please try again.');
  }
}