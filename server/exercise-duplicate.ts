import type { Exercise } from "../shared/schema.ts";
import { storage } from "./storage.ts";

// Utility to normalize exercise names (lowercase, remove punctuation, collapse spaces)
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  const stop = new Set([
    "barbell","dumbbell","with","and","the","machine","cable","bodyweight","on","off","standing","seated","one","two","arm","leg","holding"
  ]);
  return normalizeName(name)
    .split(" ")
    .filter(t => t && !stop.has(t));
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

export async function findPotentialDuplicates(input: {
  name: string;
  muscleGroups?: string[];
  equipment?: string[];
}): Promise<{ exercise: Exercise; score: number; reasons: string[] }[]> {
  const all = await storage.getAllExercises();
  const normInput = normalizeName(input.name);
  const tokensInput = tokenize(input.name);

  const results: { exercise: Exercise; score: number; reasons: string[] }[] = [];
  for (const ex of all) {
    const normExisting = normalizeName(ex.name);
    const tokensExisting = tokenize(ex.name);
    const reasons: string[] = [];

    const exact = normExisting === normInput;
    const jac = jaccard(tokensInput, tokensExisting);
    const levDist = levenshtein(normInput, normExisting);
    const maxLen = Math.max(normInput.length, normExisting.length);
    const levRatio = maxLen ? 1 - levDist / maxLen : 0;

    let score = 0;
    if (exact) {
      score += 1.0;
      reasons.push("exact normalized name match");
    }
    if (jac >= 0.6) {
      score += jac * 0.6;
      reasons.push(`jaccard ${jac.toFixed(2)}`);
    }
    if (levRatio >= 0.7) {
      score += levRatio * 0.4;
      reasons.push(`levenshtein similarity ${levRatio.toFixed(2)}`);
    }
    // Muscle group overlap bonus
    if (input.muscleGroups && input.muscleGroups.length) {
      const overlap = input.muscleGroups.filter(m => ex.muscleGroups.includes(m as any)).length;
      if (overlap) {
        const muscleScore = overlap / input.muscleGroups.length;
        score += muscleScore * 0.25;
        reasons.push(`muscle overlap ${(muscleScore).toFixed(2)}`);
      }
    }
    // Equipment overlap bonus
    if (input.equipment && input.equipment.length) {
      const equipOverlap = input.equipment.filter(e => ex.equipment.includes(e)).length;
      if (equipOverlap) {
        const equipScore = equipOverlap / input.equipment.length;
        score += equipScore * 0.15;
        reasons.push(`equipment overlap ${(equipScore).toFixed(2)}`);
      }
    }

    if (score >= 0.65) {
      results.push({ exercise: ex, score, reasons });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
