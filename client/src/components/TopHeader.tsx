import React from "react";
import { useLocation } from "wouter";
import { Dumbbell, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopHeaderProps {
  notificationsCount?: number;
  messagesCount?: number;
  className?: string;
}

export default function TopHeader({ notificationsCount = 0, messagesCount = 0, className = "" }: TopHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className={`fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 ${className}`}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-fit-green rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">FitConnect</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="relative p-2 mobile-touch-target" onClick={() => setLocation('/notifications')}>
            <Heart className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {notificationsCount}
            </span>
          </Button>
          <Button variant="ghost" size="sm" className="relative p-2 mobile-touch-target" onClick={() => setLocation('/messages')}>
            <MessageCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-fit-blue rounded-full text-xs text-white flex items-center justify-center">
              {messagesCount}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
