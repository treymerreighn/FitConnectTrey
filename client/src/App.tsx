import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Home, UtensilsCrossed, Dumbbell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Link } from "@/components/ui/link";
import { ThemeProvider } from "@/contexts/theme-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import Feed from "./pages/feed";
import Profile from "./pages/profile";
import CreatePost from "./pages/create-post";
import NotFound from "./pages/not-found";
import LogWorkout from "./pages/log-workout";
import Workouts from "./pages/workouts";
import ExerciseLibrary from "./pages/exercise-library";
import WorkoutSession from "./pages/workout-session";
import WorkoutSummary from "./pages/workout-summary";
import BuildWorkout from "./pages/build-workout";
import AdminDashboard from "./pages/admin-dashboard";
import Progress from "./pages/progress";
import ProgressInsightsPage from "./pages/progress-insights";
import ExerciseProgress from "./pages/exercise-progress";
import TestUpload from "./pages/test-upload";
import TestImagePost from "./pages/test-image-post";
import RecipesPage from "./pages/recipes";
import Landing from "./pages/landing";
import SearchPage from "./pages/search";
import Notifications from "./pages/notifications";
import Messages from "./pages/messages";
import WorkoutHistory from "./pages/workout-history";
import SavedWorkouts from "./pages/saved-workouts";
import SavedMeals from "./pages/saved-meals";
import SampleWorkout from "./pages/sample-workout.tsx";
import MealsPage from "./pages/meals";
import Settings from "./pages/settings";
import PremiumDemo from "./pages/premium-demo";
import AdminReports from "./pages/admin-reports";
import Auth from "./pages/auth";
import TermsOfService from "./pages/legal/terms";
import PrivacyPolicy from "./pages/legal/privacy";

// Scroll to top when route changes
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}



function BottomNavigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Don't show navigation on auth page
  if (location === "/auth") return null;
  
  // Only show navigation for authenticated users
  if (!isAuthenticated) return null;
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/meals", icon: UtensilsCrossed, label: "Meals" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    // If already on home page and clicking home, scroll to top
    if (path === "/" && location === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 h-16">
      <div className="flex items-center justify-around h-full">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path} asChild>
              <Button
                variant="ghost"
                className={`flex items-center justify-center p-0 h-full [&_svg]:!size-auto !bg-transparent hover:!bg-transparent focus:!bg-transparent active:!bg-transparent focus-visible:!bg-transparent ${
                  isActive
                    ? "text-fit-green"
                    : "text-gray-600 dark:text-gray-300 hover:text-fit-green"
                }`}
                aria-label={label}
                onClick={(e) => handleNavClick(path, e)}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.currentTarget.blur()}
              >
                <Icon className="w-[56px] h-[56px]" strokeWidth={1.5} />
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fit-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Auth} />
          <Route path="/auth" component={Auth} />
        </>
      ) : (
        <>
          <Route path="/" component={Feed} />
          <Route path="/auth" component={Auth} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/create-post" component={CreatePost} />
          <Route path="/log-workout" component={LogWorkout} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/exercise-library" component={ExerciseLibrary} />
          <Route path="/workout-session" component={WorkoutSession} />
          <Route path="/workout-summary" component={WorkoutSummary} />
          <Route path="/build-workout" component={BuildWorkout} />
          <Route path="/workout-history" component={WorkoutHistory} />
          <Route path="/saved-workouts" component={SavedWorkouts} />
          <Route path="/saved-meals" component={SavedMeals} />
          <Route path="/sample-workout" component={SampleWorkout} />

          <Route path="/progress" component={Progress} />
          <Route path="/progress-insights" component={ProgressInsightsPage} />
          <Route path="/exercise-progress" component={ExerciseProgress} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/messages" component={Messages} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/test-upload" component={TestUpload} />
          <Route path="/test-image-post" component={TestImagePost} />
          <Route path="/recipes" component={RecipesPage} />
          <Route path="/discover" component={SearchPage} />
          <Route path="/meals" component={MealsPage} />
          <Route path="/settings" component={Settings} />
          <Route path="/premium-demo" component={PremiumDemo} />
          <Route path="/admin/reports" component={AdminReports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <ScrollToTop />
            <Router />
            <BottomNavigation />
            <Toaster />
          </div>
        </QueryClientProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
