import React, { useMemo } from 'react';
import { Dumbbell, Flame, StretchHorizontal, Sparkles } from 'lucide-react';

interface ExerciseThumbProps {
  exercise: {
    name: string;
    category?: string;
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: string;
  };
  size?: number; // px
  rounded?: boolean;
  className?: string;
}

// Palette of gradient backgrounds (two-color blends)
const GRADIENTS: string[] = [
  'linear-gradient(135deg,#1e3a8a,#9333ea)',
  'linear-gradient(135deg,#064e3b,#10b981)',
  'linear-gradient(135deg,#7c2d12,#ea580c)',
  'linear-gradient(135deg,#581c87,#db2777)',
  'linear-gradient(135deg,#0f766e,#14b8a6)',
  'linear-gradient(135deg,#1e293b,#475569)',
  'linear-gradient(135deg,#3b0764,#6d28d9)',
  'linear-gradient(135deg,#14532d,#4ade80)',
  'linear-gradient(135deg,#3f0d11,#be123c)',
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

function pickGradient(exercise: ExerciseThumbProps['exercise']): string {
  const key = (exercise.muscleGroups || []).join('|') || exercise.category || exercise.name;
  const idx = hashString(key.toLowerCase()) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function pickIcon(category?: string) {
  switch ((category || '').toLowerCase()) {
    case 'strength': return Dumbbell;
    case 'cardio': return Flame;
    case 'flexibility': return StretchHorizontal;
    default: return Sparkles;
  }
}

export const ExerciseThumb: React.FC<ExerciseThumbProps> = ({ exercise, size = 48, rounded = true, className = '' }) => {
  const gradient = useMemo(() => pickGradient(exercise), [exercise]);
  const Icon = useMemo(() => pickIcon(exercise.category), [exercise.category]);
  const initials = useMemo(() => {
    const parts = exercise.name.split(/\s+/).filter(Boolean);
    return parts.slice(0,2).map(p => p[0]).join('').toUpperCase();
  }, [exercise.name]);

  return (
    <div
      className={`relative flex items-center justify-center text-white font-semibold select-none ${rounded ? 'rounded-lg' : ''} shadow-sm overflow-hidden ${className}`}
      style={{ width: size, height: size, backgroundImage: gradient }}
      aria-label={exercise.name}
    >
      <div className="absolute inset-0 opacity-40 mix-blend-overlay" />
      <div className="flex flex-col items-center justify-center z-10">
        <span className="text-xs leading-none tracking-wide drop-shadow-sm">{initials}</span>
        <Icon className="mt-1 h-3 w-3 opacity-80" />
      </div>
      {exercise.difficulty && (
        <span className="absolute bottom-0 right-0 m-[2px] px-1 py-[1px] rounded-md text-[9px] bg-black/40 backdrop-blur-sm">
          {exercise.difficulty[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default ExerciseThumb;