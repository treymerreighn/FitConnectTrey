import { requireOpenAI } from "./openai.ts";
import { storage } from "./storage.ts";

interface GeneratedExercise {
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
  imageUrl: string;
}

// This runs automatically when the server starts to build the exercise library
export async function buildExerciseDatabase(): Promise<void> {
  try {
    // Check if we already have AI-generated exercises
    console.log("Checking for existing AI exercises...");
    const existingExercises = await storage.getAllExercises();
    const aiExercises = existingExercises.filter(ex => ex.createdBy === "ai-system");
    if (aiExercises.length > 10) {
      console.log(`Exercise database already populated with ${aiExercises.length} AI exercises`);
      return;
    }

    console.log("🔥 Building AI Exercise Database...");
    
    const exerciseSpecs = [
      // Popular Bodyweight Exercises
      { name: "Push-ups", category: "strength", muscles: ["chest", "triceps", "shoulders"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Squats", category: "strength", muscles: ["quadriceps", "glutes", "hamstrings"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Pull-ups", category: "strength", muscles: ["back", "biceps", "lats"], equipment: ["pull-up-bar"], difficulty: "intermediate" },
      { name: "Plank", category: "strength", muscles: ["abs", "shoulders", "back"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Lunges", category: "strength", muscles: ["quadriceps", "glutes", "hamstrings"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Burpees", category: "cardio", muscles: ["quadriceps", "chest", "shoulders"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Mountain Climbers", category: "cardio", muscles: ["abs", "shoulders", "quadriceps"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Jumping Jacks", category: "cardio", muscles: ["quadriceps", "calves", "shoulders"], equipment: ["bodyweight"], difficulty: "beginner" },

      // Dumbbell Exercises
      { name: "Dumbbell Bench Press", category: "strength", muscles: ["chest", "triceps", "shoulders"], equipment: ["dumbbells", "bench"], difficulty: "intermediate" },
      { name: "Dumbbell Rows", category: "strength", muscles: ["back", "biceps", "lats"], equipment: ["dumbbells"], difficulty: "intermediate" },
      { name: "Dumbbell Shoulder Press", category: "strength", muscles: ["shoulders", "triceps"], equipment: ["dumbbells"], difficulty: "intermediate" },
      { name: "Dumbbell Bicep Curls", category: "strength", muscles: ["biceps", "forearms"], equipment: ["dumbbells"], difficulty: "beginner" },
      { name: "Dumbbell Goblet Squats", category: "strength", muscles: ["quadriceps", "glutes"], equipment: ["dumbbells"], difficulty: "beginner" },

      // Barbell Exercises
      { name: "Barbell Deadlift", category: "strength", muscles: ["back", "glutes", "hamstrings"], equipment: ["barbell"], difficulty: "advanced" },
      { name: "Barbell Bench Press", category: "strength", muscles: ["chest", "triceps", "shoulders"], equipment: ["barbell", "bench"], difficulty: "intermediate" },
      { name: "Barbell Back Squat", category: "strength", muscles: ["quadriceps", "glutes"], equipment: ["barbell", "squat-rack"], difficulty: "intermediate" },

      // Core Exercises
      { name: "Russian Twists", category: "strength", muscles: ["abs", "obliques"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Dead Bug", category: "strength", muscles: ["abs", "lower_back"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Bicycle Crunches", category: "strength", muscles: ["abs", "obliques"], equipment: ["bodyweight"], difficulty: "beginner" },

      // Flexibility
      { name: "Downward Dog", category: "flexibility", muscles: ["hamstrings", "calves", "shoulders"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Child's Pose", category: "flexibility", muscles: ["back", "shoulders"], equipment: ["bodyweight"], difficulty: "beginner" }
    ];

    for (const spec of exerciseSpecs) {
      try {
        console.log(`Generating ${spec.name}...`);
        
        const exercise = await generateExerciseWithImage(spec);
        await saveExerciseToDatabase(exercise);
        
        console.log(`✓ Added ${spec.name} to database`);
        
        // Rate limiting to respect OpenAI API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Failed to generate ${spec.name}:`, error);
        // Continue with other exercises even if one fails
        continue;
      }
    }

    console.log("🎯 Exercise Database Build Complete!");
    
  } catch (error) {
    console.error("Failed to build exercise database:", error);
  }
}

async function generateExerciseWithImage(spec: any): Promise<GeneratedExercise> {
  // Generate comprehensive exercise data
  const exerciseData = await generateExerciseData(spec);
  
  // Generate exercise demonstration image
  const imageUrl = await generateExerciseImage(exerciseData);
  
  return {
    ...exerciseData,
    imageUrl
  };
}

async function generateExerciseData(spec: any): Promise<Omit<GeneratedExercise, 'imageUrl'>> {
  const prompt = `Generate comprehensive data for the exercise "${spec.name}" - a ${spec.difficulty} level ${spec.category} exercise.

Requirements:
- Target muscles: ${spec.muscles.join(", ")}
- Equipment: ${spec.equipment.join(", ")}
- Include detailed step-by-step instructions (4-6 steps)
- Provide safety tips and form cues
- List common mistakes to avoid
- Suggest 2-3 exercise variations for progression
- Create a clear, motivating description

Return as JSON:
{
  "name": "${spec.name}",
  "category": "${spec.category}",
  "muscleGroups": ["muscle1", "muscle2"],
  "equipment": ["equipment1", "equipment2"],
  "difficulty": "${spec.difficulty}",
  "description": "Clear, motivating description of the exercise and its benefits",
  "instructions": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "tips": ["form tip 1", "safety tip 2", "performance tip 3"],
  "safetyNotes": ["safety note 1", "safety note 2"],
  "variations": ["easier variation", "harder variation", "alternative variation"]
}

Focus on:
- Clear, actionable instructions
- Safety and proper form
- Benefits and muscle targeting
- Progression options for ${spec.difficulty} level`;

  const openai = requireOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a certified personal trainer and exercise physiologist. Generate safe, effective exercise content for fitness applications."
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

async function generateExerciseImage(exercise: any): Promise<string> {
  try {
    const prompt = `Professional fitness photography of a person demonstrating the exercise "${exercise.name}". 
    
Style: Clean, modern fitness studio setting with good lighting. Person in athletic wear performing the exercise with perfect form. Professional, motivating, high-quality fitness photography similar to what you'd see in a fitness app or magazine.
    
Show: Proper form and technique for ${exercise.name}, targeting ${exercise.muscleGroups.join(", ")}. Clear demonstration of the exercise movement.
    
Quality: High resolution, well-lit, professional fitness photography with clean background.`;

  const openai = requireOpenAI();
  const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response?.data?.[0]?.url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400";
    
  } catch (error) {
    console.error(`Failed to generate image for ${exercise.name}:`, error);
    // Fallback to a generic fitness image
    return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zml0bmVzcyUyMGV4ZXJjaXNlfGVufDB8fDB8fHww";
  }
}

async function saveExerciseToDatabase(exercise: GeneratedExercise): Promise<void> {
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
      images: [exercise.imageUrl],
      videos: [],
      variations: exercise.variations,
      isUserCreated: false,
      createdBy: "ai-system",
      isApproved: true,
      tags: [`ai-generated`, exercise.category, exercise.difficulty, ...exercise.muscleGroups]
    };

    await storage.createExercise(exerciseData);
  } catch (error) {
    console.error(`Failed to save exercise ${exercise.name}:`, error);
    throw error;
  }
}

// Build additional exercises for specific muscle groups
export async function expandExerciseLibrary(): Promise<void> {
  try {
    console.log("🚀 Expanding Exercise Library...");
    
    const additionalExercises = [
      // Upper Body Push
      { name: "Diamond Push-ups", category: "strength", muscles: ["triceps", "chest"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Pike Push-ups", category: "strength", muscles: ["shoulders", "triceps"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Incline Push-ups", category: "strength", muscles: ["chest", "shoulders"], equipment: ["bodyweight"], difficulty: "beginner" },
      
      // Upper Body Pull
      { name: "Chin-ups", category: "strength", muscles: ["biceps", "back"], equipment: ["pull-up-bar"], difficulty: "intermediate" },
      { name: "Inverted Rows", category: "strength", muscles: ["back", "biceps"], equipment: ["bodyweight"], difficulty: "intermediate" },
      
      // Lower Body
      { name: "Bulgarian Split Squats", category: "strength", muscles: ["quadriceps", "glutes"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Single Leg Deadlifts", category: "strength", muscles: ["hamstrings", "glutes"], equipment: ["bodyweight"], difficulty: "intermediate" },
      { name: "Calf Raises", category: "strength", muscles: ["calves"], equipment: ["bodyweight"], difficulty: "beginner" },
      
      // Cardio
      { name: "High Knees", category: "cardio", muscles: ["quadriceps", "calves"], equipment: ["bodyweight"], difficulty: "beginner" },
      { name: "Jump Squats", category: "cardio", muscles: ["quadriceps", "glutes"], equipment: ["bodyweight"], difficulty: "intermediate" },
    ];

    for (const spec of additionalExercises) {
      try {
        console.log(`Generating ${spec.name}...`);
        
        const exercise = await generateExerciseWithImage(spec);
        await saveExerciseToDatabase(exercise);
        
        console.log(`✓ Added ${spec.name} to library`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2500));
        
      } catch (error) {
        console.error(`Failed to generate ${spec.name}:`, error);
        continue;
      }
    }

    console.log("🎯 Exercise Library Expansion Complete!");
    
  } catch (error) {
    console.error("Failed to expand exercise library:", error);
  }
}