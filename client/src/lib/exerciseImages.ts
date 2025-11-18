// Utility to derive a visually distinct thumbnail for an exercise
// based on muscle groups, category, or equipment. Uses royalty-free
// Unsplash query URLs so images differ across categories.

export type ExerciseLike = {
  name?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  thumbnailUrl?: string;
};

const byMuscle: Record<string, string> = {
  chest: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop",
  back: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop",
  lats: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop",
  shoulders: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800&auto=format&fit=crop",
  delts: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800&auto=format&fit=crop",
  arms: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  biceps: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  triceps: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  forearms: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  legs: "https://images.unsplash.com/photo-1534367610401-9f566a738185?w=800&auto=format&fit=crop",
  quadriceps: "https://images.unsplash.com/photo-1534367610401-9f566a738185?w=800&auto=format&fit=crop",
  hamstrings: "https://images.unsplash.com/photo-1534367610401-9f566a738185?w=800&auto=format&fit=crop",
  calves: "https://images.unsplash.com/photo-1534367610401-9f566a738185?w=800&auto=format&fit=crop",
  glutes: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800&auto=format&fit=crop",
  core: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
  abs: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
  obliques: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
  traps: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop",
  lower_back: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop",
};

const byCategory: Record<string, string> = {
  strength: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  cardio: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop",
  flexibility: "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&auto=format&fit=crop",
  sports: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&auto=format&fit=crop",
  functional: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
};

const byEquipment: Record<string, string> = {
  barbell: "https://images.unsplash.com/photo-1517964603305-60c00b2e3ee5?w=800&auto=format&fit=crop",
  dumbbell: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?w=800&auto=format&fit=crop",
  kettlebell: "https://images.unsplash.com/photo-1559479083-4bd6f6a8b3c5?w=800&auto=format&fit=crop",
  machine: "https://images.unsplash.com/photo-1594737625785-c6683fc9c44d?w=800&auto=format&fit=crop",
  cable: "https://images.unsplash.com/photo-1546484948-1159c2f4d723?w=800&auto=format&fit=crop",
  bodyweight: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
};

const fallback = "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop";

export function getExerciseImage(ex: ExerciseLike): string {
  if (ex.thumbnailUrl) return ex.thumbnailUrl;

  const groups = (ex.muscleGroups || []).map(g => g.toLowerCase());
  for (const g of groups) {
    if (byMuscle[g]) return byMuscle[g];
  }

  const cat = (ex.category || '').toLowerCase();
  if (byCategory[cat]) return byCategory[cat];

  const equip = (ex.equipment || []).map(e => e.toLowerCase());
  for (const e of equip) {
    if (byEquipment[e]) return byEquipment[e];
  }

  return fallback;
}
