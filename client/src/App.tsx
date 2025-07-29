import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Home, Search, Dumbbell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
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
import ExerciseProgress from "./pages/exercise-progress";
import TestUpload from "./pages/test-upload";
import Landing from "./pages/landing";

const queryClient = new QueryClient();

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
          <Route path="/exercise-progress" component={ExerciseProgress} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/test-upload" component={TestUpload} />
          <Route path="/discover">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
              <header className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
                <div className="flex items-center justify-between px-4 py-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discover</h1>
                </div>
              </header>
              
              <main className="pt-16 px-4 py-6">
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users, tips, recipes..."
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-fit-green focus:border-transparent"
                    />
                  </div>

                  {/* Categories */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                      <User className="w-8 h-8 text-fit-blue mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">Users</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find fitness buddies</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                      <Dumbbell className="w-8 h-8 text-fit-green mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">Tips</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Workout advice</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-sm">🍎</span>
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">Meals</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Healthy recipes</p>
                    </div>
                  </div>

                  {/* Trending Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending</h2>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-fit-green rounded-full flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">#MorningWorkout</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">2.1k posts this week</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">🥗</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">#HealthyMeals</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">1.8k posts this week</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-fit-blue rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">#ProgressPics</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">1.5k posts this week</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </Route>
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
