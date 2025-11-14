import { requireOpenAI } from "./openai.ts";

interface WorkoutRequest {
  bodyParts: string[];
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  duration: number; // in minutes
  equipment: string[];
  goals: string;
  userPrompt?: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restTime: number;
  muscleGroups: string[];
  instructions: string[];
  tips: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

interface WorkoutPlan {
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedDuration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  warmup: string[];
  cooldown: string[];
}

export async function generateAIWorkout(request: WorkoutRequest): Promise<WorkoutPlan> {
  const prompt = `Create a detailed workout plan with the following specifications:

Target Body Parts: ${request.bodyParts.join(", ")}
Fitness Level: ${request.fitnessLevel}
Workout Duration: ${request.duration} minutes
Available Equipment: ${request.equipment.join(", ")}
Goals: ${request.goals}
${request.userPrompt ? `Additional Requirements: ${request.userPrompt}` : ""}

Please provide a comprehensive workout plan in JSON format with the following structure:
{
  "name": "Workout name",
  "description": "Brief description of the workout",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": number,
      "reps": "rep range (e.g., '8-12' or '10')",
      "restTime": seconds,
      "muscleGroups": ["primary", "secondary"],
      "instructions": ["step 1", "step 2", "step 3"],
      "tips": ["form tip", "performance tip"],
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ],
  "estimatedDuration": minutes,
  "difficulty": "Beginner|Intermediate|Advanced",
  "warmup": ["warmup exercise 1", "warmup exercise 2"],
  "cooldown": ["cooldown exercise 1", "cooldown exercise 2"]
}

Guidelines:
- Include 4-8 exercises appropriate for the fitness level
- Ensure proper muscle group progression
- Include compound movements when possible
- Adjust rep ranges based on fitness level (beginners: 8-12, intermediate: 6-15, advanced: varies)
- Rest times should be appropriate (strength: 60-120s, endurance: 30-60s)
- Provide clear, actionable instructions
- Include helpful form and safety tips`;

  try {
    const openai = requireOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a certified personal trainer and exercise physiologist. Create safe, effective workout plans tailored to individual needs. Always prioritize proper form and injury prevention. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const workoutData = JSON.parse(response.choices[0].message.content!);
    
    // Validate and sanitize the response
    const workout: WorkoutPlan = {
      name: workoutData.name || `${request.bodyParts.join(" & ")} Workout`,
      description: workoutData.description || "AI-generated personalized workout",
      exercises: workoutData.exercises?.map((ex: any) => ({
        name: ex.name,
        sets: Math.max(1, Math.min(6, ex.sets || 3)),
        reps: ex.reps || "8-12",
        restTime: Math.max(30, Math.min(300, ex.restTime || 60)),
        muscleGroups: Array.isArray(ex.muscleGroups) ? ex.muscleGroups : [],
        instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
        tips: Array.isArray(ex.tips) ? ex.tips : [],
        difficulty: ["Beginner", "Intermediate", "Advanced"].includes(ex.difficulty) ? ex.difficulty : request.fitnessLevel
      })) || [],
      estimatedDuration: Math.max(15, Math.min(120, workoutData.estimatedDuration || request.duration)),
      difficulty: ["Beginner", "Intermediate", "Advanced"].includes(workoutData.difficulty) ? workoutData.difficulty : request.fitnessLevel,
      warmup: Array.isArray(workoutData.warmup) ? workoutData.warmup : [
        "5 minutes light cardio",
        "Dynamic stretching",
        "Joint mobility exercises"
      ],
      cooldown: Array.isArray(workoutData.cooldown) ? workoutData.cooldown : [
        "5 minutes light walking",
        "Static stretching",
        "Deep breathing exercises"
      ]
    };

    return workout;
  } catch (error) {
    console.error("AI workout generation error:", error);
    
    // Fallback workout plan
    return {
      name: `${request.bodyParts.join(" & ")} Workout`,
      description: "A balanced workout targeting your selected muscle groups",
      exercises: [
        {
          name: "Push-ups",
          sets: 3,
          reps: "8-12",
          restTime: 60,
          muscleGroups: ["Chest", "Triceps", "Shoulders"],
          instructions: ["Start in plank position", "Lower chest to floor", "Push back to start"],
          tips: ["Keep core tight", "Full range of motion"],
          difficulty: "Beginner"
        },
        {
          name: "Squats",
          sets: 3,
          reps: "12-15",
          restTime: 60,
          muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
          instructions: ["Feet shoulder-width apart", "Lower hips back and down", "Drive through heels to stand"],
          tips: ["Keep chest up", "Knees track over toes"],
          difficulty: "Beginner"
        }
      ],
      estimatedDuration: request.duration,
      difficulty: request.fitnessLevel as "Beginner" | "Intermediate" | "Advanced",
      warmup: ["5 minutes light movement", "Dynamic stretching"],
      cooldown: ["5 minutes walking", "Static stretching"]
    };
  }
}