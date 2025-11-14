import { requireOpenAI } from "./openai.ts";
import { storage } from "./storage.ts";

interface ExerciseForLibrary {
  name: string;
  category: "strength" | "cardio" | "flexibility" | "sports" | "functional";
  muscleGroups: Array<"chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms" | "abs" | "obliques" | "lower_back" | "glutes" | "quadriceps" | "hamstrings" | "calves" | "traps" | "lats" | "delts">;
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  instructions: string[];
  tips: string[];
  safetyNotes: string[];
  variations: string[];
  muscleDiagramSvg: string;
  anatomyDescription: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  targetSets: number;
  targetReps: string;
  restTime: number;
  caloriesBurnedPerMinute: number;
}

// Generate a comprehensive exercise library with muscle diagrams
export async function generateExerciseLibraryWithDiagrams(): Promise<void> {
  console.log("🔥 Building AI Exercise Library with Muscle Diagrams...");
  
  const exerciseCategories = [
    {
      category: "strength",
      subcategories: [
        {
          name: "Push Movements",
          targetMuscles: ["chest", "triceps", "shoulders"],
          exercises: ["Push-ups", "Bench Press", "Overhead Press", "Dips", "Incline Press"]
        },
        {
          name: "Pull Movements", 
          targetMuscles: ["back", "biceps", "lats"],
          exercises: ["Pull-ups", "Rows", "Lat Pulldowns", "Face Pulls", "Deadlifts"]
        },
        {
          name: "Leg Movements",
          targetMuscles: ["quadriceps", "glutes", "hamstrings"],
          exercises: ["Squats", "Lunges", "Romanian Deadlifts", "Bulgarian Split Squats", "Leg Press"]
        },
        {
          name: "Core Movements",
          targetMuscles: ["abs", "obliques", "lower_back"],
          exercises: ["Planks", "Crunches", "Russian Twists", "Dead Bugs", "Mountain Climbers"]
        }
      ]
    },
    {
      category: "cardio",
      subcategories: [
        {
          name: "High Intensity",
          targetMuscles: ["quadriceps", "glutes", "calves"],
          exercises: ["Burpees", "Jump Squats", "High Knees", "Box Jumps", "Jumping Jacks"]
        },
        {
          name: "Low Intensity",
          targetMuscles: ["quadriceps", "glutes", "calves"],
          exercises: ["Step-ups", "Marching in Place", "Wall Sits", "Calf Raises", "Side Steps"]
        }
      ]
    },
    {
      category: "flexibility",
      subcategories: [
        {
          name: "Upper Body Stretches",
          targetMuscles: ["shoulders", "chest", "back"],
          exercises: ["Shoulder Stretch", "Chest Stretch", "Cat-Cow Stretch", "Child's Pose", "Arm Circles"]
        },
        {
          name: "Lower Body Stretches",
          targetMuscles: ["hamstrings", "quadriceps", "glutes"],
          exercises: ["Hamstring Stretch", "Quad Stretch", "Hip Flexor Stretch", "Pigeon Pose", "Calf Stretch"]
        }
      ]
    }
  ];

  const equipmentVariations = [
    ["bodyweight"],
    ["dumbbells"], 
    ["barbell"],
    ["resistance-bands"],
    ["kettlebell"],
    ["medicine-ball"]
  ];

  for (const categoryGroup of exerciseCategories) {
    for (const subcategory of categoryGroup.subcategories) {
      for (const equipment of equipmentVariations) {
        for (const difficulty of ["beginner", "intermediate", "advanced"] as const) {
          try {
            console.log(`Generating ${difficulty} ${categoryGroup.category} exercises: ${subcategory.name} with ${equipment.join(", ")}`);
            
            const exercises = await generateExerciseBatch({
              category: categoryGroup.category,
              subcategoryName: subcategory.name,
              targetMuscles: subcategory.targetMuscles,
              equipment,
              difficulty,
              exerciseNames: subcategory.exercises
            });

            // Save each exercise to the library
            for (const exercise of exercises) {
              await saveExerciseToLibrary(exercise);
              console.log(`✓ Added: ${exercise.name}`);
            }

            // Rate limiting to respect OpenAI API
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            console.error(`Failed to generate ${subcategory.name} exercises:`, error);
            continue;
          }
        }
      }
    }
  }

  console.log("🎯 Exercise Library Generation Complete!");
}

async function generateExerciseBatch(params: {
  category: string;
  subcategoryName: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  exerciseNames: string[];
}): Promise<ExerciseForLibrary[]> {
  
  const prompt = `Generate 3 unique ${params.difficulty} level ${params.category} exercises for "${params.subcategoryName}" that target ${params.targetMuscles.join(", ")} using ${params.equipment.join(", ")} equipment.

Create exercises similar to: ${params.exerciseNames.join(", ")} but make them unique variations.

Requirements:
- Each exercise must be safe and effective for ${params.difficulty} level
- Include detailed step-by-step instructions (4-6 steps)
- Provide safety tips and common mistakes
- Suggest 2-3 variations for progression
- Set appropriate rep ranges and rest times
- Include realistic calorie burn estimates
- Specify primary and secondary muscles worked

Return as JSON array:
[
  {
    "name": "Exercise Name",
    "category": "${params.category}",
    "muscleGroups": ["all muscles worked"],
    "primaryMuscles": ["main target muscles"],
    "secondaryMuscles": ["supporting muscles"],
    "equipment": ["equipment used"],
    "difficulty": "${params.difficulty}",
    "description": "Brief exercise description and benefits",
    "instructions": ["step 1", "step 2", "step 3", "step 4"],
    "tips": ["form tip 1", "safety tip 2", "performance tip 3"],
    "safetyNotes": ["safety note 1", "safety note 2"],
    "variations": ["easier variation", "harder variation", "alternative variation"],
    "targetSets": number_of_sets,
    "targetReps": "rep_range_or_duration",
    "restTime": seconds_between_sets,
    "caloriesBurnedPerMinute": estimated_calories_per_minute
  }
]

Focus on creating exercises that:
- Are safe and appropriate for ${params.difficulty} level
- Effectively target ${params.targetMuscles.join(", ")}
- Can be performed with ${params.equipment.join(", ")}
- Have clear, actionable instructions`;

  const openai = requireOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a certified exercise physiologist and personal trainer. Generate safe, effective exercises with proper form cues and progressions."
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
  const exercises = Array.isArray(data) ? data : data.exercises || [];

  // Generate muscle diagrams for each exercise
  const exercisesWithDiagrams: ExerciseForLibrary[] = [];
  
  for (const exercise of exercises) {
    try {
      const muscleDiagram = await generateMuscleDiagramForExercise(exercise);
      exercisesWithDiagrams.push({
        ...exercise,
        muscleDiagramSvg: muscleDiagram.svg,
        anatomyDescription: muscleDiagram.description
      });
    } catch (error) {
      console.error(`Failed to generate muscle diagram for ${exercise.name}:`, error);
      // Use exercise without diagram if SVG generation fails
      exercisesWithDiagrams.push({
        ...exercise,
        muscleDiagramSvg: "",
        anatomyDescription: exercise.description
      });
    }
  }

  return exercisesWithDiagrams;
}

async function generateMuscleDiagramForExercise(exercise: any): Promise<{ svg: string; description: string }> {
  const prompt = `Create a professional anatomical muscle diagram SVG for the exercise "${exercise.name}".

Show these muscles clearly:
PRIMARY MUSCLES (bright red #ef4444): ${exercise.primaryMuscles.join(", ")}
SECONDARY MUSCLES (orange #f97316): ${exercise.secondaryMuscles.join(", ")}

Create a clean SVG diagram with:
1. Simplified human figure (front/back view as appropriate)
2. Muscle groups clearly highlighted and labeled
3. Professional medical/fitness illustration style
4. Size: 400x500 pixels
5. Clean color coding for muscle activation

Also provide a brief description explaining the muscle activation pattern.

Return as JSON:
{
  "svg": "complete SVG markup as string",
  "description": "2-3 sentence explanation of how muscles work together in this exercise"
}`;

  const openai = requireOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a medical illustrator creating educational anatomy diagrams for fitness applications. Create accurate, clear muscle activation visualizations."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content!);
}

async function saveExerciseToLibrary(exercise: ExerciseForLibrary): Promise<void> {
  try {
    const exerciseData = {
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      description: exercise.description,
      instructions: exercise.instructions,
      tips: exercise.tips,
      safetyNotes: exercise.safetyNotes,
      images: exercise.muscleDiagramSvg ? [`data:image/svg+xml;base64,${Buffer.from(exercise.muscleDiagramSvg).toString('base64')}`] : [],
      videos: [],
      variations: exercise.variations,
      isUserCreated: false,
      createdBy: "ai-system",
      isApproved: true,
      tags: [`ai-generated`, `${exercise.category}`, `${exercise.difficulty}`, ...exercise.primaryMuscles]
    };

    await storage.createExercise(exerciseData);
  } catch (error) {
    console.error(`Failed to save exercise ${exercise.name}:`, error);
    throw error;
  }
}

// Generate a quick starter set of popular exercises
export async function generatePopularExercisesForLibrary(): Promise<void> {
  console.log("🚀 Generating Popular Exercises for Library...");

  const popularExercises = [
    {
      category: "strength" as const,
      subcategoryName: "Push Movements",
      targetMuscles: ["chest", "triceps", "shoulders"],
      equipment: ["bodyweight"],
      difficulty: "beginner" as const,
      exerciseNames: ["Push-ups", "Wall Push-ups", "Incline Push-ups"]
    },
    {
      category: "strength" as const,
      subcategoryName: "Pull Movements", 
      targetMuscles: ["back", "biceps", "lats"],
      equipment: ["bodyweight"],
      difficulty: "intermediate" as const,
      exerciseNames: ["Pull-ups", "Chin-ups", "Inverted Rows"]
    },
    {
      category: "strength" as const,
      subcategoryName: "Leg Movements",
      targetMuscles: ["quadriceps", "glutes", "hamstrings"],
      equipment: ["bodyweight"],
      difficulty: "beginner" as const,
      exerciseNames: ["Squats", "Lunges", "Wall Sits"]
    },
    {
      category: "cardio" as const,
      subcategoryName: "High Intensity",
      targetMuscles: ["quadriceps", "glutes", "calves"],
      equipment: ["bodyweight"],
      difficulty: "intermediate" as const,
      exerciseNames: ["Burpees", "Jump Squats", "Mountain Climbers"]
    },
    {
      category: "strength" as const,
      subcategoryName: "Core Movements",
      targetMuscles: ["abs", "obliques", "lower_back"],
      equipment: ["bodyweight"],
      difficulty: "beginner" as const,
      exerciseNames: ["Planks", "Crunches", "Russian Twists"]
    }
  ];

  for (const params of popularExercises) {
    try {
      console.log(`Generating ${params.subcategoryName} exercises...`);
      const exercises = await generateExerciseBatch(params);
      
      for (const exercise of exercises) {
        await saveExerciseToLibrary(exercise);
        console.log(`✓ Added: ${exercise.name}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`Failed to generate ${params.subcategoryName}:`, error);
      continue;
    }
  }

  console.log("🎯 Popular Exercise Generation Complete!");
}