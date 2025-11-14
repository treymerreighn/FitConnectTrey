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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 px-4">
      <header className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-fit-green rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-200">You don't have any notifications yet.</p>
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-start">
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
  );
}
