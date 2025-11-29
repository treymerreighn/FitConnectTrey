import React from 'react';

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

export const ExerciseThumb: React.FC<ExerciseThumbProps> = ({ exercise, size = 48, rounded = true, className = '' }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-black text-white font-bold select-none ${rounded ? 'rounded-lg' : ''} shadow-md overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-label={exercise.name}
    >
      <span className="text-xs tracking-[0.2em] font-extrabold text-gray-300">KRATOS</span>
      {exercise.difficulty && (
        <span className="absolute bottom-0 right-0 m-[2px] px-1 py-[1px] rounded-md text-[9px] bg-gray-800/80 backdrop-blur-sm">
          {exercise.difficulty[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default ExerciseThumb;