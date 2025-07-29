const axios = require('axios');
const fs = require('fs');

const openaiApiKey = process.env.OPENAI_API_KEY;

async function generateExerciseList() {
  const prompt = `
  Generate 100 different fitness exercises. 
  For each exercise, include:
  - name: Exercise name
  - muscleGroups: Primary muscle groups (as an array of strings like ["chest", "triceps"])
  - difficulty: "Beginner", "Intermediate", or "Advanced"
  - equipment: Required equipment (like "Dumbbells", "Barbell", "None", "Resistance Band")
  - instructions: Array of 3-4 step-by-step instructions
  - category: "Strength", "Cardio", "Flexibility", or "Core"
  - targetSets: Recommended number of sets (3-5)
  - targetReps: Recommended reps (8-15 for strength, 30-60 for cardio)
  - restTime: Rest time in seconds (30-90)

  Include exercises for all muscle groups: chest, back, shoulders, biceps, triceps, legs, glutes, core, cardio.
  Mix equipment needs: bodyweight, dumbbells, barbells, resistance bands, machines.
  
  Return this as a valid JSON array with the exact structure above.
  `;

  try {
    console.log('🏗️ Generating comprehensive exercise library...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o", // Use latest model
        messages: [
          { 
            role: "system", 
            content: "You are a professional fitness trainer. Generate a comprehensive exercise database in valid JSON format." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3, // Lower temperature for consistency
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
    console.log('📝 Raw response received, parsing JSON...');
    
    let exerciseData;
    try {
      exerciseData = JSON.parse(raw);
      // Handle both array and object responses
      const exercises = exerciseData.exercises || exerciseData;
      
      if (!Array.isArray(exercises)) {
        throw new Error('Response is not an array');
      }
      
      // Add unique IDs and thumbnail URLs
      const exercisesWithIds = exercises.map((exercise, index) => ({
        id: `generated-${index + 1}`,
        thumbnailUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center`,
        ...exercise
      }));

      fs.writeFileSync('server/exerciseLibrary.json', JSON.stringify(exercisesWithIds, null, 2));
      console.log(`✅ ${exercisesWithIds.length} exercises saved to exerciseLibrary.json`);
      
      // Also create a TypeScript version for easier integration
      const tsContent = `// Auto-generated exercise library
export const GENERATED_EXERCISES = ${JSON.stringify(exercisesWithIds, null, 2)} as const;
`;
      fs.writeFileSync('server/exerciseLibrary.ts', tsContent);
      console.log('✅ TypeScript version saved to exerciseLibrary.ts');
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.log('Raw response:', raw.substring(0, 500) + '...');
      throw parseError;
    }
    
  } catch (error) {
    console.error('❌ Error generating exercise library:', error.message);
    
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', error.response.data);
    }
    
    // Fallback: Use existing basic exercises
    console.log('📝 Using fallback exercise data...');
    const fallbackExercises = require('./simple-exercise-builder').BASIC_EXERCISES || [];
    if (fallbackExercises.length > 0) {
      fs.writeFileSync('server/exerciseLibrary.json', JSON.stringify(fallbackExercises, null, 2));
      console.log(`✅ Fallback: ${fallbackExercises.length} basic exercises saved`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  generateExerciseList();
}

module.exports = { generateExerciseList };