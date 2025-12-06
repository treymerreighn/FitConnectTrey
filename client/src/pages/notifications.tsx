import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Notification = {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Notification[]>([]);

  useEffect(() => {
    apiRequest("/api/notifications")
      .then((data) => setNotes(data || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await apiRequest("/api/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    setNotes((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header - extends to top of screen */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">NOTIFICATIONS</h1>
          <div className="flex-1"></div>
        </div>
      </header>

      <div className="px-4 pt-4">

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-200">You don't have any notifications yet.</p>
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="bg-white dark:bg-zinc-800 rounded-lg p-4 flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-800 dark:text-gray-100">{n.message}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="ml-4">
                {!n.read && (
                  <Button size="sm" onClick={() => markRead(n.id)}>Mark read</Button>
                )}
              </div>
            </div>
          ))
        )}

        <div className="text-center">
          <Button variant="ghost" onClick={() => window.history.back()}>Go back</Button>
        </div>
      </div>
      </div>
    </div>
  );
}
