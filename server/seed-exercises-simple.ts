import { storage } from "./storage";

const BASIC_EXERCISES = [
  {
    name: "Push-ups",
    category: "strength" as const,
    muscleGroups: ["chest", "triceps", "shoulders"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Classic bodyweight exercise targeting chest, shoulders, and triceps",
    instructions: [
      "Start in a plank position with hands slightly wider than shoulders",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position",
      "Keep your core tight throughout the movement"
    ],
    tips: ["Keep your body in a straight line", "Don't let hips sag or pike up"],
    tags: ["bodyweight", "beginner", "chest"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Squats",
    category: "strength" as const,
    muscleGroups: ["quadriceps", "glutes", "hamstrings"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Fundamental lower body compound movement",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower hips back and down as if sitting in chair",
      "Keep chest up and knees tracking over toes",
      "Return to standing position"
    ],
    tips: ["Don't let knees cave inward", "Go down until thighs parallel to floor"],
    tags: ["bodyweight", "compound", "legs"],
    images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Pull-ups",
    category: "strength" as const,
    muscleGroups: ["back", "biceps", "lats"] as const,
    equipment: ["pull-up-bar"],
    difficulty: "intermediate" as const,
    description: "Compound bodyweight exercise for back and biceps",
    instructions: [
      "Hang from bar with palms facing away",
      "Pull body up until chin clears bar",
      "Lower with control to full arm extension",
      "Engage lats and squeeze shoulder blades"
    ],
    tips: ["Don't swing or use momentum", "Focus on pulling with back muscles"],
    tags: ["bodyweight", "compound", "back"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Plank",
    category: "strength" as const,
    muscleGroups: ["abs", "chest", "shoulders"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Isometric core strengthening exercise",
    instructions: [
      "Start in push-up position on forearms",
      "Keep body in straight line from head to heels",
      "Hold position while breathing normally",
      "Engage core muscles throughout"
    ],
    tips: ["Don't let hips sag or pike up", "Keep neck in neutral position"],
    tags: ["bodyweight", "isometric", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Jumping Jacks",
    category: "cardio" as const,
    muscleGroups: ["calves", "shoulders"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Classic cardio exercise for full body activation",
    instructions: [
      "Start standing with feet together, arms at sides",
      "Jump feet apart while raising arms overhead",
      "Jump back to starting position",
      "Maintain steady rhythm"
    ],
    tips: ["Land softly on balls of feet", "Keep core engaged"],
    tags: ["cardio", "bodyweight", "full-body"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  }
];

export async function seedBasicExercises(): Promise<void> {
  console.log("Seeding basic exercises...");
  
  try {
    // Check if exercises already exist
    const existingExercises = await storage.getAllExercises();
    if (existingExercises.length > 0) {
      console.log(`Database already has ${existingExercises.length} exercises, skipping seed.`);
      return;
    }

    for (const exercise of BASIC_EXERCISES) {
      await storage.createExercise(exercise);
      console.log(`✓ Added: ${exercise.name}`);
    }
    
    console.log(`Successfully seeded ${BASIC_EXERCISES.length} exercises!`);
  } catch (error) {
    console.error("Error seeding basic exercises:", error);
  }
}