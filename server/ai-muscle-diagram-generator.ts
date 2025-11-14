import { requireOpenAI } from "./openai.ts";
import { storage } from "./storage.ts";

interface MuscleGroup {
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  description: string;
}

interface ExerciseWithDiagram {
  name: string;
  category: string;
  muscleGroups: string[];
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
  muscleDiagramSvg: string;
  anatomyDescription: string;
}

export async function generateExerciseWithMuscleDiagram(exerciseRequest: {
  name?: string;
  category: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}): Promise<ExerciseWithDiagram> {
  console.log(`Generating AI exercise with muscle diagram for ${exerciseRequest.category}...`);

  // First, generate the exercise data
  const exerciseData = await generateExerciseData(exerciseRequest);
  
  // Then, generate the muscle diagram SVG
  const muscleDiagram = await generateMuscleDiagramSVG(exerciseData);
  
  // Combine everything
  const completeExercise: ExerciseWithDiagram = {
    ...exerciseData,
    muscleDiagramSvg: muscleDiagram.svg,
    anatomyDescription: muscleDiagram.description
  };

  // Save to database
  await saveExerciseWithDiagram(completeExercise);
  
  return completeExercise;
}

async function generateExerciseData(request: {
  name?: string;
  category: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}): Promise<Omit<ExerciseWithDiagram, 'muscleDiagramSvg' | 'anatomyDescription'>> {
  
  const prompt = `Generate a detailed ${request.difficulty} level ${request.category} exercise${request.name ? ` called "${request.name}"` : ''} that specifically targets ${request.targetMuscles.join(", ")} using ${request.equipment.join(", ")} equipment.

Requirements:
- Create a unique, safe, and effective exercise
- Include detailed step-by-step instructions (4-6 steps)
- Provide safety tips and common mistakes to avoid
- Suggest 2-3 exercise variations
- Set appropriate sets, reps, and rest times for ${request.difficulty} level
- Include realistic calorie burn estimates
- Specify primary and secondary muscles worked

Return as JSON with this exact structure:
{
  "name": "Exercise Name",
  "category": "${request.category}",
  "muscleGroups": ["all muscles worked"],
  "primaryMuscles": ["main muscles targeted"],
  "secondaryMuscles": ["supporting muscles"],
  "equipment": ["equipment needed"],
  "difficulty": "${request.difficulty}",
  "instructions": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "tips": ["safety tip 1", "form tip 2", "performance tip 3"],
  "commonMistakes": ["mistake 1", "mistake 2", "mistake 3"],
  "variations": ["variation 1", "variation 2", "variation 3"],
  "targetSets": number_of_sets,
  "targetReps": "rep_range_or_duration",
  "restTime": seconds_between_sets,
  "caloriesBurnedPerMinute": estimated_calories_per_minute
}

Focus on:
- Exercise safety and proper form
- Clear, actionable instructions
- Realistic ${request.difficulty} level difficulty
- Effective targeting of ${request.targetMuscles.join(", ")}`;

  const openai = requireOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a certified exercise physiologist and biomechanics expert. Generate safe, effective exercises with proper muscle targeting and progression."
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

async function generateMuscleDiagramSVG(exercise: any): Promise<{ svg: string; description: string }> {
  const prompt = `Create an anatomical muscle diagram for the exercise "${exercise.name}" that clearly shows:

PRIMARY MUSCLES (highlighted in red): ${exercise.primaryMuscles.join(", ")}
SECONDARY MUSCLES (highlighted in orange): ${exercise.secondaryMuscles.join(", ")}

Create an SVG diagram that shows:
1. A simplified human figure (front and/or back view as needed)
2. Muscle groups clearly labeled and color-coded
3. Primary muscles in red (#ef4444)
4. Secondary muscles in orange (#f97316)
5. Other muscles in light gray (#e5e7eb)
6. Clean, educational design suitable for fitness apps

Also provide a brief anatomical description explaining how these muscles work together in this exercise.

Return as JSON:
{
  "svg": "complete SVG code as string",
  "description": "2-3 sentence explanation of muscle activation and movement pattern"
}

Make the SVG clean, professional, and educational. Size should be approximately 400x500 pixels.`;

  const openai = requireOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a medical illustrator and anatomy expert. Create clear, accurate anatomical diagrams that help people understand muscle activation during exercises."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower temperature for more consistent diagram generation
    max_tokens: 3000
  });

  return JSON.parse(response.choices[0].message.content!);
}

async function saveExerciseWithDiagram(exercise: ExerciseWithDiagram): Promise<void> {
  try {
    const exerciseData = {
      name: exercise.name,
      category: exercise.category as "strength" | "cardio" | "flexibility" | "sports" | "functional",
      muscleGroups: exercise.muscleGroups as Array<"chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms" | "abs" | "obliques" | "lower_back" | "glutes" | "quadriceps" | "hamstrings" | "calves" | "traps" | "lats" | "delts">,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      description: exercise.anatomyDescription,
      instructions: exercise.instructions,
      tips: exercise.tips,
      safetyNotes: exercise.commonMistakes,
      images: [`data:image/svg+xml;base64,${Buffer.from(exercise.muscleDiagramSvg).toString('base64')}`],
      videos: [],
      variations: exercise.variations,
      isUserCreated: false,
      createdBy: "ai-system",
      isApproved: true,
      tags: [`ai-generated`, `muscle-diagram`, ...exercise.primaryMuscles, ...exercise.secondaryMuscles]
    };

    await storage.createExercise(exerciseData);
    console.log(`Saved exercise with muscle diagram: ${exercise.name}`);
  } catch (error) {
    console.error(`Failed to save exercise ${exercise.name}:`, error);
    throw error;
  }
}

// Generate a batch of exercises with muscle diagrams
export async function generateExerciseBatchWithDiagrams(requests: Array<{
  category: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}>): Promise<ExerciseWithDiagram[]> {
  
  const exercises: ExerciseWithDiagram[] = [];
  
  for (const request of requests) {
    try {
      console.log(`Generating ${request.difficulty} ${request.category} exercise targeting ${request.targetMuscles.join(", ")}`);
      
      const exercise = await generateExerciseWithMuscleDiagram(request);
      exercises.push(exercise);
      
      // Rate limiting - respect OpenAI API limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Failed to generate exercise for ${request.category}:`, error);
      continue; // Skip failed exercises but continue with others
    }
  }
  
  return exercises;
}

// Predefined exercise generation templates
export async function generatePopularExercisesWithDiagrams(): Promise<void> {
  console.log("Generating popular exercises with muscle diagrams...");
  
  const popularExercises = [
    {
      category: "strength",
      targetMuscles: ["chest", "triceps", "shoulders"],
      equipment: ["none"],
      difficulty: "beginner" as const
    },
    {
      category: "strength", 
      targetMuscles: ["quadriceps", "glutes", "hamstrings"],
      equipment: ["none"],
      difficulty: "intermediate" as const
    },
    {
      category: "strength",
      targetMuscles: ["latissimus-dorsi", "biceps", "rhomboids"],
      equipment: ["pull-up-bar"],
      difficulty: "intermediate" as const
    },
    {
      category: "strength",
      targetMuscles: ["shoulders", "triceps", "upper-chest"],
      equipment: ["none"],
      difficulty: "intermediate" as const
    },
    {
      category: "cardio",
      targetMuscles: ["quadriceps", "glutes", "core"],
      equipment: ["none"],
      difficulty: "beginner" as const
    },
    {
      category: "strength",
      targetMuscles: ["core", "rectus-abdominis", "obliques"],
      equipment: ["none"],
      difficulty: "beginner" as const
    },
    {
      category: "strength",
      targetMuscles: ["glutes", "hamstrings", "core"],
      equipment: ["none"],
      difficulty: "intermediate" as const
    },
    {
      category: "strength",
      targetMuscles: ["triceps", "chest", "shoulders"],
      equipment: ["none"],
      difficulty: "advanced" as const
    }
  ];
  
  const generatedExercises = await generateExerciseBatchWithDiagrams(popularExercises);
  
  console.log(`Generated ${generatedExercises.length} exercises with muscle diagrams!`);
  return;
}