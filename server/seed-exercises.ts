import { storage } from "./storage.ts";

const COMPREHENSIVE_EXERCISES = [
  // CHEST EXERCISES
  {
    name: "Push-up",
    category: "strength",
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Start in a plank position with hands slightly wider than shoulders",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position",
      "Keep your core tight throughout the movement"
    ],
    tips: ["Keep your body in a straight line", "Don't let hips sag or pike up"],
    description: "Classic bodyweight exercise targeting chest, shoulders, and triceps",
    tags: ["bodyweight", "beginner", "chest"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Bench Press",
    category: "strength", 
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: [
      "Lie on bench with feet flat on floor",
      "Grip barbell slightly wider than shoulder width",
      "Lower bar to chest with control",
      "Press bar up until arms are fully extended"
    ],
    tips: ["Keep shoulder blades retracted", "Don't bounce bar off chest"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Fundamental compound exercise for chest development",
    tags: ["barbell", "compound", "strength"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Dumbbell Flyes",
    category: "strength",
    muscleGroups: ["chest"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: [
      "Lie on bench holding dumbbells above chest",
      "Lower weights in arc motion with slight bend in elbows",
      "Feel stretch in chest then reverse motion",
      "Squeeze chest muscles at top"
    ],
    tips: ["Don't go too heavy", "Focus on controlled movement"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Isolation exercise for chest muscle development",
    tags: ["dumbbells", "isolation", "chest"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // BACK EXERCISES
  {
    name: "Pull-up",
    category: "strength",
    muscleGroups: ["back", "biceps"],
    equipment: ["pull-up-bar"],
    difficulty: "intermediate",
    instructions: [
      "Hang from bar with palms facing away",
      "Pull body up until chin clears bar", 
      "Lower with control to full arm extension",
      "Engage lats and squeeze shoulder blades"
    ],
    tips: ["Don't swing or use momentum", "Focus on pulling with back muscles"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Compound bodyweight exercise for back and biceps",
    tags: ["bodyweight", "compound", "back"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Bent-over Row",
    category: "strength",
    muscleGroups: ["back", "biceps"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: [
      "Bend at hips with slight knee bend, back straight",
      "Grip barbell with overhand grip",
      "Pull bar to lower chest/upper abdomen",
      "Lower with control"
    ],
    tips: ["Keep core engaged", "Don't round your back"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Compound rowing exercise for back development",
    tags: ["barbell", "compound", "back"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Lat Pulldown",
    category: "strength",
    muscleGroups: ["back", "biceps"],
    equipment: ["cable-machine"],
    difficulty: "beginner",
    instructions: [
      "Sit at lat pulldown machine with wide grip",
      "Pull bar down to upper chest",
      "Squeeze shoulder blades together",
      "Control the weight back up"
    ],
    tips: ["Don't lean back excessively", "Focus on lat engagement"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Machine exercise targeting latissimus dorsi",
    tags: ["cable", "machine", "back"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // LEG EXERCISES
  {
    name: "Squat",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower hips back and down as if sitting in chair",
      "Keep chest up and knees tracking over toes", 
      "Return to standing position"
    ],
    tips: ["Don't let knees cave inward", "Go down until thighs parallel to floor"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Fundamental lower body compound movement",
    tags: ["bodyweight", "compound", "legs"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Deadlift",
    category: "strength",
    muscleGroups: ["hamstrings", "glutes", "back"],
    equipment: ["barbell"],
    difficulty: "advanced",
    instructions: [
      "Stand with feet hip-width apart, bar over mid-foot",
      "Hinge at hips and grip bar with hands outside legs",
      "Keep back straight, drive through heels to stand",
      "Lower bar with control"
    ],
    tips: ["Keep bar close to body", "Don't round your back"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "King of compound exercises targeting posterior chain",
    tags: ["barbell", "compound", "full-body"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Lunges",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Step forward with one leg into lunge position",
      "Lower hips until both knees at 90 degrees",
      "Push back to starting position",
      "Alternate legs or complete one side first"
    ],
    tips: ["Keep front knee over ankle", "Don't let back knee touch ground"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Unilateral leg exercise for strength and balance",
    tags: ["bodyweight", "unilateral", "legs"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // SHOULDER EXERCISES
  {
    name: "Overhead Press",
    category: "strength",
    muscleGroups: ["shoulders", "triceps"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: [
      "Stand with dumbbells at shoulder height",
      "Press weights straight up overhead",
      "Lower with control to starting position",
      "Keep core engaged throughout"
    ],
    tips: ["Don't arch back excessively", "Press in straight line"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Compound exercise for shoulder development",
    tags: ["dumbbells", "compound", "shoulders"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Lateral Raises",
    category: "strength",
    muscleGroups: ["shoulders"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: [
      "Hold dumbbells at sides with slight bend in elbows",
      "Raise arms out to sides until parallel to floor",
      "Lower with control",
      "Focus on deltoid muscles lifting the weight"
    ],
    tips: ["Don't use momentum", "Lead with pinkies on the way up"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Isolation exercise for side deltoids",
    tags: ["dumbbells", "isolation", "shoulders"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // ARM EXERCISES
  {
    name: "Bicep Curls",
    category: "strength",
    muscleGroups: ["biceps"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: [
      "Hold dumbbells at sides with palms facing forward",
      "Curl weights up toward shoulders",
      "Squeeze biceps at top",
      "Lower with control"
    ],
    tips: ["Don't swing the weights", "Keep elbows stationary"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Classic isolation exercise for biceps",
    tags: ["dumbbells", "isolation", "arms"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Tricep Dips",
    category: "strength",
    muscleGroups: ["triceps"],
    equipment: ["none"],
    difficulty: "intermediate",
    instructions: [
      "Sit on edge of chair or bench",
      "Place hands on edge, slide forward",
      "Lower body by bending elbows",
      "Push back up to starting position"
    ],
    tips: ["Keep elbows close to body", "Don't go too low"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Bodyweight exercise for triceps development",
    tags: ["bodyweight", "triceps", "arms"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // CORE EXERCISES
  {
    name: "Plank",
    category: "strength",
    muscleGroups: ["core"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Start in push-up position on forearms",
      "Keep body in straight line from head to heels",
      "Hold position while breathing normally",
      "Engage core muscles throughout"
    ],
    tips: ["Don't let hips sag or pike up", "Keep neck in neutral position"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Isometric core strengthening exercise",
    tags: ["bodyweight", "isometric", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Crunches",
    category: "strength",
    muscleGroups: ["core"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Lie on back with knees bent, feet flat",
      "Place hands behind head lightly",
      "Lift shoulders off ground using abs",
      "Lower with control"
    ],
    tips: ["Don't pull on neck", "Focus on ab contraction"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Traditional abdominal strengthening exercise",
    tags: ["bodyweight", "abs", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // CARDIO EXERCISES
  {
    name: "Jumping Jacks",
    category: "cardio",
    muscleGroups: ["full-body"],
    equipment: ["none"],
    difficulty: "beginner",
    instructions: [
      "Start standing with feet together, arms at sides",
      "Jump feet apart while raising arms overhead",
      "Jump back to starting position",
      "Maintain steady rhythm"
    ],
    tips: ["Land softly on balls of feet", "Keep core engaged"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Classic cardio exercise for full body activation",
    tags: ["cardio", "bodyweight", "full-body"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Burpees",
    category: "cardio",
    muscleGroups: ["full-body"],
    equipment: ["none"],
    difficulty: "advanced",
    instructions: [
      "Start standing, then squat down and place hands on floor",
      "Jump feet back into plank position",
      "Do a push-up, then jump feet back to squat",
      "Explode up with arms overhead"
    ],
    tips: ["Maintain form even when tired", "Modify by stepping instead of jumping"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "High-intensity full body exercise",
    tags: ["cardio", "full-body", "high-intensity"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },

  // FUNCTIONAL EXERCISES
  {
    name: "Mountain Climbers",
    category: "functional",
    muscleGroups: ["core", "shoulders"],
    equipment: ["none"],
    difficulty: "intermediate",
    instructions: [
      "Start in plank position",
      "Bring one knee toward chest",
      "Quickly switch legs in running motion",
      "Keep hips level and core engaged"
    ],
    tips: ["Don't let hips bounce up and down", "Maintain plank position"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Dynamic core and cardio exercise",
    tags: ["functional", "cardio", "core"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  },
  {
    name: "Bear Crawl",
    category: "functional",
    muscleGroups: ["full-body"],
    equipment: ["none"],
    difficulty: "intermediate",
    instructions: [
      "Start on hands and knees with knees slightly off ground",
      "Crawl forward by moving opposite hand and foot",
      "Keep core tight and back flat",
      "Move in controlled manner"
    ],
    tips: ["Don't let knees touch ground", "Keep movements small and controlled"],
    
    
    
    isApproved: true,
    createdBy: "system",
    description: "Full body functional movement pattern",
    tags: ["functional", "full-body", "crawling"],
    images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]
  }
];

export async function seedExerciseDatabase(): Promise<void> {
  console.log("Seeding exercise database with comprehensive exercises...");
  
  try {
    // Check if exercises already exist
    const existingExercises = await storage.getAllExercises();
    if (existingExercises.length > 0) {
      console.log(`Database already has ${existingExercises.length} exercises, skipping seed.`);
      return;
    }

    for (const exercise of COMPREHENSIVE_EXERCISES) {
      const exerciseData = {
        ...exercise,
        videoUrl: null,
        safetyNotes: [],
        videos: [],
        variations: [],
        isUserCreated: false,
        metadata: {
          muscleActivation: exercise.muscleGroups,
          caloriesBurnedPerMinute: 8, // Average estimate
          recommendedFor: [exercise.difficulty],
          aiGenerated: false,
          verified: true
        }
      };
      
      await storage.createExercise(exerciseData as any);
      console.log(`✓ Added: ${exercise.name}`);
    }
    
    console.log(`Successfully seeded ${COMPREHENSIVE_EXERCISES.length} exercises to the database!`);
  } catch (error) {
    console.error("Error seeding exercises:", error);
    console.log("Falling back to showing mock exercises in the UI...");
  }
}