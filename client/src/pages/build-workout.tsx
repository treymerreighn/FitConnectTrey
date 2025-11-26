import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Dumbbell, Timer, Save, Play, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/theme-context";
import { api } from "@/lib/api";

type SetRow = { id: string; reps: number; weight?: number; restTime?: number };
type ExerciseRow = { id: string; name: string; notes?: string; sets: SetRow[]; expanded?: boolean; sourceExerciseId?: string };
type LibraryExercise = { id: string; name: string; muscleGroups: string[]; difficulty: string };

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Calculate suggested weight based on last performance using Brzycki formula
function calculateSuggestedWeight(lastWeight?: number, lastReps?: number, targetReps = 10): number {
  if (!lastWeight || !lastReps || lastReps <= 0) return 0;
  
  // Brzycki 1RM formula: 1RM = weight / (1.0278 - 0.0278 * reps)
  const oneRepMax = lastWeight / (1.0278 - 0.0278 * lastReps);
  
  // Calculate weight for target reps: weight = 1RM * (1.0278 - 0.0278 * targetReps)
  const suggestedWeight = oneRepMax * (1.0278 - 0.0278 * targetReps);
  
  // Round to nearest 2.5kg increment (common plate size)
  return Math.round(suggestedWeight / 2.5) * 2.5;
}

function makeExercise(name: string, exerciseId?: string, defaultWeight = 0, defaultReps = 10, defaultRest = 90): ExerciseRow {
  return {
    id: generateId(),
    name,
    sourceExerciseId: exerciseId,
    notes: "",
    expanded: true,
    sets: [
      { id: generateId(), reps: defaultReps, weight: defaultWeight, restTime: defaultRest },
      { id: generateId(), reps: defaultReps, weight: defaultWeight, restTime: defaultRest },
      { id: generateId(), reps: defaultReps, weight: defaultWeight, restTime: defaultRest },
    ],
  };
}

export default function BuildWorkout() {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutGoal, setWorkoutGoal] = useState("");
  const [intensity, setIntensity] = useState<"easy" | "moderate" | "hard" | "custom">("moderate");
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const totals = useMemo(() => {
    const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0);
    const estMinutes = Math.max(10, Math.round(totalSets * 2.75));
    const volume = exercises.reduce((acc, e) => acc + e.sets.reduce((v, s) => v + (s.weight || 0) * (s.reps || 0), 0), 0);
    return { totalSets, estMinutes, volume };
  }, [exercises]);

  async function addExerciseFromLibrary(ex: LibraryExercise) {
    try {
      // Fetch user's last performance for this exercise
      const progress = await api.getExerciseProgress(ex.id, user?.id);
      let suggestedWeight = 0;
      if (progress.length > 0) {
        // Get the most recent entry
        const lastEntry = progress[progress.length - 1];
        suggestedWeight = calculateSuggestedWeight(lastEntry.weight, lastEntry.reps, 10);
      }
      setExercises((prev) => [...prev, makeExercise(ex.name, ex.id, suggestedWeight)]);
    } catch (error) {
      console.error('Failed to fetch exercise progress:', error);
      // Fallback to default weight
      setExercises((prev) => [...prev, makeExercise(ex.name, ex.id)]);
    }
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: string, updater: (e: ExerciseRow) => ExerciseRow) {
    setExercises((prev) => prev.map((e) => (e.id === id ? updater({ ...e }) : e)));
  }

  // Save for later: create a template, then bookmark it as a saved workout
  const saveForLaterMutation = useMutation({
    mutationFn: async () => {
      const templatePayload = {
        name: workoutName || "Untitled Workout",
        ownerUserId: user?.id || "user1",
        isPublic: false,
        estimatedDurationMinutes: totals.estMinutes,
        goal: workoutGoal || undefined,
        intensity,
        exercises: exercises.map((ex, idx) => ({
          name: ex.name,
          order: idx,
          notes: ex.notes || "",
          sets: ex.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight || 0,
            restSeconds: s.restTime || 90,
          })),
        })),
      };

      const tplRes = await fetch("/api/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templatePayload),
      });
      if (!tplRes.ok) {
        const text = await tplRes.text();
        throw new Error(text || "Failed to save workout");
      }
      const template = await tplRes.json();

      const snapshot = {
        workoutType: workoutName || "Untitled Workout",
        duration: totals.estMinutes,
        calories: Math.round(totals.volume / 100) + 50,
        exercises: exercises.map((ex) => ({
          id: ex.sourceExerciseId || ex.id,
          exerciseName: ex.name,
          sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight || 0 })),
        })),
      };

      const savedRes = await fetch("/api/saved-workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          sourceType: "template",
          dataSnapshot: snapshot,
        }),
      });
      if (!savedRes.ok) {
        const text = await savedRes.text();
        throw new Error(text || "Failed to bookmark workout");
      }
      return savedRes.json();
    },
    onSuccess: () => {
      toast({ title: "Saved for later", description: "Find it in Saved Workouts." });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err?.message || "Couldn't save workout", variant: "destructive" });
    },
  });

  function startWorkout() {
    const plan = {
      name: workoutName,
      goal: workoutGoal || undefined,
      intensity,
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map((s) => ({ targetReps: s.reps, weight: s.weight || 0, restTime: s.restTime || 90 })),
      })),
    };
    const exerciseIds = plan.exercises.map((e) => e.id).join(",");
    const planParam = encodeURIComponent(JSON.stringify(plan));
    setLocation(`/workout-session?exercises=${encodeURIComponent(exerciseIds)}&plan=${planParam}`);
  }

  function postWorkoutNow() {
    if (exercises.length === 0) return;
    const snapshot = {
      workoutType: workoutName || "Untitled Workout",
      duration: totals.estMinutes,
      calories: Math.round(totals.volume / 100) + 50,
      goal: workoutGoal || undefined,
      intensity,
      exercises: exercises.map((ex) => ({
        id: ex.sourceExerciseId || ex.id,
        exerciseName: ex.name,
        sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight || 0 })),
      })),
    };
    const encoded = encodeURIComponent(JSON.stringify(snapshot));
    setLocation(`/create-post?type=workout&workoutData=${encoded}`);
  }

  // Prefill from shared plan when provided via query string
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      if (!planParam) return;
      const plan = JSON.parse(decodeURIComponent(planParam));
      if (!plan || !Array.isArray(plan.exercises)) return;

      if (plan.name && typeof plan.name === 'string') {
        setWorkoutName(plan.name);
      }

      const mapped: ExerciseRow[] = plan.exercises.map((ex: any) => {
        const setsSrc: any[] | undefined = Array.isArray(ex.sets) ? ex.sets : undefined;
        const targetSets = ex.targetSets && Number.isFinite(ex.targetSets) ? ex.targetSets : 3;
        const targetReps = ex.targetReps && Number.isFinite(ex.targetReps) ? ex.targetReps : 8;
        const rows: SetRow[] = setsSrc
          ? setsSrc.map((s: any) => ({ id: generateId(), reps: s.targetReps ?? targetReps, weight: s.weight ?? 0, restTime: s.restTime ?? 90 }))
          : Array.from({ length: targetSets }, () => ({ id: generateId(), reps: targetReps, weight: 0, restTime: 90 }));
        return {
          id: generateId(),
          name: ex.name,
          sourceExerciseId: ex.id,
          notes: "",
          expanded: true,
          sets: rows,
        } as ExerciseRow;
      });

      setExercises(mapped);
    } catch (_e) {
      // ignore parse errors
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto max-w-4xl px-5 py-4 flex items-center gap-3">
          <Dumbbell className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Workout Builder</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 pt-6 pb-40 md:pb-36 pb-[calc(env(safe-area-inset-bottom)+9rem)]">
        {/* Workout meta */}
        <Card className="border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="name">Workout name</Label>
              <Input id="name" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="e.g., Push Day - Hypertrophy" className="h-11 text-base" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="goal">Goal (optional)</Label>
              <Input
                id="goal"
                value={workoutGoal}
                onChange={(e) => setWorkoutGoal(e.target.value)}
                placeholder="Strength, hypertrophy, endurance…"
                className="h-11 text-base"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <Label className="text-sm">Overview</Label>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <Badge variant="secondary" className="h-7 rounded-full px-3 dark:bg-slate-800 dark:text-slate-100">Sets: {totals.totalSets}</Badge>
                <Badge variant="secondary" className="h-7 rounded-full px-3 flex items-center gap-1 dark:bg-slate-800 dark:text-slate-100"><Timer className="h-4 w-4" />~{totals.estMinutes} min</Badge>
                <Badge variant="secondary" className="h-7 rounded-full px-3 dark:bg-slate-800 dark:text-slate-100">Volume: {Intl.NumberFormat().format(totals.volume)} lb</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Intensity</span>
                {(["easy","moderate","hard"] as const).map(level => (
                  <Button
                    key={level}
                    type="button"
                    variant={intensity === level ? "default" : "outline"}
                    size="sm"
                    className={`h-7 rounded-full px-3 text-xs capitalize ${
                      intensity === level
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-100"
                    }`}
                    onClick={() => setIntensity(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercises list */}
        <div className="mt-6 space-y-6">
          {exercises.map((ex, idx) => (
            <motion.div key={ex.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <ExerciseCard
                index={idx + 1}
                ex={ex}
                onRemove={() => removeExercise(ex.id)}
                onChange={(updater) => updateExercise(ex.id, updater)}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={() => setShowPicker(true)} className="h-12 rounded-xl px-6 text-base bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-5 w-5" /> Add From Library
          </Button>
        </div>
      </div>

      {/* Sticky Footer Summary */}
      <div className="fixed bottom-14 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-950/70">
        <div className="mx-auto max-w-4xl px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-medium">
              {workoutName || "Untitled Workout"}
              {workoutGoal && (
                <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">• {workoutGoal}</span>
              )}
            </span>
            <Separator orientation="vertical" className="hidden md:block" />
            <span>Sets: <b>{totals.totalSets}</b></span>
            <span>Time: <b>~{totals.estMinutes} min</b></span>
            <span>Volume: <b>{Intl.NumberFormat().format(totals.volume)} lb</b></span>
            <span className="ml-auto text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 hidden md:inline">
              {intensity === "easy" && "Easy Day"}
              {intensity === "moderate" && "Moderate"}
              {intensity === "hard" && "Hard"}
              {intensity === "custom" && "Custom"}
            </span>
          </div>
           <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
              className="h-10 flex-1 rounded-2xl text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/40 disabled:opacity-60 disabled:shadow-none"
              onClick={startWorkout}
              disabled={exercises.length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
            <div className="flex justify-end gap-2 sm:w-auto">
              <Button
                variant="outline"
                className="h-9 rounded-xl text-xs sm:text-sm"
                onClick={() => saveForLaterMutation.mutate()}
                disabled={saveForLaterMutation.isPending || exercises.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveForLaterMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-xl text-xs sm:text-sm"
                onClick={postWorkoutNow}
                disabled={exercises.length === 0}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showPicker && <ExercisePickerModal onClose={() => setShowPicker(false)} onSelect={async ex => { await addExerciseFromLibrary(ex); setShowPicker(false); }} search={pickerSearch} setSearch={setPickerSearch} />}
    </div>
  );
}

function ExerciseCard({ index, ex, onRemove, onChange }: { index: number; ex: ExerciseRow; onRemove: () => void; onChange: (updater: (e: ExerciseRow) => ExerciseRow) => void; }) {
  const volume = ex.sets.reduce((v, s) => v + (s.weight || 0) * (s.reps || 0), 0);

  function addSet() {
  onChange((e) => ({ ...e, sets: [...e.sets, { id: generateId(), reps: 10, weight: 0, restTime: 90 }] }));
  }
  function removeSet(id: string) {
    onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.id !== id) }));
  }
  function updateSet(id: string, patch: Partial<SetRow>) {
    onChange((e) => ({ ...e, sets: e.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }

  return (
  <Card className="border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Exercise {index}</div>
            <CardTitle className="text-2xl tracking-tight">{ex.name}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-200">Volume: {Intl.NumberFormat().format(volume)} lb</Badge>
              <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-200">Sets: {ex.sets.length}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onRemove} className="text-rose-600 hover:text-rose-700"><Trash2 className="h-5 w-5"/></Button>
            <Button variant="outline" size="icon" onClick={() => onChange((e) => ({ ...e, expanded: !e.expanded }))}>
              {ex.expanded ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {ex.expanded && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40">
            {/* Header Row */}
            <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-200">
              <div className="col-span-2">Set</div>
              <div className="col-span-3">Reps</div>
              <div className="col-span-3">Weight (lb)</div>
              <div className="col-span-3">Rest (sec)</div>
              <div className="col-span-1" />
            </div>

            {/* Rows */}
            {ex.sets.map((s, i) => (
              <div key={s.id} className="grid grid-cols-12 items-center px-4 py-3 border-t text-base">
                <div className="col-span-2 text-slate-600 dark:text-slate-300">{i + 1}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <StepInput value={s.reps} onChange={(v) => updateSet(s.id, { reps: v })} min={1} max={50} />
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <StepInput value={s.weight || 0} onChange={(v) => updateSet(s.id, { weight: v })} min={0} max={2000} />
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <StepInput value={s.restTime || 90} onChange={(v) => updateSet(s.id, { restTime: v })} min={15} max={600} step={5} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removeSet(s.id)} className="text-rose-600 hover:text-rose-700"><Trash2 className="h-5 w-5"/></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ex.expanded && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <Label htmlFor={`notes-${ex.id}`} className="text-sm text-slate-600 dark:text-slate-300">Notes</Label>
              <Input id={`notes-${ex.id}`} value={ex.notes} onChange={(e) => onChange((e0) => ({ ...e0, notes: e.target.value }))} placeholder="Form cues, tempo, PR attempts…" className="mt-1 h-11" />
            </div>
            <Button onClick={addSet} className="h-11 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"><Plus className="mr-2 h-4 w-4"/>Add Set</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepInput({ value, onChange, min = 0, max = 999, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; }) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => onChange(Math.max(min, value - step))}>–</Button>
      <Input type="number" className="h-11 w-24 text-center text-base" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} />
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => onChange(Math.min(max, value + step))}>+</Button>
    </div>
  );
}

function ExercisePickerModal({ onClose, onSelect, search, setSearch }: { onClose: () => void; onSelect: (ex: LibraryExercise) => void | Promise<void>; search: string; setSearch: (v: string) => void }) {
  const { data: libraryExercises = [] } = useQuery<LibraryExercise[]>({ queryKey: ["/api/exercises"] });

  // Step 1: choose body part or "See All"
  const [stage, setStage] = useState<'choose' | 'list'>("choose");
  const [selectedPart, setSelectedPart] = useState<string | 'all' | null>(null);

  // Friendly labels + alias matching to exercise.muscleGroups values
  const PARTS: { key: string; label: string; aliases: string[] }[] = [
    { key: 'chest', label: 'Chest', aliases: ['chest','pecs'] },
    { key: 'back', label: 'Back', aliases: ['back','lats','lower_back'] },
    { key: 'shoulders', label: 'Shoulders', aliases: ['shoulders','delts'] },
    { key: 'arms', label: 'Arms', aliases: ['biceps','triceps','forearms','arms'] },
    { key: 'legs', label: 'Legs', aliases: ['quadriceps','hamstrings','calves','legs'] },
    { key: 'glutes', label: 'Glutes', aliases: ['glutes'] },
    { key: 'core', label: 'Core', aliases: ['core','abs','obliques'] },
    { key: 'traps', label: 'Traps', aliases: ['traps'] },
  ];

  const matchesPart = (ex: LibraryExercise, partKey: string) => {
    const part = PARTS.find(p => p.key === partKey);
    if (!part) return true;
    const groups = (ex.muscleGroups || []).map(g => g.toLowerCase());
    return part.aliases.some(a => groups.includes(a));
  };

  const filtered = [...libraryExercises]
    .filter(ex => (selectedPart && selectedPart !== 'all') ? matchesPart(ex, selectedPart) : true)
    .filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Add From Library</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {stage === 'choose' && (
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Choose a body part to target, or see all exercises.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PARTS.map(p => (
                <Button key={p.key} variant="outline" className="justify-start" onClick={() => { setSelectedPart(p.key); setStage('list'); }}>
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setSelectedPart('all'); setStage('list'); }} className="bg-indigo-600 hover:bg-indigo-700">
                See All Exercises
              </Button>
              <Input placeholder="Quick search (optional)" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        )}

        {stage === 'list' && (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStage('choose')}>Change Body Part</Button>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {selectedPart === 'all' ? 'All exercises' : `Body part: ${PARTS.find(p => p.key === selectedPart)?.label || ''}`}
              </div>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <Input placeholder="Search exercises" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filtered.map(ex => (
                <div key={ex.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  <div className="flex flex-col">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{(ex.muscleGroups||[]).slice(0,3).join(', ')}</span>
                  </div>
                  <Button size="sm" onClick={() => onSelect(ex)}>Add</Button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No matches.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}