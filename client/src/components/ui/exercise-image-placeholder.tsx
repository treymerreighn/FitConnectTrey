import { OptimizedImage } from "@/components/OptimizedImage";

interface ExerciseImagePlaceholderProps {
  exercise: {
    category?: string;
    name: string;
    images?: string[];
    muscleGroups?: string[];
  };
  className?: string;
  width?: number;
  height?: number;
}

export function ExerciseImagePlaceholder({ 
  exercise, 
  className = "",
  width = 300,
  height = 200
}: ExerciseImagePlaceholderProps) {
  
  // Always show KRATOS branding instead of generic images
  return (
    <div 
      className={`relative flex items-center justify-center bg-black text-white ${className}`}
      style={{ width: '100%', height }}
      data-testid="exercise-image-placeholder"
    >
      {/* KRATOS Label */}
      <span className="text-4xl font-extrabold tracking-[0.3em] text-gray-300">
        KRATOS
      </span>
    </div>
  );
}