import React from "react";
import { useLocation } from "wouter";
import { Dumbbell, Heart, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopHeaderProps {
  notificationsCount?: number;
  messagesCount?: number;
  className?: string;
  showSearch?: boolean;
}

export default function TopHeader({ notificationsCount = 0, messagesCount = 0, className = "", showSearch = false }: TopHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className={`fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 pt-[env(safe-area-inset-top)] ${className}`}>
      <div className="flex items-center justify-between px-4 py-4">
        {showSearch && (
          <div className="absolute left-4">
            <Button variant="ghost" size="sm" className="p-2 mobile-touch-target" onClick={() => setLocation('/discover')}>
              <Search className="!w-[20px] !h-[20px] text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        )}
        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">KRATOS</h1>
        </div>
        <div className="flex items-center space-x-1 absolute right-2">
          <Button variant="ghost" size="sm" className="relative p-2 mobile-touch-target" onClick={() => setLocation('/notifications')}>
            <Heart className="!w-[20px] !h-[20px] text-gray-600 dark:text-gray-300" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="relative p-2 mobile-touch-target" onClick={() => setLocation('/messages')}>
            <MessageCircle className="!w-[20px] !h-[20px] text-gray-600 dark:text-gray-300" />
            {messagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-fit-blue rounded-full text-xs text-white flex items-center justify-center">
                {messagesCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
