import OpenAI from "openai";
import { storage } from "./storage.ts";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Expand the exercise library with additional specialized exercises
 */
export async function expandExerciseLibrary(): Promise<void> {
  try {
    console.log("🚀 Expanding exercise library with specialized exercises...");
    
    // Check current count
    const currentExercises = await storage.getAllExercises();
    console.log(`📊 Current library has ${currentExercises.length} exercises`);
    
    if (currentExercises.length >= 60) {
      console.log("✅ Exercise library already comprehensive");
      return;
    }

    // Additional specialized exercise categories
    const specializedBatches = [
      {
        name: "Advanced Bodyweight",
        exercises: ["Handstand Push-ups", "Pistol Squats", "Muscle-ups", "L-sits", "Human Flag", "Dragon Flag"]
      },
      {
        name: "Functional Training",
        exercises: ["Turkish Get-ups", "Farmer's Walk", "Bear Crawl", "Crab Walk", "Sled Push", "Battle Ropes"]
      },
      {
        name: "Core Specialists",
        exercises: ["Hanging Leg Raises", "V-ups", "Hollow Body Hold", "Side Planks", "Dead Bug", "Bird Dog"]
      },
      {
        name: "Kettlebell Training",
        exercises: ["Kettlebell Swings", "Turkish Get-up", "Kettlebell Clean", "Goblet Squat", "Kettlebell Snatch"]
      },
      {
        name: "Plyometric Power",
        exercises: ["Burpee Box Jump", "Depth Jumps", "Broad Jumps", "Split Lunge Jumps", "Clapping Push-ups"]
      }
    ];

    for (const batch of specializedBatches) {
      try {
        console.log(`🔄 Generating ${batch.name}...`);
        
        const exercisePrompt = `Generate detailed fitness exercise data for these advanced ${batch.exercises.length} exercises: ${batch.exercises.join(", ")}

For each exercise, provide:
- name: Exact exercise name from the list
- category: "strength", "cardio", "flexibility", "sports", or "functional"
- muscleGroups: Array of specific muscle groups worked (use: chest, back, shoulders, biceps, triceps, forearms, abs, obliques, lower_back, glutes, quadriceps, hamstrings, calves, traps, lats, delts)
- equipment: Array of equipment needed (use "bodyweight" for no equipment)
- difficulty: "beginner", "intermediate", or "advanced"
- description: Brief 1-2 sentence description
- instructions: Array of 4-5 detailed step-by-step instructions
- tips: Array of 2-3 helpful tips for proper form
- safetyNotes: Array of 1-2 important safety considerations
- variations: Array of 1-2 exercise variations
- imageUrl: Generate a realistic Unsplash URL for exercise demonstration

Respond with JSON object: {"exercises": [exercise_array]}`;

        if (!openai) {
          throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
        }
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a professional fitness expert specializing in advanced training. Generate detailed, accurate exercise information in valid JSON format."
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
          // Save each exercise to storage
          for (const exerciseData of aiResponse.exercises) {
            try {
              const exercise = {
                id: `ai-exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
              console.log(`✓ Added: ${exercise.name}`);
              
            } catch (error) {
              console.log(`⚠️ Failed to save ${exerciseData.name}:`, error.message);
            }
          }
          
          console.log(`✓ Generated ${aiResponse.exercises.length} exercises for ${batch.name}`);
        }
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Failed to generate ${batch.name}:`, error.message);
      }
    }

    const finalCount = await storage.getAllExercises();
    console.log(`🎯 Exercise library expanded! Total exercises: ${finalCount.length}`);
    
  } catch (error) {
    console.error("❌ Error expanding exercise library:", error);
  }
}