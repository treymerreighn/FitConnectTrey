import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Zap,
  Target,
  Trophy,
  Dumbbell,
  Heart,
  Sparkles,
  Crown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Flame
} from 'lucide-react';

interface StrengthInsightsProps {
  userId: string;
  workoutData?: {
    exercises: Array<{
      name: string;
      sets: Array<{ reps: number; weight?: number }>;
    }>;
    duration?: number;
    workoutType?: string;
  };
  postId?: string;
  isPremium?: boolean;
  onInsightGenerated?: (insight: any) => void;
  showGenerateButton?: boolean;
}

export function StrengthInsights({
  userId,
  workoutData,
  postId,
  isPremium = false,
  onInsightGenerated,
  showGenerateButton = true,
}: StrengthInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing insight if postId provided
  const { data: existingInsight, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['strength-insight', postId],
    queryFn: () => api.getStrengthInsightByPost(postId!),
    enabled: !!postId && isPremium,
    retry: false,
  });

  // Generate new insight
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!workoutData) throw new Error('No workout data provided');
      return api.generateStrengthInsights({
        userId,
        postId,
        workoutData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: '💪 Insights Generated!',
        description: 'Your workout has been analyzed.',
      });
      queryClient.invalidateQueries({ queryKey: ['strength-insight', postId] });
      queryClient.invalidateQueries({ queryKey: ['strength-insights', userId] });
      onInsightGenerated?.(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not generate insights. Try again later.',
        variant: 'destructive',
      });
    },
  });

  const insight = existingInsight || generateMutation.data;
  const insights = insight?.insights;

  // Non-premium placeholder
  if (!isPremium) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">AI Strength Insights</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Premium Feature</p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
            Get AI-powered analysis of your workouts including strength trends, 
            personal records, recovery tips, and personalized recommendations.
          </p>
          <Button variant="outline" className="w-full" disabled>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoadingExisting || generateMutation.isPending) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-red-500" />
            <span className="text-zinc-600 dark:text-zinc-300">
              Analyzing your workout...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No insight yet - show generate button
  if (!insights && showGenerateButton && workoutData) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
              Get AI Workout Insights
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Analyze your workout with AI to get personalized feedback, 
              track progress, and optimize recovery.
            </p>
            <Button 
              onClick={() => generateMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No insights available
  if (!insights) {
    return null;
  }

  // Render the insights
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <Sparkles className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-zinc-900 dark:text-white">AI Workout Analysis</span>
            <Badge variant="outline" className="ml-2 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
              Premium
            </Badge>
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Summary */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
            <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">
              {insights.summary}
            </p>
          </div>

          {/* Volume Analysis */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Flame className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                Volume Analysis
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {insights.volumeAnalysis}
              </p>
            </div>
          </div>

          {/* Muscle Groups */}
          {insights.muscleGroupFocus?.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Dumbbell className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Muscle Groups Targeted
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {insights.muscleGroupFocus.map((muscle: string, idx: number) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strength Trends */}
          {insights.strengthTrends?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Strength Trends
              </h4>
              <div className="space-y-2">
                {insights.strengthTrends.map((trend: any, idx: number) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                      {trend.exercise}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {trend.note}
                      </span>
                      {trend.trend === 'increasing' && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      {trend.trend === 'decreasing' && (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      {trend.trend === 'maintaining' && (
                        <Minus className="h-4 w-4 text-zinc-400" />
                      )}
                      {trend.trend === 'new' && (
                        <Zap className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          {insights.personalRecords?.length > 0 && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Personal Records! 🎉
              </h4>
              <div className="space-y-2">
                {insights.personalRecords.map((pr: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {pr.exercise}:
                    </span>{' '}
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {pr.achievement}
                    </span>
                    {pr.previousBest && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                        (was: {pr.previousBest})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-2" />

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Recommendations
              </h4>
              <ul className="space-y-1.5">
                {insights.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recovery Tips */}
          {insights.recoveryTips?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Recovery Tips
              </h4>
              <ul className="space-y-1.5">
                {insights.recoveryTips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Workout Suggestion */}
          {insights.nextWorkoutSuggestion && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Next Workout
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {insights.nextWorkoutSuggestion}
              </p>
            </div>
          )}

          {/* Motivational Message */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-center font-medium text-zinc-700 dark:text-zinc-300 italic">
              "{insights.motivationalMessage}"
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Compact version for showing in feed/post cards
 */
export function StrengthInsightsSummary({ 
  insight 
}: { 
  insight: { insights: { summary: string; muscleGroupFocus: string[]; personalRecords: any[] } } 
}) {
  const { insights } = insight;
  
  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/10">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-red-500" />
        <span className="text-xs font-medium text-red-600 dark:text-red-400">AI Analysis</span>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{insights.summary}</p>
      
      {insights.personalRecords?.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {insights.personalRecords.length} PR{insights.personalRecords.length > 1 ? 's' : ''} achieved!
          </span>
        </div>
      )}
    </div>
  );
}
