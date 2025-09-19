import { Dumbbell, Heart, Zap, Trophy, Target } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";

interface ExerciseImagePlaceholderProps {
  exercise: {
    category: string;
    name: string;
    images?: string[];
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
  
  // If exercise has images, use the first one
  if (exercise.images && exercise.images.length > 0) {
    return (
      <OptimizedImage
        src={exercise.images[0]}
        alt={`${exercise.name} demonstration`}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  // Category-based icon and color mapping
  const getCategoryConfig = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return {
          icon: Dumbbell,
          gradient: 'from-blue-500 to-purple-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          iconColor: 'text-white'
        };
      case 'cardio':
        return {
          icon: Heart,
          gradient: 'from-red-500 to-pink-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          iconColor: 'text-white'
        };
      case 'flexibility':
        return {
          icon: Zap,
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          iconColor: 'text-white'
        };
      case 'sports':
        return {
          icon: Trophy,
          gradient: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          iconColor: 'text-white'
        };
      case 'functional':
        return {
          icon: Target,
          gradient: 'from-purple-500 to-indigo-500',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          iconColor: 'text-white'
        };
      default:
        return {
          icon: Dumbbell,
          gradient: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          iconColor: 'text-white'
        };
    }
  };

  const config = getCategoryConfig(exercise.category);
  const IconComponent = config.icon;

  return (
    <div 
      className={`relative flex items-center justify-center ${config.bgColor} ${className}`}
      style={{ width, height }}
      data-testid="exercise-image-placeholder"
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-90 rounded-lg`} />
      
      {/* Icon and label */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
        <IconComponent className={`h-12 w-12 ${config.iconColor} mb-2`} />
        <span className={`text-sm font-medium ${config.iconColor} capitalize`}>
          {exercise.category}
        </span>
        <span className={`text-xs ${config.iconColor} opacity-75 mt-1`}>
          Exercise
        </span>
      </div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] rounded-lg" />
    </div>
  );
}