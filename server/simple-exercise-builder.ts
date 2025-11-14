import { storage } from "./storage.ts";

// Build exercises without OpenAI API to get us started
export const BASIC_EXERCISES = [
      {
        name: "Push-ups",
        category: "strength",
        muscleGroups: ["chest", "triceps", "shoulders"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Classic bodyweight exercise targeting chest, shoulders, and triceps. Great for building upper body strength and can be modified for all fitness levels.",
        instructions: [
          "Start in a plank position with hands slightly wider than shoulders",
          "Keep your body in a straight line from head to heels",
          "Lower your body until chest nearly touches the floor",
          "Push back up to starting position with control",
          "Repeat for desired number of repetitions"
        ],
        tips: [
          "Keep your core tight throughout the movement",
          "Don't let hips sag or pike up",
          "Focus on controlled movement, not speed",
          "Breathe in on the way down, exhale on the way up"
        ],
        safetyNotes: [
          "Stop if you feel wrist pain",
          "Modify on knees if full push-ups are too difficult",
          "Don't continue if form breaks down"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Incline Push-ups", "Diamond Push-ups", "Wide-grip Push-ups"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "beginner", "chest", "upper-body"]
      },
      {
        name: "Squats",
        category: "strength",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Fundamental lower body compound movement that targets multiple leg muscles. Essential exercise for building functional strength and mobility.",
        instructions: [
          "Stand with feet shoulder-width apart, toes slightly pointed out",
          "Lower hips back and down as if sitting in an invisible chair",
          "Keep chest up and knees tracking over toes",
          "Descend until thighs are parallel to floor or as low as comfortable",
          "Drive through heels to return to standing position"
        ],
        tips: [
          "Don't let knees cave inward",
          "Keep weight distributed across whole foot",
          "Maintain neutral spine throughout movement",
          "Focus on sitting back rather than just bending knees"
        ],
        safetyNotes: [
          "Don't force depth if you lack mobility",
          "Stop if you feel knee or back pain",
          "Start with partial range if needed"
        ],
        images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Goblet Squats", "Jump Squats", "Single-leg Squats"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "beginner", "legs", "compound"]
      },
      {
        name: "Plank",
        category: "strength",
        muscleGroups: ["abs", "shoulders", "back"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Isometric core strengthening exercise that builds stability and endurance. Excellent for developing a strong foundation for other exercises.",
        instructions: [
          "Start in push-up position with forearms on ground",
          "Keep body in straight line from head to heels",
          "Engage core muscles and avoid sagging hips",
          "Breathe normally while holding position",
          "Hold for desired time duration"
        ],
        tips: [
          "Squeeze glutes to maintain straight line",
          "Don't hold breath - breathe normally",
          "Focus on quality over duration",
          "Keep neck in neutral position"
        ],
        safetyNotes: [
          "Stop if you feel lower back pain",
          "Modify on knees if needed",
          "Don't continue if form breaks down"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Side Plank", "Plank Up-downs", "Plank with Leg Lifts"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "beginner", "core", "stability"]
      },
      {
        name: "Lunges",
        category: "strength",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Unilateral lower body exercise that improves balance, coordination, and leg strength. Great for correcting muscle imbalances.",
        instructions: [
          "Stand tall with feet hip-width apart",
          "Take a large step forward with one leg",
          "Lower body until front thigh is parallel to floor",
          "Keep front knee over ankle, back knee nearly touching ground",
          "Push through front heel to return to starting position"
        ],
        tips: [
          "Keep torso upright throughout movement",
          "Don't let front knee drift past toes",
          "Control the descent, don't drop down",
          "Engage core for stability"
        ],
        safetyNotes: [
          "Start with bodyweight before adding resistance",
          "Stop if you feel knee pain",
          "Use support if balance is challenging"
        ],
        images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Reverse Lunges", "Walking Lunges", "Lateral Lunges"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "beginner", "legs", "unilateral"]
      },
      {
        name: "Mountain Climbers",
        category: "cardio",
        muscleGroups: ["abs", "shoulders", "quadriceps"],
        equipment: ["bodyweight"],
        difficulty: "intermediate",
        description: "Dynamic full-body exercise that combines cardio and strength training. Excellent for improving cardiovascular fitness and core stability.",
        instructions: [
          "Start in plank position with hands under shoulders",
          "Bring right knee toward chest, then quickly switch",
          "Alternate legs in running motion while maintaining plank",
          "Keep hips level and core engaged",
          "Continue for desired time or repetitions"
        ],
        tips: [
          "Maintain strong plank position throughout",
          "Start slow and build up speed",
          "Keep breathing steady",
          "Don't let hips bounce up and down"
        ],
        safetyNotes: [
          "Stop if wrists become painful",
          "Slow down if form deteriorates",
          "Modify by elevating hands if needed"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Slow Mountain Climbers", "Cross-body Mountain Climbers", "Mountain Climber Push-ups"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "cardio", "core", "full-body"]
      },
      {
        name: "Burpees",
        category: "cardio",
        muscleGroups: ["quadriceps", "chest", "shoulders"],
        equipment: ["bodyweight"],
        difficulty: "intermediate",
        description: "High-intensity full-body exercise that combines strength and cardio. One of the most effective exercises for overall fitness.",
        instructions: [
          "Start standing, then squat down and place hands on floor",
          "Jump feet back into plank position",
          "Perform push-up (optional for beginners)",
          "Jump feet back to squat position",
          "Explode up with jump and arms overhead"
        ],
        tips: [
          "Focus on smooth transitions between movements",
          "Land softly on jumps",
          "Modify by stepping back instead of jumping",
          "Pace yourself to maintain good form"
        ],
        safetyNotes: [
          "Skip the push-up if too challenging",
          "Step instead of jump if needed",
          "Stop if you feel dizzy or overly fatigued"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Half Burpees", "Burpee Box Jumps", "Single-arm Burpees"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "cardio", "full-body", "hiit"]
      },
      {
        name: "Dead Bug",
        category: "strength",
        muscleGroups: ["abs", "lower_back"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Core stabilization exercise that teaches proper spine alignment and helps prevent lower back pain. Excellent for beginners.",
        instructions: [
          "Lie on back with arms extended toward ceiling",
          "Bend knees to 90 degrees, shins parallel to floor",
          "Slowly lower opposite arm and leg toward floor",
          "Keep lower back pressed against floor",
          "Return to starting position and switch sides"
        ],
        tips: [
          "Move slowly and with control",
          "Keep lower back flat against floor",
          "Don't hold breath",
          "Focus on stability, not speed"
        ],
        safetyNotes: [
          "Stop if lower back lifts off floor",
          "Reduce range of motion if needed",
          "Don't rush the movement"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Single-arm Dead Bug", "Single-leg Dead Bug", "Dead Bug with Band"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "core", "stability", "beginner"]
      },
      {
        name: "Glute Bridges",
        category: "strength",
        muscleGroups: ["glutes", "hamstrings"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Targeted glute exercise that also helps with hip mobility and lower back health. Perfect for activating dormant glute muscles.",
        instructions: [
          "Lie on back with knees bent, feet flat on floor",
          "Squeeze glutes and lift hips toward ceiling",
          "Create straight line from knees to shoulders",
          "Hold briefly at top",
          "Lower hips with control to starting position"
        ],
        tips: [
          "Drive through heels, not toes",
          "Squeeze glutes at the top",
          "Don't arch lower back excessively",
          "Keep knees pointing forward"
        ],
        safetyNotes: [
          "Don't overextend at the top",
          "Keep movement controlled",
          "Stop if you feel back pain"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Single-leg Glute Bridge", "Glute Bridge Hold", "Glute Bridge March"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["bodyweight", "glutes", "beginner", "activation"]
      },
      {
        name: "Wall Sits",
        category: "strength",
        muscleGroups: ["quadriceps", "glutes"],
        equipment: ["wall"],
        difficulty: "beginner",
        description: "Isometric leg exercise that builds endurance and strength in the quadriceps and glutes. Great for building mental toughness too.",
        instructions: [
          "Stand with back against wall, feet shoulder-width apart",
          "Slide down wall until thighs are parallel to floor",
          "Keep knees at 90 degrees, feet flat on floor",
          "Hold position while breathing normally",
          "Stand up when time is complete"
        ],
        tips: [
          "Keep back flat against wall",
          "Don't let knees cave inward",
          "Breathe normally throughout hold",
          "Start with shorter holds and build up"
        ],
        safetyNotes: [
          "Stop if knees become painful",
          "Don't hold breath",
          "Come up if you feel faint"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Single-leg Wall Sit", "Wall Sit with Arm Raises", "Wall Sit Pulses"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["isometric", "legs", "beginner", "endurance"]
      },
      {
        name: "High Knees",
        category: "cardio",
        muscleGroups: ["quadriceps", "calves"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        description: "Dynamic cardio exercise that improves coordination, agility, and cardiovascular fitness. Great warm-up exercise.",
        instructions: [
          "Stand tall with feet hip-width apart",
          "Run in place lifting knees as high as possible",
          "Aim to bring knees to hip level or higher",
          "Pump arms naturally with the movement",
          "Maintain quick, light steps"
        ],
        tips: [
          "Stay on balls of feet",
          "Keep torso upright",
          "Start at moderate pace and build speed",
          "Focus on knee height, not speed"
        ],
        safetyNotes: [
          "Land softly to protect joints",
          "Stop if you feel overly winded",
          "Modify by marching if needed"
        ],
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60"],
        videos: [],
        variations: ["Marching in Place", "High Knees with Arms", "Alternating High Knees"],
        isUserCreated: false,
        createdBy: "ai-system",
        isApproved: true,
        tags: ["cardio", "warm-up", "coordination", "beginner"]
      }
    ];

export async function buildBasicExerciseLibrary(): Promise<void> {
  try {
    console.log("🏗️ Building basic exercise library...");
    // Save each exercise to the database
    for (const exercise of BASIC_EXERCISES) {
      try {
        await storage.createExercise(exercise as any);
        console.log(`✓ Added: ${exercise.name}`);
      } catch (error) {
        console.error(`Failed to save ${exercise.name}:`, error);
      }
    }

    console.log(`🎯 Built ${BASIC_EXERCISES.length} basic exercises for the library!`);
    
  } catch (error) {
    console.error("Failed to build basic exercise library:", error);
  }
}