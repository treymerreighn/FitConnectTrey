import { useMemo } from "react";
import { useLocation } from "wouter";
import { Play, Trash2, User, Calendar, Dumbbell, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { projectWorkoutForUser } from "@/lib/workoutProjection";

interface SavedWorkout {
  id: string;
  userId: string;
  templateId: string;
  sourceType: "template" | "post";
  notes?: string;
  dataSnapshot?: any;
  createdAt: string;
}

export default function SavedWorkouts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedWorkouts = [], isLoading } = useQuery<SavedWorkout[]>({
    queryKey: ["/api/saved-workouts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/saved-workouts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-workouts"] }),
  });

  const handleStartWorkout = (workout: SavedWorkout) => {
    const snap = workout.dataSnapshot;
    const workoutData = snap?.workoutData || snap;
    if (!workoutData?.exercises) {
      toast({
        title: "Cannot Start Workout",
        description: "This workout doesn't have exercise details",
        variant: "destructive",
      });
      return;
    }

    const planPromise = projectWorkoutForUser({
      workoutName: snap?.name || workoutData.workoutType || "Saved Workout",
      exercises: workoutData.exercises.map((ex: any) => ({
        name: ex.name || ex.exerciseName,
        exerciseId: ex.exerciseId || ex.id,
        sets: Array.isArray(ex.sets) ? ex.sets : undefined,
      })),
    });

    planPromise.then(plan => {
      const exerciseIds = plan.exercises.map(e => e.id).join(',');
      const planParam = encodeURIComponent(JSON.stringify(plan));
      // Open in builder to allow quick review/customization
      setLocation(`/build-workout?from=saved&exercises=${exerciseIds}&plan=${planParam}`);
    });
  };

  const handleDeleteWorkout = (workoutId: string) => {
    deleteMutation.mutate(workoutId, {
      onSuccess: () =>
        toast({ title: "Workout Removed", description: "Removed from your saved collection" }),
      onError: () =>
        toast({ title: "Failed to remove", description: "Please try again", variant: "destructive" }),
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/workouts")}
              className="text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Saved Workouts</h1>
              <p className="text-sm text-gray-400">
                {savedWorkouts.length} workout{savedWorkouts.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Workouts List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <Card className="bg-gray-800 border-gray-700"><CardContent className="p-12 text-center">Loading...</CardContent></Card>
        ) : savedWorkouts.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Dumbbell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Saved Workouts</h3>
              <p className="text-gray-400 mb-6">
                Start saving workouts from the community feed to build your collection
              </p>
              <Button onClick={() => setLocation("/")} className="bg-red-600 hover:bg-red-700">
                Explore Community Workouts
              </Button>
            </CardContent>
          </Card>
        ) : (
          savedWorkouts.map(workout => {
            const snap = workout.dataSnapshot;
            const workoutData = snap?.workoutData || snap;
            const name = snap?.name || workoutData?.workoutType || "Saved Workout";
            return (
            <Card key={workout.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {snap?.author ? `@${snap.author}` : workout.sourceType}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Saved {formatDate(workout.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Workout Stats */}
                {workoutData && (
                  <div className="bg-gray-700 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      {workoutData.duration && (
                        <div>
                          <div className="font-bold text-blue-400">{workoutData.duration}m</div>
                          <div className="text-xs text-gray-400">Duration</div>
                        </div>
                      )}
                      {workoutData.calories && (
                        <div>
                          <div className="font-bold text-green-400">{workoutData.calories}</div>
                          <div className="text-xs text-gray-400">Calories</div>
                        </div>
                      )}
                      {workoutData.exercises?.length && (
                        <div>
                          <div className="font-bold text-yellow-400">{workoutData.exercises.length}</div>
                          <div className="text-xs text-gray-400">Exercises</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exercise List */}
                {workoutData?.exercises && workoutData.exercises.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Exercises:</h4>
                    <div className="flex flex-wrap gap-2">
                      {workoutData.exercises.slice(0, 6).map((exercise: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {exercise.name || exercise.exerciseName}
                        </Badge>
                      ))}
                      {workoutData.exercises.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{workoutData.exercises.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  <Button
                    onClick={() => handleStartWorkout(workout)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
                  </Button>
                  <Button
                    onClick={() => setLocation(`/post/${workout.templateId}`)}
                    variant="outline"
                    className="border-gray-600"
                    size="sm"
                  >
                    View Original Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          );})
        )}
      </div>
    </div>
  );
}
