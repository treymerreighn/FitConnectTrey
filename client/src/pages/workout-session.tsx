import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, PauseCircle, PlayCircle, Minus, Plus, PlusCircle, Search, TrendingUp, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Exercise } from '@shared/schema';
import { usePreferences } from '@/contexts/preferences-context';
import { ExerciseStatsPremium } from '@/components/exercise-stats-premium';
import { useAuth } from '@/hooks/useAuth';
import { CURRENT_USER_ID } from '@/lib/constants';

// Types for workout session based on unified schema
interface WorkoutSet { reps: number; weight?: number; rest?: number; completed?: boolean; startedAt?: number; completedAt?: number; }
interface WorkoutExercise { id: string; name: string; sets: WorkoutSet[]; notes?: string; difficulty?: string; muscleGroup?: string; equipment?: string; isTemplate?: boolean; }
interface ActiveWorkoutPlan { id?: string; name?: string; exercises: WorkoutExercise[]; startedAt: number; }

// Format seconds as mm:ss
const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${s.toString().padStart(2, '0')}`; };

// Parse encoded workout plan from query string
const extractSearch = (input: string): string => {
  if (typeof window !== 'undefined' && window.location?.search) {
    return window.location.search;
  }
  const queryIndex = input.indexOf('?');
  return queryIndex >= 0 ? input.substring(queryIndex) : '';
};

const getNumberOr = (value: any, fallback: number): number => {
  return Number.isFinite(value) ? Number(value) : fallback;
};

const normalizeWorkoutSet = (set: any): WorkoutSet => {
  const reps = getNumberOr(set?.reps, getNumberOr(set?.targetReps, 0));
  const weight = Number.isFinite(set?.weight)
    ? Number(set.weight)
    : Number.isFinite(set?.targetWeight)
      ? Number(set.targetWeight)
      : undefined;
  const rest = getNumberOr(set?.rest, getNumberOr(set?.restTime, 60));
  return {
    reps,
    weight,
    rest,
    completed: false,
  };
};

const parsePlanFromSearch = (search: string): ActiveWorkoutPlan | null => {
  const params = new URLSearchParams(search);
  const raw = params.get('plan');
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const data = JSON.parse(decoded);
    if (data && Array.isArray(data.exercises)) {
      return {
        id: data.id,
        name: data.name || 'Workout Session',
        exercises: data.exercises.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          notes: ex.notes,
          difficulty: ex.difficulty,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          isTemplate: ex.isTemplate,
          sets: (ex.sets || []).map(normalizeWorkoutSet)
        })),
        startedAt: Date.now()
      }
    }
  } catch (e) {
    console.error('Failed to parse workout plan', e);
  }
  return null;
};

const WorkoutSession: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { weightUnit } = usePreferences();
  const { user } = useAuth();
  const initialSearch = extractSearch(location);
  const initialPlan = useMemo(() => parsePlanFromSearch(initialSearch), [initialSearch]);
  const [plan, setPlan] = useState<ActiveWorkoutPlan | null>(initialPlan);
  const planSourceRef = useRef<string | null>(initialPlan ? initialSearch : null);
  const [activeRest, setActiveRest] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState<number>(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [ticker, setTicker] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [pauseAccumulated, setPauseAccumulated] = useState(0);
  const [selectedExerciseForStats, setSelectedExerciseForStats] = useState<string | null>(null);

  // Check if user has premium access
  const isPremium = user?.isPremium || 
                   user?.subscriptionTier === 'premium' || 
                   user?.subscriptionTier === 'pro' ||
                   localStorage.getItem('fitconnect-mock-premium') === 'true';
  
  const userId = user?.id || CURRENT_USER_ID;

  // Fetch exercises for adding to workout
  const { data: allExercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    enabled: showAddExerciseDialog,
  });

  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (plan) {
      setPauseAccumulated(0);
      setPauseStartedAt(null);
      setIsPaused(false);
    }
  }, [plan?.id]);

  useEffect(() => {
    const search = extractSearch(location);
    if (!search || planSourceRef.current === search) return;
    const parsed = parsePlanFromSearch(search);
    if (parsed) {
      planSourceRef.current = search;
      setPlan(parsed);
    }
  }, [location]);

  // Tick down active rest timer
  useEffect(() => {
    if (isPaused) return;
    let interval: any;
    if (activeRest !== null && activeRest > 0) {
      interval = setInterval(() => {
        setActiveRest(prev => (prev !== null ? Math.max(prev - 1, 0) : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRest, isPaused]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!plan) return { completedSets: 0, totalSets: 0, volume: 0 };
    let completedSets = 0;
    let totalSets = 0;
    let volume = 0;
    plan.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        totalSets++;
        if (s.completed) completedSets++;
        if (s.weight && s.reps) volume += s.weight * s.reps;
      })
    });
    return { completedSets, totalSets, volume };
  }, [plan]);

  const workoutElapsed = useMemo(() => {
    if (!plan) return 0;
    const now = Date.now();
    const pausedSlice = isPaused && pauseStartedAt ? now - pauseStartedAt : 0;
    const elapsedMs = now - plan.startedAt - pauseAccumulated - pausedSlice;
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }, [plan, ticker, pauseAccumulated, isPaused, pauseStartedAt]);

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: keyof WorkoutSet, value: number) => {
    console.log('handleSetChange called:', { exerciseIdx, setIdx, field, value });
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      
      // If changing weight or reps on first set, apply to all sets
      if ((field === 'weight' || field === 'reps') && setIdx === 0) {
        console.log('Auto-filling first set to all sets');
        const sets = ex.sets.map(s => ({ ...s, [field]: value }));
        ex.sets = sets;
      } else {
        const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
        ex.sets = sets;
      }
      
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
  };

  // Auto-load weight for all sets in an exercise (premium feature)
  const autoLoadWeightForExercise = (exerciseIdx: number, weight: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      const sets = ex.sets.map(s => ({ ...s, weight }));
      ex.sets = sets;
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
    
    toast({
      title: "Weights Auto-Loaded! 💪",
      description: `Set ${weight} ${weightUnit} for all ${plan?.exercises[exerciseIdx].name} sets`,
    });
    
    setSelectedExerciseForStats(null); // Close the stats dialog
  };

  const startRest = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.round(seconds || 0));
    setRestTarget(safeSeconds);
    setActiveRest(safeSeconds);
  };

  const adjustRestTimer = (delta: number) => {
    setRestTarget(prev => Math.max(0, prev + delta));
    setActiveRest(prev => (prev !== null ? Math.max(0, prev + delta) : prev));
  };

  const togglePause = () => {
    if (isPaused) {
      setPauseAccumulated(prev => prev + (pauseStartedAt ? Date.now() - pauseStartedAt : 0));
      setPauseStartedAt(null);
      setIsPaused(false);
    } else {
      setPauseStartedAt(Date.now());
      setIsPaused(true);
    }
  };

  const buildSnapshot = () => {
    if (!plan) return null;
    return {
      workoutType: plan.name,
      duration: Math.max(1, Math.floor(workoutElapsed / 60)) || 1,
      calories: Math.round(stats.volume / 100) + 50,
      exercises: plan.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,  // Use 'name' to match the exercise history API
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight || 0 }))
      }))
    };
  };

  const goToPostScreen = () => {
    const snapshot = buildSnapshot();
    if (!snapshot) return;
    const encoded = encodeURIComponent(JSON.stringify(snapshot));
    setLocation(`/create-post?type=workout&workoutData=${encoded}`);
  };

  const completeSet = (exerciseIdx: number, setIdx: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, completed: true, completedAt: Date.now() } : s);
      ex.sets = sets;
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
    const restVal = plan?.exercises[exerciseIdx].sets[setIdx].rest || 60;
    startRest(restVal);
    if (plan) {
      const ex = plan.exercises[exerciseIdx];
      if (setIdx + 1 < ex.sets.length) {
        setCurrentSetIndex(setIdx + 1);
      } else if (exerciseIdx + 1 < plan.exercises.length) {
        setCurrentExerciseIndex(exerciseIdx + 1);
        setCurrentSetIndex(0);
      } else {
        setShowFinishDialog(true);
      }
    }
  };

  const undoSet = (exerciseIdx: number, setIdx: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, completed: false, completedAt: undefined } : s);
      ex.sets = sets;
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: exercise.id,
      name: exercise.name,
      difficulty: exercise.difficulty,
      muscleGroup: exercise.muscleGroups?.[0],
      equipment: exercise.equipment?.[0],
      sets: [
        { reps: 10, weight: 0, rest: 60, completed: false },
        { reps: 10, weight: 0, rest: 60, completed: false },
        { reps: 10, weight: 0, rest: 60, completed: false },
      ]
    };
    
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise]
      };
    });
    
    setShowAddExerciseDialog(false);
    setExerciseSearchQuery('');
    toast({
      title: 'Exercise added',
      description: `${exercise.name} has been added to your workout.`
    });
  };

  const filteredExercises = useMemo(() => {
    if (!exerciseSearchQuery.trim()) return allExercises;
    const query = exerciseSearchQuery.toLowerCase();
    return allExercises.filter(ex => 
      ex.name.toLowerCase().includes(query) ||
      ex.muscleGroups?.some(mg => mg.toLowerCase().includes(query)) ||
      ex.category?.toLowerCase().includes(query)
    );
  }, [allExercises, exerciseSearchQuery]);

  const finishWorkout = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      toast({ title: 'Workout saved', description: 'Session data persisted.' });
      setShowFinishDialog(false);
      goToPostScreen();
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', description: 'Unable to save workout right now.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const postWorkoutNow = () => {
    if (!plan) return;
    goToPostScreen();
  };

  if (!plan) {
    return (
      <div className="p-8 mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>No active workout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Start a workout from a template or the builder to see the logging interface.</p>
            <Button className="mt-4" onClick={() => setLocation('/workouts')}>Go to Workouts</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{plan.name || 'Workout Session'}</h1>
            <p className="text-xs text-muted-foreground">Logging your sets in real time</p>
            {isPaused && <span className="text-[11px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">Paused</span>}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-medium text-gray-900 dark:text-gray-100">Time</span>
              <Badge variant="secondary" className="text-xs font-mono">{formatTime(workoutElapsed)}</Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-gray-900 dark:text-gray-100">Sets</span>
              <Badge variant="outline" className="text-xs">{stats.completedSets}/{stats.totalSets}</Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium text-gray-900 dark:text-gray-100">Volume</span>
              <Badge variant="outline" className="text-xs">{stats.volume} {weightUnit}</Badge>
            </div>
              <Button variant={isPaused ? 'default' : 'outline'} size="sm" onClick={togglePause} className="flex items-center gap-1">
                {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFinishDialog(true)} disabled={stats.completedSets === 0}>Finish</Button>
          </div>
        </div>
      </div>
      {isPaused && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-y border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-center text-sm py-2">
          Workout paused — resume to continue timing and rest countdowns.
        </div>
      )}

      {/* Rest Timer Banner */}
      {activeRest !== null && (
        <div className="sticky top-[64px] z-10 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Rest</span>
              <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-mono">{formatTime(activeRest)}</Badge>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => adjustRestTimer(-5)} disabled={activeRest === null || activeRest <= 0}><Minus className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => adjustRestTimer(5)} disabled={activeRest === null}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setActiveRest(null)}>Skip</Button>
              <Button size="sm" variant="outline" onClick={() => setActiveRest(restTarget)}>Restart</Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {plan.exercises.map((exercise, exIdx) => {
            const isCurrent = exIdx === currentExerciseIndex;
            return (
              <Card key={exercise.id} className={cn('border shadow-sm', isCurrent && 'ring-2 ring-primary/30')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base font-semibold">{exercise.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {exercise.muscleGroup && <Badge variant="secondary" className="text-[10px]">{exercise.muscleGroup}</Badge>}
                        {exercise.equipment && <Badge variant="outline" className="text-[10px]">{exercise.equipment}</Badge>}
                        {exercise.difficulty && <Badge variant="outline" className="text-[10px]">{exercise.difficulty.toLowerCase()}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExerciseForStats(exercise.name)}
                      className="shrink-0 flex items-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span className="hidden sm:inline">Stats</span>
                      {isPremium && <Crown className="h-3 w-3 text-amber-500" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="font-medium text-left py-2 pr-2">Set</th>
                          <th className="font-medium text-left py-2 pr-2 w-24">Reps</th>
                          <th className="font-medium text-left py-2 pr-2 w-28">Weight ({weightUnit})</th>
                          <th className="font-medium text-left py-2 pr-2 w-20">Rest</th>
                          <th className="font-medium text-left py-2 pr-2 w-24">Status</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIdx) => {
                          const isActiveRow = isCurrent && setIdx === currentSetIndex;
                          return (
                            <tr key={setIdx} className={cn('group border-t text-xs', set.completed ? 'bg-green-50/60 dark:bg-green-900/20' : isActiveRow ? 'bg-primary/5' : 'hover:bg-muted/50')}>
                              <td className="py-2 pr-2 font-mono w-10">{setIdx + 1}</td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.reps || ''}
                                  min={0}
                                  placeholder="reps"
                                  className="h-8 text-xs"
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleSetChange(exIdx, setIdx, 'reps', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.weight || ''}
                                  placeholder="kg"
                                  className="h-8 text-xs"
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleSetChange(exIdx, setIdx, 'weight', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.rest ?? ''}
                                  placeholder="sec"
                                  className="h-8 text-xs"
                                  onChange={e => handleSetChange(exIdx, setIdx, 'rest', Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                {set.completed ? (
                                  <Badge className="bg-green-600 hover:bg-green-600 text-white">Done</Badge>
                                ) : (
                                  <Badge variant="outline" className={cn('text-muted-foreground', isActiveRow && 'border-primary/50')}>Pending</Badge>
                                )}
                              </td>
                              <td className="py-2 pr-2 text-right">
                                {set.completed ? (
                                  <Button size="sm" variant="ghost" onClick={() => undoSet(exIdx, setIdx)}>Undo</Button>
                                ) : (
                                  <Button size="sm" onClick={() => completeSet(exIdx, setIdx)} disabled={!set.reps || isPaused}>Complete</Button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {exercise.notes && (
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{exercise.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          
          {/* Add Exercise Button */}
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 border-dashed" 
            onClick={() => setShowAddExerciseDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Exercise Stats Dialog */}
      {selectedExerciseForStats && (
        <Dialog open={!!selectedExerciseForStats} onOpenChange={(open) => !open && setSelectedExerciseForStats(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto !bg-white dark:!bg-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <TrendingUp className="h-5 w-5" />
                {selectedExerciseForStats} - Exercise History
                {isPremium && <Crown className="h-4 w-4 text-amber-500" />}
              </DialogTitle>
            </DialogHeader>
            <ExerciseStatsPremium
              exerciseName={selectedExerciseForStats}
              userId={userId}
              isPremium={isPremium}
              onLoadWeight={(weight) => {
                // Find the exercise index by name
                const exerciseIdx = plan.exercises.findIndex(ex => ex.name === selectedExerciseForStats);
                if (exerciseIdx !== -1) {
                  autoLoadWeightForExercise(exerciseIdx, weight);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Sticky Footer Summary */}
      <div className="sticky bottom-14 z-30 bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/70 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-muted-foreground">Elapsed: <span className="font-medium text-foreground">{formatTime(workoutElapsed)}</span></span>
            <span className="text-muted-foreground">Sets: <span className="font-medium text-foreground">{stats.completedSets}/{stats.totalSets}</span></span>
            <span className="text-muted-foreground">Volume: <span className="font-medium text-foreground">{stats.volume} {weightUnit}</span></span>
          </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setLocation('/workouts')}>Exit</Button>
              <Button size="sm" variant="secondary" onClick={postWorkoutNow}>Post Workout</Button>
              <Button size="sm" onClick={() => setShowFinishDialog(true)}>Record & Post</Button>
            </div>
        </div>
      </div>

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record & Post Workout?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>You completed {stats.completedSets} of {stats.totalSets} sets.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFinishDialog(false)}>Cancel</Button>
              <Button onClick={finishWorkout} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record & Continue</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExerciseDialog} onOpenChange={setShowAddExerciseDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => addExerciseToWorkout(exercise)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{exercise.name}</h4>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {exercise.muscleGroups?.slice(0, 2).map(mg => (
                        <Badge key={mg} variant="secondary" className="text-xs">{mg}</Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">{exercise.difficulty}</Badge>
                    </div>
                  </div>
                  <PlusCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No exercises found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutSession;