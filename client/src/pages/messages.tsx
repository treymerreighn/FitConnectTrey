import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function Messages() {
  const [loading, setLoading] = useState(true);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [creating, setCreating] = useState(false);

  // Dev users to quickly start conversations with in development mode
  const DEV_USERS = [
    { id: "user1", name: "Sarah Mitchell", avatar: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop&crop=face" },
    { id: "user2", name: "Mike Rodriguez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" },
    { id: "user3", name: "Emma Thompson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" },
    { id: "user4", name: "Jessica Chen", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face" }
  ];
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    apiRequest("/api/conversations")
      .then((data) => setConvs(data || []))
      .catch(() => setConvs([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch users to display participant names/avatars
  const [users, setUsers] = useState<Record<string, { id: string; name: string; avatar?: string }>>({});
  const currentUserId = "user1"; // dev default current user

  useEffect(() => {
    apiRequest("/api/users")
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, { id: string; name: string; avatar?: string }> = {};
        for (const u of data) {
          map[u.id] = { id: u.id, name: u.fullName || u.name || u.username || `User ${u.id}`, avatar: u.avatar || u.avatarUrl };
        }
        // Ensure dev users are present as fallback
        for (const d of DEV_USERS) {
          if (!map[d.id]) map[d.id] = { id: d.id, name: d.name, avatar: d.avatar };
        }
        setUsers(map);
      })
      .catch(() => {
        const map: Record<string, { id: string; name: string; avatar?: string }> = {};
        for (const d of DEV_USERS) map[d.id] = { id: d.id, name: d.name, avatar: d.avatar };
        setUsers(map);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    apiRequest(`/api/conversations/${selected.id}/messages`)
      .then((data) => setMessages(data || []))
      .catch(() => setMessages([]));
  }, [selected]);

  async function send() {
    if (!selected || !newMsg.trim()) return;
    const m = await apiRequest(`/api/conversations/${selected.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ senderId: "dev-user", content: newMsg }),
    });
    setMessages((s) => [...s, m]);
    setNewMsg("");
  }

  async function startConversationWith(userId: string) {
    setCreating(true);
    try {
      // assume current dev user is 'user1' for demos; server will accept any participants
      const participants = ["user1", userId];
      const conv = await apiRequest("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ participants }),
      });

      // prepend to convs and select
      setConvs((s) => [conv, ...(s || [])]);
      setSelected(conv);

      // fetch messages for the new conversation (likely empty)
      const msgs = await apiRequest(`/api/conversations/${conv.id}/messages`);
      setMessages(msgs || []);
    } catch (e) {
      console.error("Failed to create conversation", e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 px-4">
      <header className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-fit-blue rounded-lg flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            {/* Dev quick-start: create conversation with seeded users */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">Start a chat (dev):</div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search friends..."
                  className="input flex-1"
                />
                <Button onClick={() => setSearchTerm("")}>Clear</Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {DEV_USERS.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                  <button
                    key={u.id}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
                    onClick={() => startConversationWith(u.id)}
                    disabled={creating}
                  >
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" />
                    <span>{u.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div>Loading…</div>
            ) : convs.length === 0 ? (
              <div className="text-sm text-gray-700 dark:text-gray-200">No conversations yet.</div>
            ) : (
              convs.map((c) => {
                const others = c.participants.filter(p => p !== currentUserId);
                const otherId = others[0] || c.participants[0];
                const user = users[otherId];
                return (
                  <div key={c.id} className={`p-3 rounded cursor-pointer ${selected?.id === c.id ? "bg-gray-100 dark:bg-gray-700" : ""}`} onClick={() => setSelected(c)}>
                    <div className="flex items-center gap-3">
                      <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full bg-gray-200" />
                      <div>
                        <div className="font-medium">{user?.name || otherId}</div>
                        <div className="text-xs text-gray-500">{c.participants.length > 1 ? `${c.participants.length} participants` : '1 participant'}</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">{new Date(c.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 min-h-[300px] flex flex-col">
            {!selected ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Select a conversation to view messages.</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {messages.map((m) => (
                    <div key={m.id} className="p-2 rounded bg-gray-50 dark:bg-gray-700">
                      <div className="text-xs text-gray-500">{m.senderId} • {new Date(m.createdAt).toLocaleString()}</div>
                      <div className="mt-1">{m.content}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} className="flex-1 input" placeholder="Write a message…" />
                  <Button onClick={send}>Send</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <Button variant="ghost" onClick={() => window.history.back()}>Go back</Button>
      </div>
    </div>
  );
}
