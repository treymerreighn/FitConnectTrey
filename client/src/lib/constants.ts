export const CURRENT_USER_ID = "44595091"; // Current authenticated user

export const POST_TYPES = {
  WORKOUT: "workout",
  NUTRITION: "nutrition",
  PROGRESS: "progress",
} as const;

export const WORKOUT_TYPES = [
  "Upper Body Strength",
  "Lower Body Strength",
  "Full Body Strength",
  "HIIT Cardio",
  "Steady State Cardio",
  "Yoga",
  "Pilates",
  "Functional Training",
  "Powerlifting",
  "Bodybuilding",
] as const;

export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-Workout",
  "Post-Workout",
  "Meal Prep",
] as const;

export const PROGRESS_TYPES = [
  "Weight Loss",
  "Weight Gain",
  "Muscle Building",
  "Body Recomposition",
  "Strength Progress",
  "Endurance Progress",
  "Flexibility Progress",
] as const;
