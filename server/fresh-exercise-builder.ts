import OpenAI from "openai";
import { storage } from "./storage.ts";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

/**
 * Completely rebuild exercise library from scratch using OpenAI
 */
export async function buildFreshExerciseLibrary(): Promise<void> {
  try {
    console.log("🗑️ Clearing all existing exercises...");
    
    // Delete ALL existing exercises
    const existingExercises = await storage.getAllExercises();
    for (const exercise of existingExercises) {
      await storage.deleteExercise(exercise.id);
    }
    console.log(`✅ Cleared ${existingExercises.length} existing exercises`);
    
    console.log("🤖 Building fresh exercise library with OpenAI...");
    
    // Generate exercises in smaller, manageable batches
    const exerciseBatches = [
      {
        name: "Bodyweight Exercises",
        exercises: ["Push-ups", "Squats", "Planks", "Lunges", "Burpees", "Mountain Climbers", "Jumping Jacks", "Pull-ups", "Dips", "Sit-ups"]
      },
      {
        name: "Dumbbell Exercises", 
        exercises: ["Dumbbell Bench Press", "Dumbbell Rows", "Shoulder Press", "Bicep Curls", "Tricep Extensions", "Goblet Squats", "Romanian Deadlifts", "Chest Flyes", "Lateral Raises", "Hammer Curls"]
      },
      {
        name: "Barbell Exercises",
        exercises: ["Deadlifts", "Back Squats", "Barbell Bench Press", "Bent-over Rows", "Overhead Press", "Hip Thrusts", "Front Squats", "Barbell Curls"]
      },
      {
        name: "Cardio & Flexibility",
        exercises: ["Running", "Cycling", "Jump Rope", "Box Jumps", "Downward Dog", "Child's Pose", "Warrior Pose", "High Knees"]
      }
    ];

    let allExercises: GeneratedExercise[] = [];
    
    for (const batch of exerciseBatches) {
      try {
        console.log(`🔄 Generating ${batch.name}...`);
        
        const exercisePrompt = `Generate detailed fitness exercise data for these ${batch.exercises.length} exercises: ${batch.exercises.join(", ")}

For each exercise, provide:
- name: Exact exercise name from the list
- category: "strength", "cardio", "flexibility", "sports", or "functional"
- muscleGroups: Array of specific muscle groups worked
- equipment: Array of equipment needed (use "bodyweight" for no equipment)
- difficulty: "beginner", "intermediate", or "advanced"
- description: Brief 1-2 sentence description
- instructions: Array of 3-4 step-by-step instructions
- tips: Array of 2 helpful tips for proper form
- safetyNotes: Array of 1-2 safety considerations
- variations: Array of 1-2 exercise variations
- imageUrl: Generate a realistic Unsplash URL

Respond with JSON object: {"exercises": [exercise_array]}`;

        if (!openai) {
          throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
        }
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a professional fitness expert. Generate detailed, accurate exercise information in valid JSON format."
            },
            {
              role: "user",
              content: exercisePrompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 3000
        });

        const content = response.choices[0].message.content;
        if (!content) {
          console.log(`⚠️ Empty response for ${batch.name}, skipping...`);
          continue;
        }

        const aiResponse = JSON.parse(content);
        
        if (aiResponse.exercises && Array.isArray(aiResponse.exercises)) {
          allExercises.push(...aiResponse.exercises);
          console.log(`✓ Generated ${aiResponse.exercises.length} exercises for ${batch.name}`);
        }
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Failed to generate ${batch.name}:`, error.message);
      }
    }

    console.log(`🎯 Total exercises generated: ${allExercises.length}`);

    // Save each exercise to storage
    let savedCount = 0;
    for (const exerciseData of allExercises) {
      try {
        const exercise = {
          id: `ai-fresh-${Date.now()}-${savedCount}`,
          name: exerciseData.name,
          description: exerciseData.description,
          instructions: exerciseData.instructions,
          category: exerciseData.category,
          muscleGroups: exerciseData.muscleGroups,
          equipment: exerciseData.equipment,
          difficulty: exerciseData.difficulty,
          imageUrl: exerciseData.imageUrl,
          tips: exerciseData.tips || [],
          safetyNotes: exerciseData.safetyNotes || [],
          variations: exerciseData.variations || [],
          targetSets: 3,
          targetReps: 12,
          restTime: 60,
          createdBy: "ai-system",
          isApproved: true,
          createdAt: new Date()
        };

        await storage.createExercise(exercise);
        savedCount++;
        console.log(`✓ Added: ${exercise.name}`);
        
      } catch (error) {
        console.log(`⚠️ Failed to save ${exerciseData.name}:`, error.message);
      }
    }

    console.log(`🎉 Fresh exercise library built successfully! Added ${savedCount} exercises`);
    
  } catch (error) {
    console.error("❌ Error building fresh exercise library:", error);
    throw error;
  }
}