import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Weight, Target, Crown, Sparkles, Lock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { calculateOneRepMax } from '@/lib/oneRepMax';
import { format } from 'date-fns';

// Safe date formatter that won't crash on invalid dates
const safeFormatDate = (dateStr: string, formatStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown date';
    return format(date, formatStr);
  } catch {
    return 'Unknown date';
  }
};

interface ExerciseStatsPremiumProps {
  exerciseName: string;
  userId: string;
  onLoadWeight?: (suggestedWeight: number) => void;
  isPremium?: boolean;
  showHistory?: boolean; // Free users can see history but not 1RM
}

// Define types outside component
type BestSetType = { weight: number; reps: number; date: string };
type StatsType = {
  bestSet: BestSetType | null;
  estimated1RM: number | null;
  totalSets: number;
  suggestedWeight: number | null;
};

export function ExerciseStatsPremium({ 
  exerciseName, 
  userId, 
  onLoadWeight,
  isPremium,
  showHistory = true
}: ExerciseStatsPremiumProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any returns
  const { data: historyData, isLoading, error, isFetching } = useQuery({
    queryKey: ['exercise-history', userId, exerciseName],
    queryFn: () => api.getExerciseHistory(userId, exerciseName, 5),
    enabled: !!userId && !!exerciseName && showHistory,
    staleTime: 30000,
    retry: 2,
  });

  const history = historyData?.history || [];
  const totalWorkouts = historyData?.totalWorkouts || 0;

  // Calculate stats from history - useMemo MUST be called every render
  const stats = useMemo((): StatsType => {
    let bestSet: BestSetType | null = null;
    let estimated1RM: number | null = null;
    let totalSets = 0;

    if (history.length > 0) {
      history.forEach(workout => {
        workout.sets.forEach(set => {
          totalSets++;
          if (set.weight != null && set.weight > 0) {
            const currentBest = bestSet;
            if (!currentBest || set.weight > currentBest.weight || (set.weight === currentBest.weight && set.reps > currentBest.reps)) {
              bestSet = {
                weight: set.weight,
                reps: set.reps,
                date: workout.date
              };
            }
          }
        });
      });

      if (isPremium && bestSet !== null) {
        const bs: BestSetType = bestSet;
        if (bs.weight > 0 && bs.reps > 0) {
          const oneRepMaxResult = calculateOneRepMax(bs.weight, bs.reps);
          estimated1RM = oneRepMaxResult.estimatedMax;
        }
      }
    }

    let suggestedWeight: number | null = null;
    if (isPremium && bestSet !== null) {
      const bs: BestSetType = bestSet;
      if (bs.weight > 0) {
        suggestedWeight = Math.round(bs.weight * 0.9);
      }
    }

    return { bestSet, estimated1RM, totalSets, suggestedWeight };
  }, [history, isPremium]);

  const { bestSet, estimated1RM, totalSets, suggestedWeight } = stats;

  // NOW we can do early returns - after all hooks have been called
  if (isLoading || (!historyData && isFetching)) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 text-zinc-600 dark:text-zinc-300">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent" />
            <span>Loading history for {exerciseName}...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-zinc-800">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 font-medium mb-2">
              Failed to load exercise history
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free version - just shows basic history
  const freeContent = (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
            <Calendar className="h-4 w-4 text-red-500" />
            Exercise History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <Calendar className="h-3 w-3" />
              Workouts
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{totalWorkouts}</div>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <Target className="h-3 w-3" />
              Total Sets
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">{totalSets}</div>
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Recent Sessions</div>
            <div className="space-y-1">
              {history.slice(0, 3).map((workout, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {safeFormatDate(workout.date, 'MMM d')}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-medium">
                    {workout.sets.length} sets
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="text-center py-6 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Target className="h-8 w-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">No workout history yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Complete a workout with this exercise to track your progress!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Premium version - full stats with 1RM and auto-load
  const premiumContent = (
    <Card className="border-2 border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-zinc-50 dark:from-red-950/20 dark:to-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-red-500" />
            Exercise Stats
          </CardTitle>
          <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-none">
            <Crown className="h-3 w-3 mr-1" />
            PREMIUM
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-3 border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <Calendar className="h-3 w-3" />
              Workouts
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{totalWorkouts}</div>
          </div>
          
          <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-3 border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <Target className="h-3 w-3" />
              Total Sets
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">{totalSets}</div>
          </div>
        </div>

        {/* Best Performance */}
        {bestSet && (
          <div className="bg-white/60 dark:bg-zinc-800/60 rounded-lg p-3 border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-2">
              <TrendingUp className="h-3 w-3 text-red-500" />
              Best Performance
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{bestSet.weight}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">lbs × {bestSet.reps} reps</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {safeFormatDate(bestSet.date, 'MMM d, yyyy')}
            </div>
          </div>
        )}

        {/* Estimated 1RM - PREMIUM FEATURE */}
        {estimated1RM != null && bestSet && (
          <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 mb-2">
              <Weight className="h-3 w-3" />
              Projected 1RM
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Math.round(estimated1RM)} lbs
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Based on best set ({bestSet.weight} × {bestSet.reps})
            </div>
          </div>
        )}

        {/* Suggested Weight with Auto-Load - PREMIUM FEATURE */}
        {suggestedWeight != null && onLoadWeight && (
          <Button 
            onClick={() => onLoadWeight(suggestedWeight)}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30"
            size="sm"
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Auto-Load {suggestedWeight} lbs (Recommended)
          </Button>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-red-200 dark:border-red-900">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Recent Sessions</div>
            <div className="space-y-1">
              {history.slice(0, 3).map((workout, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {safeFormatDate(workout.date, 'MMM d')}
                  </span>
                  <span className="text-zinc-900 dark:text-white font-medium">
                    {workout.sets.length} sets
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && (
          <div className="text-center py-6 px-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg border border-red-200 dark:border-red-900">
            <Sparkles className="h-8 w-8 text-red-400 dark:text-red-500 mx-auto mb-3" />
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">No workout history yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Complete a workout with this exercise to unlock:
            </p>
            <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
              <li>✨ Best performance tracking</li>
              <li>💪 Projected 1RM calculation</li>
              <li>🎯 Auto-load recommended weights</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Show premium content if user is premium, otherwise show free version
  return isPremium ? premiumContent : freeContent;
}
