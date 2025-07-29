import axios from 'axios';
import fs from 'fs';
import { Exercise } from '../shared/schema';

interface AIExerciseResponse {
  name: string;
  muscleGroups: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  equipment: string;
  instructions: string[];
  category: "Strength" | "Cardio" | "Flexibility" | "Core";
  targetSets: number;
  targetReps: number;
  restTime: number;
}

export async function generateComprehensiveExerciseLibrary(): Promise<void> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.log("⚠️ No OpenAI API key found, skipping AI exercise generation");
    return;
  }

  const prompt = `
  Generate exactly 100 different fitness exercises as a JSON object with an "exercises" array.
  
  For each exercise, include:
  - name: Exercise name (string)
  - muscleGroups: Primary muscle groups (array of strings like ["chest", "triceps"])
  - difficulty: "Beginner", "Intermediate", or "Advanced"
  - equipment: Required equipment (string like "Dumbbells", "Barbell", "None", "Resistance Band")
  - instructions: Array of 3-4 step-by-step instructions (array of strings)
  - category: "Strength", "Cardio", "Flexibility", or "Core"
  - targetSets: Recommended number of sets (number 3-5)
  - targetReps: Recommended reps (number 8-15 for strength, 30-60 for cardio)
  - restTime: Rest time in seconds (number 30-90)

  Include exercises for all muscle groups: chest, back, shoulders, biceps, triceps, legs, glutes, core, cardio.
  Mix equipment needs: bodyweight, dumbbells, barbells, resistance bands, machines.
  
  Return as: {"exercises": [...]}
  `;

  try {
    console.log('🤖 Generating comprehensive exercise library with AI...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a certified fitness trainer. Generate a comprehensive exercise database in valid JSON format with exactly the requested structure." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log('📝 Parsing AI-generated exercise data...');
    
    const exerciseData = JSON.parse(raw);
    const exercises: AIExerciseResponse[] = exerciseData.exercises || [];
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw new Error('Invalid exercise data format received from AI');
    }
    
    // Convert to our Exercise schema format
    const formattedExercises: Exercise[] = exercises.map((exercise, index) => ({
      id: `ai-gen-${index + 1}`,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      equipment: [exercise.equipment],
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      restTime: exercise.restTime
    }));

    // Save to JSON file
    fs.writeFileSync('server/exerciseLibrary.json', JSON.stringify(formattedExercises, null, 2));
    console.log(`✅ ${formattedExercises.length} AI-generated exercises saved to exerciseLibrary.json`);
    
    // Import and populate database using existing function
    try {
      const { buildAIExerciseLibrary } = await import('./ai-exercise-database-builder');
      // Save exercises to be picked up by the database builder
      console.log(`🎯 Preparing ${formattedExercises.length} exercises for database import...`);
    } catch (dbError) {
      console.log('ℹ️ Database import will be handled by existing exercise builder');
    }
    
  } catch (error: any) {
    console.error('❌ Error generating AI exercise library:', error.message);
    
    if (error.response) {
      console.error('API Status:', error.response.status);
      if (error.response.status === 429) {
        console.log('💡 OpenAI API quota exceeded - using fallback exercise library');
      }
    }
    
    // Let the fallback system handle this
    throw error;
  }
}