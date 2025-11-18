import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, Clock, Dumbbell, TrendingUp, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface WorkoutSession {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: Array<{
      reps: number;
      weight?: number;
      completed: boolean;
    }>;
    totalVolume?: number;
  }>;
  notes?: string;
  totalVolume?: number;
  totalSets?: number;
  createdAt: string;
}

export default function WorkoutHistory() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

  // Fetch workout sessions
  const { data: sessions = [], isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workout-sessions", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/workout-sessions/${user?.id || "user1"}`);
      return response.json();
    },
  });

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      searchTerm === "" ||
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.exercises.some(ex => ex.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()));

    const sessionDate = new Date(session.startTime);
    const now = new Date();
    let matchesPeriod = true;

    if (filterPeriod === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = sessionDate >= weekAgo;
    } else if (filterPeriod === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesPeriod = sessionDate >= monthAgo;
    } else if (filterPeriod === "year") {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      matchesPeriod = sessionDate >= yearAgo;
    }

    return matchesSearch && matchesPeriod;
  });

  // Calculate statistics
  const stats = {
    totalWorkouts: sessions.length,
    totalVolume: sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
    totalSets: sessions.reduce((sum, s) => sum + (s.totalSets || 0), 0),
    avgDuration: sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / sessions.length)
      : 0,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Workout History</h1>
          <Button
            onClick={() => setLocation("/build-workout")}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            New Workout
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workouts or exercises..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Workouts</p>
                <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Volume</p>
                <p className="text-2xl font-bold text-white">{stats.totalVolume.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Sets</p>
                <p className="text-2xl font-bold text-white">{stats.totalSets}</p>
              </div>
              <Dumbbell className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold text-white">{stats.avgDuration}m</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workout Sessions List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            <p className="text-gray-400 mt-4">Loading workouts...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No workouts found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || filterPeriod !== "all"
                  ? "Try adjusting your filters"
                  : "Start your first workout to see it here"}
              </p>
              {!searchTerm && filterPeriod === "all" && (
                <Button onClick={() => setLocation("/build-workout")} className="bg-red-600 hover:bg-red-700">
                  Start Your First Workout
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map(session => (
            <Card
              key={session.id}
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
              onClick={() => setLocation(`/workout-session/${session.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(session.startTime)}
                      </span>
                      {session.totalDuration && (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {session.totalDuration}m
                        </span>
                      )}
                    </div>
                  </div>
                  {session.totalVolume && (
                    <Badge className="bg-green-600/20 text-green-400 border-green-600">
                      {session.totalVolume.toLocaleString()} lbs
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {/* Exercise List */}
                  <div className="flex flex-wrap gap-2">
                    {session.exercises.slice(0, 4).map((exercise, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {exercise.exerciseName}
                      </Badge>
                    ))}
                    {session.exercises.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{session.exercises.length - 4} more
                      </Badge>
                    )}
                  </div>

                  {/* Workout Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700">
                    <span>
                      {session.exercises.length} exercise{session.exercises.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {session.totalSets || session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                    </span>
                  </div>

                  {/* Notes Preview */}
                  {session.notes && (
                    <p className="text-sm text-gray-400 italic line-clamp-2 mt-2">"{session.notes}"</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
