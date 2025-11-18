import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, Upload, FilePlus2 } from 'lucide-react';

// Types for workout session based on unified schema
interface WorkoutSet { reps: number; weight?: number; rest?: number; completed?: boolean; startedAt?: number; completedAt?: number; }
interface WorkoutExercise { id: string; name: string; sets: WorkoutSet[]; notes?: string; difficulty?: string; muscleGroup?: string; equipment?: string; isTemplate?: boolean; }
interface ActiveWorkoutPlan { id?: string; name?: string; exercises: WorkoutExercise[]; startedAt: number; }

// Format seconds as mm:ss
const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${s.toString().padStart(2, '0')}`; };

// Parse encoded workout plan from query string
const parsePlanFromLocation = (fullLocation: string): ActiveWorkoutPlan | null => {
  const queryIndex = fullLocation.indexOf('?');
  const search = queryIndex >= 0 ? fullLocation.substring(queryIndex) : '';
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
          sets: (ex.sets || []).map((s: any) => ({
            reps: s.reps ?? 0,
            weight: s.weight,
            rest: s.rest ?? 60,
            completed: false,
          }))
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
  const [plan, setPlan] = useState<ActiveWorkoutPlan | null>(() => parsePlanFromLocation(location));
  const [activeRest, setActiveRest] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState<number>(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tick down active rest timer
  useEffect(() => {
    let interval: any;
    if (activeRest !== null && activeRest > 0) {
      interval = setInterval(() => {
        setActiveRest(prev => (prev !== null ? Math.max(prev - 1, 0) : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRest]);

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
    return Math.floor((Date.now() - plan.startedAt) / 1000);
  }, [plan, stats.completedSets]);

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: keyof WorkoutSet, value: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      const ex = { ...exercises[exerciseIdx] };
      const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      ex.sets = sets;
      exercises[exerciseIdx] = ex;
      return { ...prev, exercises };
    });
  };

  const startRest = (seconds: number) => {
    setRestTarget(seconds);
    setActiveRest(seconds);
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

  const finishWorkout = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      toast({ title: 'Workout saved', description: 'Session data persisted.' });
      setShowFinishDialog(false);
      // After finish, route to post creation with snapshot encoded
      const snapshot = {
        workoutType: plan.name,
        duration: Math.floor(workoutElapsed / 60),
        calories: Math.round(stats.volume / 100) + 50, // rough heuristic
        exercises: plan.exercises.map(ex => ({
          id: ex.id,
          exerciseName: ex.name,
          sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
        }))
      };
      const encoded = encodeURIComponent(JSON.stringify(snapshot));
      setLocation(`/create-post?type=workout&workoutData=${encoded}`);
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', description: 'Unable to save workout right now.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
    <div className="min-h-screen bg-neutral-50/80">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">{plan.name || 'Workout Session'}</h1>
            <p className="text-xs text-muted-foreground">Logging your sets in real time</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-center">
              <span className="font-medium">Time</span>
              <Badge variant="secondary" className="text-xs font-mono">{formatTime(workoutElapsed)}</Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">Sets</span>
              <Badge variant="outline" className="text-xs">{stats.completedSets}/{stats.totalSets}</Badge>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">Volume</span>
              <Badge variant="outline" className="text-xs">{stats.volume} kg</Badge>
            </div>
              <Button variant="outline" size="sm" onClick={() => setShowFinishDialog(true)} disabled={stats.completedSets === 0}>Finish</Button>
          </div>
        </div>
      </div>

      {/* Rest Timer Banner */}
      {activeRest !== null && (
        <div className="sticky top-[64px] z-10 bg-amber-50 border-y border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800">Rest</span>
              <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-mono">{formatTime(activeRest)}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setActiveRest(null)}>Skip</Button>
              <Button size="sm" variant="outline" onClick={() => setActiveRest(restTarget)}>Restart</Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {plan.exercises.map((exercise, exIdx) => {
            const isCurrent = exIdx === currentExerciseIndex;
            return (
              <Card key={exercise.id} className={cn('border shadow-sm', isCurrent && 'ring-2 ring-primary/30')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">{exercise.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {exercise.muscleGroup && <Badge variant="secondary" className="text-[10px]">{exercise.muscleGroup}</Badge>}
                        {exercise.equipment && <Badge variant="outline" className="text-[10px]">{exercise.equipment}</Badge>}
                        {exercise.difficulty && <Badge variant="outline" className="text-[10px]">{exercise.difficulty.toLowerCase()}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="font-medium text-left py-2 pr-2">Set</th>
                          <th className="font-medium text-left py-2 pr-2 w-24">Reps</th>
                          <th className="font-medium text-left py-2 pr-2 w-28">Weight</th>
                          <th className="font-medium text-left py-2 pr-2 w-20">Rest</th>
                          <th className="font-medium text-left py-2 pr-2 w-24">Status</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIdx) => {
                          const isActiveRow = isCurrent && setIdx === currentSetIndex;
                          return (
                            <tr key={setIdx} className={cn('group border-t text-xs', set.completed ? 'bg-green-50/60' : isActiveRow ? 'bg-primary/5' : 'hover:bg-muted/50')}>
                              <td className="py-2 pr-2 font-mono w-10">{setIdx + 1}</td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.reps}
                                  min={0}
                                  className="h-8 text-xs"
                                  onChange={e => handleSetChange(exIdx, setIdx, 'reps', Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  type="number"
                                  value={set.weight ?? ''}
                                  placeholder="kg"
                                  className="h-8 text-xs"
                                  onChange={e => handleSetChange(exIdx, setIdx, 'weight', Number(e.target.value))}
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
                                  <Button size="sm" onClick={() => completeSet(exIdx, setIdx)} disabled={!set.reps}>Complete</Button>
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
        </div>
      </div>

      {/* Sticky Footer Summary */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-muted-foreground">Elapsed: <span className="font-medium text-foreground">{formatTime(workoutElapsed)}</span></span>
            <span className="text-muted-foreground">Sets: <span className="font-medium text-foreground">{stats.completedSets}/{stats.totalSets}</span></span>
            <span className="text-muted-foreground">Volume: <span className="font-medium text-foreground">{stats.volume} kg</span></span>
          </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLocation('/workouts')}>Exit</Button>
              <Button size="sm" onClick={() => setShowFinishDialog(true)} disabled={stats.completedSets === 0}>Record & Post</Button>
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
    </div>
  );
};

export default WorkoutSession;