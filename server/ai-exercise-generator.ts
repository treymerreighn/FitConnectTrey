import OpenAI from "openai";
import { storage } from "./storage.ts";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface ExerciseGenerationRequest {
  category: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  count: number;
}

interface GeneratedExercise {
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  variations: string[];
  targetSets: number;
  targetReps: string;
  restTime: number;
  caloriesBurnedPerMinute: number;
}

export async function generateExerciseDatabase(): Promise<void> {
  console.log("Starting AI exercise database generation...");

  const categories = [
    { name: "strength", muscleGroups: ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "calves", "core"] },
    { name: "cardio", muscleGroups: ["full-body", "legs", "core"] },
    { name: "flexibility", muscleGroups: ["full-body", "legs", "back", "shoulders"] },
    { name: "sports", muscleGroups: ["full-body", "legs", "core", "shoulders"] },
    { name: "functional", muscleGroups: ["full-body", "core", "legs"] }
  ];

  const equipmentTypes = [
    ["none"], // Bodyweight
    ["dumbbells"],
    ["barbell"],
    ["resistance-bands"],
    ["pull-up-bar"],
    ["kettlebell"],
    ["cable-machine"],
    ["medicine-ball"],
    ["box", "step"],
    ["suspension-trainer"]
  ];

  for (const category of categories) {
    for (const equipment of equipmentTypes) {
      for (const difficulty of ["beginner", "intermediate", "advanced"] as const) {
        try {
          const exercises = await generateExerciseBatch({
            category: category.name,
            muscleGroups: category.muscleGroups,
            equipment,
            difficulty,
            count: 8
          });

          // Save exercises to database
          for (const exercise of exercises) {
            await saveExerciseToDatabase(exercise);
          }

          console.log(`Generated ${exercises.length} ${difficulty} ${category.name} exercises with ${equipment.join(", ")}`);
          
          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to generate exercises for ${category.name}/${difficulty}/${equipment.join(",")}:`, error);
        }
      }
    }
  }

  console.log("Exercise database generation complete!");
}

async function generateExerciseBatch(request: ExerciseGenerationRequest): Promise<GeneratedExercise[]> {
  const prompt = `Generate ${request.count} unique ${request.difficulty} level ${request.category} exercises that target ${request.muscleGroups.join(", ")} using ${request.equipment.join(", ")} equipment.

Requirements:
- Each exercise must be unique and realistic
- Include proper form instructions (4-6 steps)
- Provide safety tips and common mistakes
- Suggest 2-3 variations for each exercise
- Set appropriate rep ranges and rest times for ${request.difficulty} level
- Include realistic calorie burn estimates

Return as JSON array with this exact structure:
[
  {
    "name": "Exercise Name",
    "category": "${request.category}",
    "primaryMuscles": ["primary muscle 1", "primary muscle 2"],
    "secondaryMuscles": ["secondary muscle 1"],
    "equipment": ["equipment used"],
    "difficulty": "${request.difficulty}",
    "instructions": ["step 1", "step 2", "step 3", "step 4"],
    "tips": ["safety tip", "form tip", "performance tip"],
    "commonMistakes": ["mistake 1", "mistake 2"],
    "variations": ["variation 1", "variation 2"],
    "targetSets": number_of_sets,
    "targetReps": "rep_range_or_duration",
    "restTime": seconds_between_sets,
    "caloriesBurnedPerMinute": estimated_calories
  }
]

Focus on:
- Safe, effective exercises suitable for ${request.difficulty} level
- Clear, actionable instructions
- Realistic progression from ${request.difficulty} level
- Proper muscle targeting for ${request.muscleGroups.join(", ")}`;

  if (!openai) {
    throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
  }
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a certified exercise physiologist and personal trainer with expertise in exercise prescription, biomechanics, and injury prevention. Generate safe, effective exercises with proper progressions."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 3000
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return Array.isArray(data) ? data : data.exercises || [];
}

async function saveExerciseToDatabase(exercise: GeneratedExercise): Promise<void> {
  try {
    const exerciseData = {
      name: exercise.name,
      category: exercise.category,
      muscleGroups: [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      tips: exercise.tips,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restTime: exercise.restTime,
      isApproved: true, // AI-generated exercises are pre-approved
      createdBy: "ai-system",
      videoUrl: null, // Can be added later
      imageUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zml0bmVzcyUyMGV4ZXJjaXNlfGVufDB8fDB8fHww`,
      metadata: {
        commonMistakes: exercise.commonMistakes,
        variations: exercise.variations,
        caloriesBurnedPerMinute: exercise.caloriesBurnedPerMinute,
        aiGenerated: true,
        generatedAt: new Date().toISOString()
      }
    };

    await storage.createExercise(exerciseData);
  } catch (error) {
    console.error(`Failed to save exercise ${exercise.name}:`, error);
  }
}

export async function generateWorkoutTemplates(): Promise<void> {
  console.log("Generating AI workout templates...");

  const workoutTypes = [
    { name: "Full Body Strength", bodyParts: ["chest", "back", "legs", "shoulders"], duration: 45, difficulty: "intermediate" },
    { name: "Upper Body Power", bodyParts: ["chest", "back", "shoulders", "arms"], duration: 40, difficulty: "advanced" },
    { name: "Lower Body Blast", bodyParts: ["legs", "glutes"], duration: 35, difficulty: "intermediate" },
    { name: "Core Strength", bodyParts: ["core"], duration: 25, difficulty: "beginner" },
    { name: "HIIT Cardio", bodyParts: ["full-body"], duration: 30, difficulty: "intermediate" },
    { name: "Push Day", bodyParts: ["chest", "shoulders", "triceps"], duration: 50, difficulty: "advanced" },
    { name: "Pull Day", bodyParts: ["back", "biceps"], duration: 45, difficulty: "advanced" },
    { name: "Leg Day", bodyParts: ["quadriceps", "hamstrings", "glutes", "calves"], duration: 55, difficulty: "intermediate" },
    { name: "Beginner Full Body", bodyParts: ["chest", "back", "legs"], duration: 30, difficulty: "beginner" },
    { name: "Athletic Performance", bodyParts: ["full-body"], duration: 60, difficulty: "advanced" }
  ];

  for (const workout of workoutTypes) {
    try {
      const workoutPlan = await generateWorkoutTemplate(workout);
      await saveWorkoutTemplate(workoutPlan);
      console.log(`Generated workout template: ${workout.name}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate workout template ${workout.name}:`, error);
    }
  }

  console.log("Workout template generation complete!");
}

async function generateWorkoutTemplate(config: any) {
  const prompt = `Create a comprehensive ${config.difficulty} level workout plan called "${config.name}" that targets ${config.bodyParts.join(", ")} and lasts approximately ${config.duration} minutes.

Design principles:
- Proper warm-up and cool-down
- Logical exercise progression
- Appropriate volume for ${config.difficulty} level
- Balance between muscle groups
- Include rest periods

Return as JSON with this structure:
{
  "name": "${config.name}",
  "description": "Brief description of the workout and its benefits",
  "difficulty": "${config.difficulty}",
  "estimatedDuration": ${config.duration},
  "targetBodyParts": ["${config.bodyParts.join('", "')}"],
  "warmup": ["warmup exercise 1", "warmup exercise 2", "warmup exercise 3"],
  "mainWorkout": [
    {
      "exerciseName": "Exercise name",
      "sets": number,
      "reps": "rep range",
      "restTime": seconds,
      "notes": "execution tips"
    }
  ],
  "cooldown": ["cooldown exercise 1", "cooldown exercise 2"],
  "tips": ["workout tip 1", "workout tip 2"],
  "modifications": {
    "easier": ["easier variation 1", "easier variation 2"],
    "harder": ["harder variation 1", "harder variation 2"]
  }
}`;

  if (!openai) {
    throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
  }
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert fitness coach designing effective workout programs. Create balanced, progressive workouts that are safe and results-oriented."
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

  return JSON.parse(response.choices[0].message.content!);
}

async function saveWorkoutTemplate(template: any): Promise<void> {
  // Save as a special post type for workout templates
  const templatePost = {
    userId: "ai-system",
    type: "workout_template",
    content: template.description,
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    workoutData: template,
    isTemplate: true,
    createdAt: new Date()
  };

  await storage.createPost(templatePost);
}