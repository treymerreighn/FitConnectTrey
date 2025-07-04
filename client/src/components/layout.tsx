import { Home, Search, Dumbbell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
      
      {/* Bottom Navigation */}
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
                      : "text-gray-600 dark:text-gray-400 hover:text-fit-green"
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
    </div>
  );
}
