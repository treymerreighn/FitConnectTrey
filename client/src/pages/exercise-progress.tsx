import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Trophy, Calendar, Target, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Exercise, ExerciseProgress } from "@shared/schema";

export default function ExerciseProgressPage() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // Fetch exercises for dropdown
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/exercises");
      return response.json();
    },
  });

  // Fetch exercise progress chart data
  const { data: progressData = [], isLoading: isProgressLoading } = useQuery({
    queryKey: ["/api/exercise-progress", selectedExercise],
    queryFn: async () => {
      if (!selectedExercise) return [];
      const response = await apiRequest("GET", `/api/exercise-progress/${selectedExercise}`);
      return response.json();
    },
    enabled: !!selectedExercise,
  });

  // Fetch workout volume chart
  const { data: volumeData = [] } = useQuery({
    queryKey: ["/api/workout-volume-chart"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/workout-volume-chart");
      return response.json();
    },
  });

  // Fetch personal records
  const { data: personalRecords = [] } = useQuery<ExerciseProgress[]>({
    queryKey: ["/api/personal-records"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/personal-records");
      return response.json();
    },
  });

  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);

  // Calculate statistics
  const calculateStats = () => {
    if (!progressData.length) return { improvement: 0, totalSessions: 0, bestWeight: 0 };
    
    const firstSession = progressData[0];
    const lastSession = progressData[progressData.length - 1];
    
    const improvement = firstSession.weight && lastSession.weight 
      ? ((lastSession.weight - firstSession.weight) / firstSession.weight * 100)
      : 0;
    
    const bestWeight = Math.max(...progressData.map((d: ExerciseProgress) => d.bestSet?.weight || 0));
    
    return {
      improvement: Math.round(improvement),
      totalSessions: progressData.length,
      bestWeight: bestWeight
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Exercise Progress</h1>
              <Badge variant="secondary" className="flex items-center gap-1 h-fit whitespace-nowrap">
                <Trophy className="w-4 h-4" />
                <span>{personalRecords.length} PRs</span>
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Track your strength gains and workout performance
            </p>
          </div>
        </div>

        {/* Exercise Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select Exercise
            </CardTitle>
            <CardDescription>
              Choose an exercise to view detailed progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an exercise..." />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Progress Charts */}
        {selectedExercise && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Sessions
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.totalSessions}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Best Weight
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.bestWeight}lbs
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Improvement
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weight Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedExerciseData?.name} - Weight Progress</CardTitle>
                <CardDescription>
                  Track your strength gains over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProgressLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="oneRepMax" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    No progress data available for this exercise
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reps Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedExerciseData?.name} - Reps Progress</CardTitle>
                <CardDescription>
                  Monitor your endurance improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reps" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    No progress data available for this exercise
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Workout Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Overall Workout Volume
            </CardTitle>
            <CardDescription>
              Track your total training volume and workout duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No workout volume data available. Complete some workouts to see your progress!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Personal Records
              </CardTitle>
              <CardDescription>
                Your recent personal best achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalRecords.slice(0, 6).map((record) => (
                  <div key={record.id} className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                        {record.exerciseName}
                      </h3>
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="space-y-1">
                      {record.bestSet.weight && (
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Weight: {record.bestSet.weight}lbs
                        </p>
                      )}
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Reps: {record.bestSet.reps}
                      </p>
                      {record.bestSet.oneRepMax && (
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Est. 1RM: {record.bestSet.oneRepMax}lbs
                        </p>
                      )}
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}