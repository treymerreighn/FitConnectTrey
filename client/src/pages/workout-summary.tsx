import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trophy,
  Dumbbell,
  Clock,
  Flame,
  TrendingUp,
  Target,
  Crown,
  Lock,
  Sparkles,
  Share2,
  X,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Camera,
  MessageCircle,
  Zap,
} from 'lucide-react';

const CURRENT_USER_ID = "44595091";

interface WorkoutExercise {
  name: string;
  sets: Array<{ reps: number; weight?: number }>;
}

interface WorkoutData {
  workoutType: string;
  duration: number;
  calories: number;
  exercises: WorkoutExercise[];
}

export default function WorkoutSummary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isPremium = user?.isPremium || 
                   user?.subscriptionTier === 'premium' || 
                   user?.subscriptionTier === 'pro' ||
                   localStorage.getItem('fitconnect-mock-premium') === 'true';

  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [storyPosted, setStoryPosted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    const postIdParam = params.get('postId');
    const storyPostedParam = params.get('storyPosted');
    
    if (dataParam) {
      try {
        setWorkoutData(JSON.parse(decodeURIComponent(dataParam)));
      } catch (e) {
        console.error('Failed to parse workout data:', e);
      }
    }
    if (postIdParam) {
      setPostId(postIdParam);
    }
    if (storyPostedParam === 'true') {
      setStoryPosted(true);
    }
  }, []);

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!workoutData) throw new Error('No workout data');
      return api.generateStrengthInsights({
        userId: CURRENT_USER_ID,
        postId: postId || undefined,
        workoutData: {
          exercises: workoutData.exercises,
          duration: workoutData.duration,
          workoutType: workoutData.workoutType,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strength-insight', postId] });
      toast({
        title: '💪 Insights Generated!',
        description: 'Your workout has been analyzed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not generate insights.',
        variant: 'destructive',
      });
    },
  });

  const { data: existingInsight, isLoading: insightLoading } = useQuery({
    queryKey: ['strength-insight', postId],
    queryFn: () => api.getStrengthInsightByPost(postId!),
    enabled: !!postId && isPremium,
    retry: false,
  });

  const insight = existingInsight || generateInsightsMutation.data;
  const insights = insight?.insights;

  const handleContinueToPost = () => {
    const postData = {
      workoutType: workoutData?.workoutType,
      duration: workoutData?.duration,
      calories: workoutData?.calories,
      exercises: workoutData?.exercises?.map(ex => ({
        name: ex.name,
        exerciseName: ex.name,
        sets: ex.sets,
      })),
    };
    // Store in sessionStorage for reliable data passing
    sessionStorage.setItem('pendingWorkoutPost', JSON.stringify(postData));
    // Use simple URL without long encoded data
    setLocation('/create-post?type=workout&fromSummary=true');
  };

  const handleShareToStory = () => {
    const encoded = encodeURIComponent(JSON.stringify({
      workoutType: workoutData?.workoutType,
      duration: workoutData?.duration,
      calories: workoutData?.calories,
      exercises: workoutData?.exercises?.map(ex => ({
        name: ex.name,
        sets: ex.sets,
      })),
    }));
    setLocation(`/create-story?workoutData=${encoded}`);
  };

  const handleSendMessage = () => {
    const workoutText = `Just finished ${workoutData?.workoutType}! 💪\n${workoutData?.duration} mins • ${workoutData?.calories} cal\n${workoutData?.exercises?.length} exercises`;
    const encoded = encodeURIComponent(workoutText);
    setLocation(`/messages?shareWorkout=${encoded}`);
  };

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 text-center">
            <Dumbbell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Workout Data</h2>
            <p className="text-zinc-500 mb-4">
              Complete a workout to see your summary.
            </p>
            <Button onClick={() => setLocation('/build')} className="bg-red-600 hover:bg-red-700">
              Start a Workout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSets = workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalReps = workoutData.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps, 0),
    0
  );
  const totalVolume = workoutData.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.weight || 0) * set.reps, 0),
    0
  );
  const heaviestLift = Math.max(
    ...workoutData.exercises.flatMap(ex => ex.sets.map(s => s.weight || 0))
  );

  return (
    <div className="min-h-screen bg-black pb-52">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => setLocation('/')}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative pt-12 pb-8 px-6 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-lg shadow-amber-500/30">
            <Trophy className="h-10 w-10 text-black" />
          </div>
          
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
            WORKOUT COMPLETE
          </h1>
          <p className="text-zinc-400 text-lg">{workoutData.workoutType}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Clock className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{workoutData.duration}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Min</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{workoutData.calories}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Cal</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Target className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">{totalSets}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Sets</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Dumbbell className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-white">
              {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : totalReps}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {totalVolume > 0 ? 'Lbs' : 'Reps'}
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-semibold text-white uppercase tracking-wider">
            Exercises Completed
          </span>
        </div>
        <div className="space-y-2">
          {workoutData.exercises.map((exercise, idx) => {
            const exVolume = exercise.sets.reduce((s, set) => s + (set.weight || 0) * set.reps, 0);
            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
            
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-500">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{exercise.name}</div>
                    <div className="text-xs text-zinc-500">
                      {exercise.sets.length} sets • {maxWeight > 0 ? `${maxWeight} lbs` : `${exercise.sets.reduce((s, set) => s + set.reps, 0)} reps`}
                    </div>
                  </div>
                </div>
                {exVolume > 0 && (
                  <Badge className="bg-zinc-800 text-zinc-300 border-none text-xs">
                    {exVolume.toLocaleString()} lbs
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-white uppercase tracking-wider">
                AI Insights
              </span>
            </div>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-black border-none text-[10px] font-bold">
                <Crown className="h-3 w-3 mr-1" />
                PREMIUM
              </Badge>
            )}
          </div>
          
          <div className="p-4">
            {isPremium ? (
              <div className="space-y-4">
                {insightLoading || generateInsightsMutation.isPending ? (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <RefreshCw className="h-5 w-5 animate-spin text-red-500" />
                    <span className="text-zinc-400">Analyzing your workout...</span>
                  </div>
                ) : insights ? (
                  <>
                    <div className="p-3 rounded-lg bg-gradient-to-r from-red-950/50 to-orange-950/50 border border-red-900/50">
                      <p className="text-sm text-zinc-200">{insights.summary}</p>
                    </div>

                    {insights.volumeAnalysis && (
                      <div className="p-3 rounded-lg bg-zinc-800/50">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="uppercase tracking-wider">Volume Analysis</span>
                        </div>
                        <p className="text-sm text-zinc-300">{insights.volumeAnalysis}</p>
                      </div>
                    )}

                    {insights.muscleGroupFocus?.length > 0 && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Muscles Worked</div>
                        <div className="flex flex-wrap gap-2">
                          {insights.muscleGroupFocus.map((muscle: string, idx: number) => (
                            <Badge key={idx} className="bg-red-950/50 text-red-400 border border-red-900/50">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {insights.recommendations?.length > 0 && (
                      <div>
                        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Recommendations</div>
                        <div className="space-y-2">
                          {insights.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-zinc-300">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-zinc-500 text-sm mb-3">Get personalized feedback on your workout</p>
                    <Button
                      onClick={() => generateInsightsMutation.mutate()}
                      disabled={generateInsightsMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Insights
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="blur-sm pointer-events-none opacity-50">
                  <div className="p-3 rounded-lg bg-zinc-800/50 mb-3">
                    <p className="text-sm text-zinc-400">
                      Great workout! You showed strong performance on compound movements. 
                      Your volume was well-distributed across muscle groups.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-zinc-800 text-zinc-500">Chest</Badge>
                    <Badge className="bg-zinc-800 text-zinc-500">Triceps</Badge>
                    <Badge className="bg-zinc-800 text-zinc-500">Shoulders</Badge>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-zinc-900/95 via-zinc-900/80 to-transparent">
                  <div className="text-center px-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-full mb-3 border border-zinc-700">
                      <Lock className="h-5 w-5 text-zinc-500" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">Premium Feature</h3>
                    <p className="text-xs text-zinc-500 mb-3 max-w-[200px] mx-auto">
                      Unlock AI insights, trends & recommendations
                    </p>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold hover:from-amber-400 hover:to-orange-500"
                      onClick={() => setLocation('/settings')}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Highlight */}
      {heaviestLift > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-amber-950/30 to-orange-950/30 border border-amber-900/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-amber-500/80 uppercase tracking-wider font-medium">Session Highlight</div>
                <div className="text-xl font-bold text-white">
                  Heaviest Lift: {heaviestLift} lbs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-4 pb-6">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Story Posted Indicator */}
          {storyPosted && (
            <div className="flex items-center justify-center gap-2 text-green-500 text-sm mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Story posted!</span>
            </div>
          )}
          
          {/* Primary action - Continue to Post */}
          <Button
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
            onClick={handleContinueToPost}
          >
            {storyPosted ? 'Also Post to Feed' : 'Continue to Post'}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
          
          {/* Secondary actions row */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              onClick={() => setLocation('/')}
            >
              {storyPosted ? 'Finish' : 'Skip'}
            </Button>
            
            {!storyPosted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem
                    onClick={handleShareToStory}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add to Story
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSendMessage}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send as Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
