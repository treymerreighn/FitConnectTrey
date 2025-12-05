import { useEffect, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from "@shared/schema";
import { CURRENT_USER_ID } from "@/lib/constants";

type Conversation = {
  id: string;
  participants: string[];
  lastMessage?: string | { content: string; senderId: string; createdAt: string };
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read?: boolean;
};

export default function Messages() {
  const { user: authUser } = useAuth();
  const currentUserId = (authUser as UserType | undefined)?.id || CURRENT_USER_ID;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load conversations and users on mount - runs every time component mounts
  useEffect(() => {
    console.log('[Messages] Component mounted, loading data...', { initialized });
    let mounted = true;
    let isCancelled = false;
    
    async function loadData() {
      // Prevent duplicate loads
      if (isCancelled) return;
      
      try {
        console.log('[Messages] Fetching conversations and users...');
        setLoading(true);
        setError(null);
        setInitialized(false);
        
        const [convs, allUsers] = await Promise.all([
          apiRequest("GET", "/api/conversations"),
          apiRequest("GET", "/api/users")
        ]);
        
        console.log('[Messages] Received data:', { conversations: convs?.length, users: allUsers?.length });
        console.log('[Messages] First conversation:', convs?.[0]);
        console.log('[Messages] First user:', allUsers?.[0]);
        
        if (!mounted || isCancelled) {
          console.log('[Messages] Component unmounted or cancelled, ignoring data');
          return;
        }
        
        // Ensure conversations is an array
        const validConvs = Array.isArray(convs) ? convs : [];
        const validUsers = Array.isArray(allUsers) ? allUsers : [];
        
        setConversations(validConvs);
        setUsers(validUsers);
        setInitialized(true);
        
        // Auto-select first conversation if available
        if (validConvs.length > 0) {
          console.log('[Messages] Auto-selecting first conversation:', validConvs[0]);
          setSelectedConversation(validConvs[0]);
        }
      } catch (error) {
        console.error('[Messages] Failed to load data:', error);
        if (mounted && !isCancelled) {
          setError('Failed to load conversations. Please try again.');
        }
      } finally {
        if (mounted && !isCancelled) {
          console.log('[Messages] Loading complete');
          setLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      console.log('[Messages] Component unmounting, cleaning up...');
      mounted = false;
      isCancelled = true;
    };
  }, []); // Empty deps - runs on every mount

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      console.log('[Messages] No conversation selected, clearing messages');
      setMessages([]);
      return;
    }
    
    const conversationId = selectedConversation.id;
    console.log('[Messages] Loading messages for conversation:', conversationId, 'Selected conv:', selectedConversation);
    let mounted = true;
    
    async function loadMessages() {
      try {
        setMessagesLoading(true);
        const response = await apiRequest("GET", `/api/conversations/${conversationId}/messages`);
        console.log('[Messages] Raw API response for conversation', conversationId, ':', response);
        console.log('[Messages] Response type:', typeof response, Array.isArray(response));
        
        // Ensure we have an array
        let msgs: Message[] = [];
        if (Array.isArray(response)) {
          msgs = response;
        } else if (response && typeof response === 'object') {
          // Sometimes APIs return {data: [...]} or similar
          msgs = response.data || response.messages || [];
        }
        
        console.log('[Messages] Processed messages for conversation', conversationId, ':', msgs.length, 'messages');
        
        if (mounted) {
          setMessages(msgs);
        }
      } catch (error) {
        console.error('[Messages] Failed to load messages for conversation', conversationId, ':', error);
        if (mounted) {
          setMessages([]);
        }
      } finally {
        if (mounted) {
          setMessagesLoading(false);
        }
      }
    }
    
    loadMessages();
    
    return () => {
      mounted = false;
    };
  }, [selectedConversation?.id]);

  async function send() {
    if (!selectedConversation || !newMsg.trim()) return;
    
    const conversationId = selectedConversation.id;
    const messageContent = newMsg;
    
    console.log('[Messages] Sending message to conversation:', conversationId, 'Content:', messageContent);
    
    try {
      const m = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        senderId: currentUserId,
        content: messageContent,
      });
      
      console.log('[Messages] Message sent successfully:', m);
      
      setMessages(prev => {
        console.log('[Messages] Current messages:', prev.length);
        const updated = [...prev, m];
        console.log('[Messages] Updated messages:', updated.length);
        return updated;
      });
      
      setNewMsg("");
      
      // Update conversation's last message
      setConversations(prev => prev.map(c => {
        if (c.id === conversationId) {
          console.log('[Messages] Updating conversation lastMessage for:', c.id);
          return { ...c, lastMessage: messageContent, updatedAt: new Date().toISOString() };
        }
        return c;
      }));
    } catch (error) {
      console.error('[Messages] Failed to send message:', error);
    }
  }

  async function startConversationWith(userId: string) {
    if (creating) return;
    
    console.log('[Messages] Starting conversation with user:', userId);
    setCreating(true);
    try {
      // Check if conversation already exists with this user
      const existingConv = conversations.find(c => 
        c.participants.includes(userId) && 
        c.participants.includes(currentUserId) &&
        c.participants.length === 2
      );

      if (existingConv) {
        // Select existing conversation
        console.log('[Messages] Found existing conversation:', existingConv.id);
        setSelectedConversation(existingConv);
        setShowSearch(false);
        setSearchTerm("");
        return;
      }

      // Create new conversation (only if one doesn't exist)
      console.log('[Messages] Creating new conversation with participants:', [currentUserId, userId]);
      const conv = await apiRequest("POST", "/api/conversations", { 
        participants: [currentUserId, userId] 
      });
      
      console.log('[Messages] New conversation created:', conv);

      setConversations(prev => {
        console.log('[Messages] Adding new conversation to list. Current count:', prev.length);
        return [conv, ...prev];
      });
      setSelectedConversation(conv);
      setShowSearch(false);
      setSearchTerm("");
    } catch (error) {
      console.error('[Messages] Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  }

  function selectConversation(conv: Conversation) {
    console.log('[Messages] Selecting conversation:', conv.id, 'Participants:', conv.participants);
    setSelectedConversation(conv);
  }

  const getDisplayName = (user?: UserType) => {
    if (!user) return "Unknown User";
    return user.name || user.username || user.email || `User ${user.id}`;
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getOtherUserId = (conv: Conversation) => {
    return conv.participants.find(p => p !== currentUserId) || conv.participants[0];
  };

  const getLastMessageText = (conv: Conversation): string => {
    if (!conv.lastMessage) return '';
    if (typeof conv.lastMessage === 'string') return conv.lastMessage;
    if (typeof conv.lastMessage === 'object' && conv.lastMessage.content) {
      return conv.lastMessage.content;
    }
    return '';
  };

  const availableUsers = users.filter(u => {
    if (u.id === currentUserId) return false;
    // Check if we already have a conversation with this user
    const hasConversation = conversations.some(c => 
      c.participants.includes(u.id) && 
      c.participants.includes(currentUserId) &&
      c.participants.length === 2
    );
    return !hasConversation;
  });

  const filteredUsers = availableUsers.filter(u =>
    getDisplayName(u).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex-1"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">MESSAGES</h1>
            <div className="flex-1"></div>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'hsl(217.2, 91.2%, 59.8%)', borderTopColor: 'transparent' }}></div>
            <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  // If a conversation is selected, show fullscreen chat
  if (selectedConversation) {
    const otherId = getOtherUserId(selectedConversation);
    const otherUser = getUserById(otherId);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Header with back button - extends to top of screen */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="text-gray-700 dark:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Button>
            <img 
              src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(otherUser))}`} 
              alt={getDisplayName(otherUser)} 
              className="w-10 h-10 rounded-full bg-gray-200" 
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white">{getDisplayName(otherUser)}</div>
              {lastMessage && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {lastMessage.senderId === currentUserId ? 'You: ' : ''}{String(lastMessage.content || '').substring(0, 50)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {messagesLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'hsl(217.2, 91.2%, 59.8%)', borderTopColor: 'transparent' }}></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m) => {
              // Validate message object
              if (!m || typeof m !== 'object' || !m.id) {
                console.error('[Messages] Invalid message object:', m);
                return null;
              }
              
              const isMe = m.senderId === currentUserId;
              const content = String(m.content || '');
              const timestamp = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="break-words">{content}</div>
                    <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area - fixed at bottom */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-24">
          <div className="flex items-center space-x-2">
            <Input 
              value={newMsg} 
              onChange={(e) => setNewMsg(e.target.value)} 
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              className="flex-1"
            />
            <Button onClick={send} disabled={!newMsg.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">MESSAGES</h1>
          <div className="flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="text-gray-700 dark:text-gray-300"
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search popup */}
      {showSearch && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users to chat with..."
            className="mb-3"
            autoFocus
          />

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-2">
                {searchTerm ? "No users found" : "All users have existing conversations"}
              </div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-2 rounded-lg text-left transition-colors"
                  onClick={() => startConversationWith(u.id)}
                  disabled={creating}
                >
                  <img 
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(u))}`} 
                    alt={getDisplayName(u)} 
                    className="w-10 h-10 rounded-full bg-gray-200" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">{getDisplayName(u)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username || u.id}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Conversations list */}
      {conversations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Click the search icon to find someone to chat with!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {conversations.map((conv) => {
            const otherId = getOtherUserId(conv);
            const otherUser = getUserById(otherId);
            
            return (
              <div 
                key={conv.id} 
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => selectConversation(conv)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(otherUser))}`} 
                    alt={getDisplayName(otherUser)} 
                    className="w-12 h-12 rounded-full bg-gray-200" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{getDisplayName(otherUser)}</div>
                    {getLastMessageText(conv) && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessageText(conv)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
