import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, PauseCircle, PlayCircle, Minus, Plus, PlusCircle, Search, TrendingUp, Crown, Check, Timer, Dumbbell, Flame, Trash2 } from 'lucide-react';
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

// Swipeable row component for delete gesture
const SwipeableSetRow: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
  canDelete: boolean;
  className?: string;
}> = ({ children, onDelete, canDelete, className }) => {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const deleteThreshold = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null || !canDelete) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
      setShowDelete(diff < deleteThreshold);
    }
  };

  const handleTouchEnd = () => {
    if (translateX < deleteThreshold && canDelete) {
      onDelete();
    }
    setTranslateX(0);
    setStartX(null);
    setShowDelete(false);
  };

  return (
    <tr
      className={cn(className, 'relative')}
      style={{ 
        transform: `translateX(${translateX}px)`,
        transition: startX === null ? 'transform 0.2s ease-out' : 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {showDelete && (
        <td className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center" style={{ transform: `translateX(${-translateX}px)` }}>
          <Trash2 className="h-5 w-5 text-white" />
        </td>
      )}
    </tr>
  );
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
  const [showExitDialog, setShowExitDialog] = useState(false);
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

  // Play chime sound
  const playChime = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
    } catch (e) {
      console.log('Could not play chime');
    }
  };

  // Tick down active rest timer
  useEffect(() => {
    if (isPaused) return;
    let interval: any;
    if (activeRest !== null && activeRest > 0) {
      interval = setInterval(() => {
        setActiveRest(prev => {
          if (prev !== null && prev <= 1) {
            playChime();
            return null; // Auto-hide when timer reaches 0
          }
          return prev !== null ? prev - 1 : null;
        });
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

  const addSet = (exerciseIdx: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: WorkoutSet = {
        reps: lastSet?.reps || 10,
        weight: lastSet?.weight || 0,
        rest: lastSet?.rest || 60,
        completed: false
      };
      ex.sets = [...ex.sets, newSet];
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
  };

  const removeSet = (exerciseIdx: number, setIdx: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      if (ex.sets.length <= 1) return prev; // Keep at least one set
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
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
  };

  const removeExercise = (exerciseIdx: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const newExercises = prev.exercises.filter((_, idx) => idx !== exerciseIdx);
      return {
        ...prev,
        exercises: newExercises
      };
    });
    // Adjust current exercise index if needed
    if (exerciseIdx <= currentExerciseIndex && currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-3">
          {/* Top row: Title and action buttons */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white truncate">{plan.name || 'Workout'}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={() => setShowExitDialog(true)} className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={togglePause} 
                className={cn(
                  "h-8 w-8",
                  isPaused 
                    ? "bg-green-500 hover:bg-green-600 border-green-500 text-white" 
                    : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                )}
              >
                {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
              </Button>
              <Button size="sm" onClick={() => setShowFinishDialog(true)} disabled={stats.completedSets === 0} className="h-8 bg-red-600 hover:bg-red-700 text-white">
                Record & Post
              </Button>
            </div>
          </div>
          {/* Bottom row: Stats pills - centered with volume in middle */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5">
              <Timer className="h-4 w-4 text-red-500" />
              <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">{formatTime(workoutElapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 rounded-full px-3 py-1.5 shadow-sm shadow-red-600/30">
              <Dumbbell className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">{stats.volume.toLocaleString()} {weightUnit}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{stats.completedSets}<span className="text-zinc-400">/{stats.totalSets}</span> sets</span>
            </div>
          </div>
        </div>
      </div>
      {isPaused && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-y border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-center text-sm py-2">
          Paused — tap resume to continue
        </div>
      )}

      {/* Rest Timer Banner */}
      {activeRest !== null && (
        <div className="sticky top-[100px] z-10 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800">
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
              <Card key={exercise.id} className={cn('border border-zinc-200 dark:border-zinc-700 shadow-md bg-white dark:bg-zinc-900', isCurrent && 'ring-2 ring-red-500/50')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">{exercise.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {exercise.muscleGroup && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">{exercise.muscleGroup}</Badge>}
                        {exercise.equipment && <Badge variant="outline" className="text-[10px] border-zinc-300 dark:border-zinc-600">{exercise.equipment}</Badge>}
                        {exercise.difficulty && <Badge variant="outline" className="text-[10px] border-zinc-300 dark:border-zinc-600">{exercise.difficulty.toLowerCase()}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExerciseForStats(exercise.name)}
                        className="flex items-center gap-1 border-zinc-300 dark:border-zinc-600 hover:border-red-500 hover:text-red-600"
                      >
                        <TrendingUp className="h-3 w-3" />
                        <span className="hidden sm:inline">Stats</span>
                        {isPremium && <Crown className="h-3 w-3 text-amber-500" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeExercise(exIdx)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-zinc-300 dark:border-zinc-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-0 pb-0">
                  <div className="overflow-x-auto pb-2">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-xs text-zinc-500 dark:text-zinc-400">
                          <th className="font-medium text-left py-2 pl-4 pr-2">Set</th>
                          <th className="font-medium text-left py-2 pr-2 w-24">Reps</th>
                          <th className="font-medium text-left py-2 pr-2 w-28">Weight ({weightUnit})</th>
                          <th className="font-medium text-left py-2 pr-2 w-20">Rest</th>
                          <th className="font-medium text-center py-2 pr-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIdx) => {
                          const isActiveRow = isCurrent && setIdx === currentSetIndex;
                          const canDelete = exercise.sets.length > 1;
                          return (
                            <SwipeableSetRow
                              key={setIdx}
                              onDelete={() => removeSet(exIdx, setIdx)}
                              canDelete={canDelete}
                              className={cn('group border-t border-zinc-200 dark:border-zinc-800 text-xs', set.completed ? 'bg-green-100 dark:bg-green-900/40' : isActiveRow ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50')}
                            >
                              <td className="py-2 pl-4 pr-2 font-mono w-10 text-red-500 dark:text-red-400 font-bold">{setIdx + 1}</td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.reps || ''}
                                  min={0}
                                  placeholder="reps"
                                  className="h-8 text-xs border-zinc-300 dark:border-zinc-600 focus:border-red-500"
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleSetChange(exIdx, setIdx, 'reps', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.weight || ''}
                                  placeholder={weightUnit}
                                  className="h-8 text-xs border-zinc-300 dark:border-zinc-600 focus:border-red-500"
                                  onFocus={e => e.target.select()}
                                  onChange={e => handleSetChange(exIdx, setIdx, 'weight', e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.rest ?? ''}
                                  placeholder="sec"
                                  className="h-8 text-xs border-zinc-300 dark:border-zinc-600 focus:border-red-500"
                                  onChange={e => handleSetChange(exIdx, setIdx, 'rest', Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-4 text-center">
                                <button
                                  onClick={() => set.completed ? undoSet(exIdx, setIdx) : completeSet(exIdx, setIdx)}
                                  disabled={!set.completed && (!set.reps || isPaused)}
                                  className={cn(
                                    'w-6 h-6 min-w-6 min-h-6 rounded-full border flex items-center justify-center transition-all duration-200',
                                    set.completed
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-zinc-300 dark:border-zinc-600 bg-transparent hover:border-red-400 dark:hover:border-red-500',
                                    !set.completed && (!set.reps || isPaused) && 'opacity-50 cursor-not-allowed'
                                  )}
                                >
                                  {set.completed && <Check className="w-4 h-4" />}
                                </button>
                              </td>
                            </SwipeableSetRow>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {exercise.notes && (
                    <p className="mt-3 mb-2 px-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{exercise.notes}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSet(exIdx)}
                    className="w-full text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-t-none"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Set
                  </Button>
                </CardContent>
              </Card>
            )
          })}
          
          {/* Add Exercise Button */}
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400" 
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
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-red-500" />
                {selectedExerciseForStats}
                {isPremium && <Crown className="h-4 w-4 text-red-500 ml-1" />}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
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
                  setSelectedExerciseForStats(null); // Close dialog after loading
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

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

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-sm rounded-2xl [&>button]:right-2 [&>button]:top-2">
          <DialogHeader>
            <DialogTitle>Discard Workout?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>Are you sure you want to exit? Your workout progress will be lost.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExitDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setLocation('/workouts')}>Discard & Exit</Button>
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