import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Home, Search, Dumbbell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Link } from "@/components/ui/link";
import { ThemeProvider } from "@/contexts/theme-context";

import { useAuth } from "@/hooks/useAuth";
import Feed from "./pages/feed";
import Profile from "./pages/profile";
import CreatePost from "./pages/create-post";
import NotFound from "./pages/not-found";
import LogWorkout from "./pages/log-workout";
import Workouts from "./pages/workouts";
import ExerciseLibrary from "./pages/exercise-library";
import WorkoutSession from "./pages/workout-session";
import BuildWorkout from "./pages/build-workout";
import AdminDashboard from "./pages/admin-dashboard";
import Progress from "./pages/progress";
import ProgressInsightsPage from "./pages/progress-insights";
import ExerciseProgress from "./pages/exercise-progress";
import TestUpload from "./pages/test-upload";
import RecipesPage from "./pages/recipes";
import Landing from "./pages/landing";
import SearchPage from "./pages/search";
import Notifications from "./pages/notifications";
import Messages from "./pages/messages";



function BottomNavigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Only show navigation for authenticated users
  if (!isAuthenticated) return null;
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path} asChild>
              <Button
                variant="ghost"
                className={`flex flex-col items-center py-2 px-4 h-auto ${
                  isActive
                    ? "text-fit-green"
                    : "text-gray-600 dark:text-gray-300 hover:text-fit-green"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Feed} />
          <Route path="/profile" component={Profile} />
          <Route path="/create-post" component={CreatePost} />
          <Route path="/log-workout" component={LogWorkout} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/exercise-library" component={ExerciseLibrary} />
          <Route path="/workout-session" component={WorkoutSession} />
          <Route path="/build-workout" component={BuildWorkout} />

          <Route path="/progress" component={Progress} />
          <Route path="/progress-insights" component={ProgressInsightsPage} />
          <Route path="/exercise-progress" component={ExerciseProgress} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/messages" component={Messages} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/test-upload" component={TestUpload} />
          <Route path="/recipes" component={RecipesPage} />
          <Route path="/discover" component={SearchPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Router />
          <BottomNavigation />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
