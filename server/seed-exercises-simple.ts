import { storage } from "./storage";

const BASIC_EXERCISES = [
  // CHEST EXERCISES
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
    videos: [],
    variations: ["Incline Push-ups", "Diamond Push-ups"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Bench Press",
    category: "strength" as const,
    muscleGroups: ["chest", "triceps", "shoulders"] as const,
    equipment: ["barbell", "bench"],
    difficulty: "intermediate" as const,
    description: "Classic barbell chest exercise for building upper body strength",
    instructions: [
      "Lie flat on bench with feet firmly planted",
      "Grip bar with hands slightly wider than shoulders",
      "Lower bar to chest with control",
      "Press bar back up to starting position"
    ],
    tips: ["Keep shoulder blades retracted", "Don't bounce bar off chest"],
    tags: ["barbell", "compound", "chest"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["Incline Bench Press", "Decline Bench Press"],
    safetyNotes: [],
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
    videos: [],
    variations: ["Goblet Squats", "Front Squats"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Deadlift",
    category: "strength" as const,
    muscleGroups: ["back", "glutes", "hamstrings"] as const,
    equipment: ["barbell"],
    difficulty: "advanced" as const,
    description: "Full-body compound movement targeting multiple muscle groups",
    instructions: [
      "Stand with feet hip-width apart, bar over mid-foot",
      "Hinge at hips and grab bar with hands outside legs",
      "Keep chest up, drive through heels to stand",
      "Lower bar with control"
    ],
    tips: ["Keep bar close to body", "Engage core throughout"],
    tags: ["barbell", "compound", "posterior-chain"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["Romanian Deadlift", "Sumo Deadlift"],
    safetyNotes: [],
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
    videos: [],
    variations: ["Chin-ups", "Assisted Pull-ups"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Overhead Press",
    category: "strength" as const,
    muscleGroups: ["shoulders", "triceps", "chest"] as const,
    equipment: ["barbell", "dumbbells"],
    difficulty: "intermediate" as const,
    description: "Vertical pressing movement for shoulder and arm strength",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Hold bar at shoulder level with overhand grip",
      "Press bar straight up overhead",
      "Lower with control to starting position"
    ],
    tips: ["Keep core tight", "Don't arch back excessively"],
    tags: ["overhead", "compound", "shoulders"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["Dumbbell Press", "Push Press"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Rows",
    category: "strength" as const,
    muscleGroups: ["back", "biceps", "rear-delts"] as const,
    equipment: ["barbell", "dumbbells"],
    difficulty: "beginner" as const,
    description: "Horizontal pulling exercise for back development",
    instructions: [
      "Hinge at hips with slight knee bend",
      "Hold weight with arms extended",
      "Pull weight to lower chest/upper abdomen",
      "Lower with control"
    ],
    tips: ["Keep back straight", "Squeeze shoulder blades together"],
    tags: ["rowing", "compound", "back"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["T-Bar Row", "Cable Row"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Lunges",
    category: "strength" as const,
    muscleGroups: ["quadriceps", "glutes", "hamstrings"] as const,
    equipment: ["bodyweight", "dumbbells"],
    difficulty: "beginner" as const,
    description: "Unilateral lower body exercise for strength and balance",
    instructions: [
      "Step forward with one leg",
      "Lower hips until both knees are bent at 90 degrees",
      "Push back to starting position",
      "Alternate legs or complete all reps on one side"
    ],
    tips: ["Keep front knee over ankle", "Don't let back knee touch ground"],
    tags: ["unilateral", "legs", "balance"],
    images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"],
    videos: [],
    variations: ["Reverse Lunges", "Walking Lunges"],
    safetyNotes: [],
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
    videos: [],
    variations: ["Side Plank", "Plank with Leg Lifts"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Burpees",
    category: "cardio" as const,
    muscleGroups: ["chest", "shoulders", "legs"] as const,
    equipment: ["bodyweight"],
    difficulty: "intermediate" as const,
    description: "Full-body cardio exercise combining multiple movements",
    instructions: [
      "Start standing, then drop into squat position",
      "Jump feet back into plank position",
      "Do a push-up (optional)",
      "Jump feet back to squat, then jump up with arms overhead"
    ],
    tips: ["Move at your own pace", "Modify by stepping instead of jumping"],
    tags: ["cardio", "full-body", "high-intensity"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["Half Burpees", "Burpee Box Jumps"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Incline Push-ups",
    category: "strength" as const,
    muscleGroups: ["chest", "triceps", "shoulders"] as const,
    equipment: ["bodyweight", "bench"],
    difficulty: "beginner" as const,
    description: "Easier variation of push-ups using an elevated surface",
    instructions: [
      "Place hands on an elevated surface like a bench or step",
      "Walk feet back to create an inclined plank position",
      "Lower chest toward the surface",
      "Push back up to starting position"
    ],
    tips: ["Higher the surface, easier the exercise", "Keep body straight"],
    tags: ["bodyweight", "beginner", "chest", "progression"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    videos: [],
    variations: ["Wall Push-ups", "Knee Push-ups"],
    safetyNotes: [],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Diamond Push-ups",
    category: "strength" as const,
    muscleGroups: ["triceps", "chest", "shoulders"] as const,
    equipment: ["bodyweight"],
    difficulty: "advanced" as const,
    description: "Advanced push-up variation targeting triceps",
    instructions: [
      "Start in push-up position with hands forming a diamond shape",
      "Lower body until chest touches hands",
      "Push back up to starting position",
      "Keep elbows close to body"
    ],
    tips: ["Focus on triceps engagement", "Progress from regular push-ups first"],
    tags: ["bodyweight", "advanced", "triceps"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Chest Dips",
    category: "strength" as const,
    muscleGroups: ["chest", "triceps", "shoulders"] as const,
    equipment: ["dip-bars", "parallel-bars"],
    difficulty: "intermediate" as const,
    description: "Compound exercise targeting chest and triceps",
    instructions: [
      "Grip parallel bars and lift body up",
      "Lean slightly forward",
      "Lower body by bending elbows",
      "Push back up to starting position"
    ],
    tips: ["Lean forward for chest emphasis", "Control the descent"],
    tags: ["compound", "intermediate", "chest"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },

  // LEG EXERCISES
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
    name: "Lunges",
    category: "strength" as const,
    muscleGroups: ["quadriceps", "glutes", "hamstrings", "calves"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Unilateral lower body exercise for strength and balance",
    instructions: [
      "Step forward with one leg",
      "Lower hips until both knees are bent at 90 degrees",
      "Push back to starting position",
      "Alternate legs or complete all reps on one side"
    ],
    tips: ["Keep front knee over ankle", "Don't let back knee touch ground"],
    tags: ["bodyweight", "unilateral", "legs"],
    images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Jump Squats",
    category: "strength" as const,
    muscleGroups: ["quadriceps", "glutes", "hamstrings", "calves"] as const,
    equipment: ["bodyweight"],
    difficulty: "intermediate" as const,
    description: "Explosive squat variation for power development",
    instructions: [
      "Start in squat position",
      "Explode up into a jump",
      "Land softly back in squat position",
      "Immediately transition into next rep"
    ],
    tips: ["Land softly on balls of feet", "Keep core engaged throughout"],
    tags: ["bodyweight", "explosive", "legs"],
    images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Single Leg Glute Bridges",
    category: "strength" as const,
    muscleGroups: ["glutes", "hamstrings", "core"] as const,
    equipment: ["bodyweight"],
    difficulty: "intermediate" as const,
    description: "Unilateral glute activation exercise",
    instructions: [
      "Lie on back with one foot planted, other leg extended",
      "Squeeze glute and lift hips up",
      "Hold briefly at top",
      "Lower with control"
    ],
    tips: ["Focus on glute squeeze", "Keep hips level"],
    tags: ["bodyweight", "glutes", "unilateral"],
    images: ["https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400"],
    isApproved: true,
    createdBy: "system"
  },

  // BACK EXERCISES
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
    name: "Chin-ups",
    category: "strength" as const,
    muscleGroups: ["back", "biceps", "lats"] as const,
    equipment: ["pull-up-bar"],
    difficulty: "intermediate" as const,
    description: "Pull-up variation with underhand grip emphasizing biceps",
    instructions: [
      "Hang from bar with palms facing toward you",
      "Pull body up until chin clears bar",
      "Lower with control to full arm extension",
      "Focus on bicep and back engagement"
    ],
    tips: ["Easier than pull-ups for most people", "Great for bicep development"],
    tags: ["bodyweight", "back", "biceps"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Inverted Rows",
    category: "strength" as const,
    muscleGroups: ["back", "biceps", "rear-delts"] as const,
    equipment: ["barbell", "rack"],
    difficulty: "beginner" as const,
    description: "Horizontal pulling exercise great for pull-up progression",
    instructions: [
      "Set up bar at waist height",
      "Lie underneath and grab bar with overhand grip",
      "Pull chest to bar keeping body straight",
      "Lower with control"
    ],
    tips: ["Great progression for pull-ups", "Keep body in straight line"],
    tags: ["beginner", "back", "horizontal-pull"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Superman",
    category: "strength" as const,
    muscleGroups: ["lower-back", "glutes", "hamstrings"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Lower back strengthening exercise",
    instructions: [
      "Lie face down with arms extended overhead",
      "Simultaneously lift chest and legs off ground",
      "Hold for 2-3 seconds",
      "Lower back down with control"
    ],
    tips: ["Don't overextend neck", "Focus on squeezing glutes"],
    tags: ["bodyweight", "lower-back", "glutes"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },

  // CORE EXERCISES
  {
    name: "Plank",
    category: "strength" as const,
    muscleGroups: ["abs", "core", "shoulders"] as const,
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
    name: "Mountain Climbers",
    category: "cardio" as const,
    muscleGroups: ["core", "shoulders", "legs"] as const,
    equipment: ["bodyweight"],
    difficulty: "intermediate" as const,
    description: "Dynamic core exercise with cardio benefits",
    instructions: [
      "Start in plank position",
      "Bring one knee toward chest",
      "Quickly switch legs",
      "Continue alternating at a fast pace"
    ],
    tips: ["Keep hips level", "Maintain plank position throughout"],
    tags: ["bodyweight", "cardio", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Russian Twists",
    category: "strength" as const,
    muscleGroups: ["abs", "obliques", "core"] as const,
    equipment: ["bodyweight"],
    difficulty: "intermediate" as const,
    description: "Rotational core exercise targeting obliques",
    instructions: [
      "Sit with knees bent, feet off ground",
      "Lean back slightly to engage core",
      "Rotate torso left and right",
      "Touch ground beside hips with each twist"
    ],
    tips: ["Keep chest up", "Control the rotation"],
    tags: ["bodyweight", "rotation", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },
  {
    name: "Dead Bug",
    category: "strength" as const,
    muscleGroups: ["core", "abs", "hip-flexors"] as const,
    equipment: ["bodyweight"],
    difficulty: "beginner" as const,
    description: "Core stability exercise focusing on control",
    instructions: [
      "Lie on back with arms up and knees at 90 degrees",
      "Slowly extend opposite arm and leg",
      "Return to starting position",
      "Switch sides and repeat"
    ],
    tips: ["Keep lower back pressed to floor", "Move slowly and controlled"],
    tags: ["bodyweight", "stability", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
    isApproved: true,
    createdBy: "system"
  },

  // CARDIO EXERCISES
  {
    name: "Jumping Jacks",
    category: "cardio" as const,
    muscleGroups: ["calves", "shoulders", "core"] as const,
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