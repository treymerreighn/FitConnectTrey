import { Home, UtensilsCrossed, Dumbbell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Link } from "@/components/ui/link";
import FAB from "@/components/FAB";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/meals", icon: UtensilsCrossed, label: "Meals" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
          {/* Floating Action Button for mobile */}
          <FAB />
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 h-16">
        <div className="flex items-center justify-around h-full">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <Link key={path} href={path} asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center justify-center p-0 h-full [&_svg]:!size-auto ${
                    isActive
                      ? "text-fit-green"
                      : "text-gray-600 dark:text-gray-400 hover:text-fit-green"
                  }`}
                  aria-label={label}
                >
                  <Icon className="w-[56px] h-[56px]" strokeWidth={1.5} />
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
