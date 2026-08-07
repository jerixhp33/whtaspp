import { useState, useEffect } from 'react';
import { X, Search, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';

export function NewChatDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { conversations, setConversations, setActiveConversation } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user?.id || '')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);

        if (!error && data) {
          setResults(data as Profile[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const handleStartChat = async (targetUser: Profile) => {
    if (!user) return;
    setStartingChatId(targetUser.id);
    try {
      // Check if private conversation already exists
      const existing = conversations.find(c => 
        c.type === 'private' && 
        c.members?.some(m => m.user_id === targetUser.id)
      );

      if (existing) {
        setActiveConversation(existing);
        onClose();
        return;
      }

      // Create new private conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'private' })
        .select()
        .single();

      if (convError || !convData) throw convError;

      // Add members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: convData.id, user_id: user.id, role: 'member' },
          { conversation_id: convData.id, user_id: targetUser.id, role: 'member' }
        ]);

      if (membersError) throw membersError;

      const fullConv: any = {
        ...convData,
        members: [
          { conversation_id: convData.id, user_id: user.id, role: 'member', profile: null },
          { conversation_id: convData.id, user_id: targetUser.id, role: 'member', profile: targetUser }
        ]
      };

      setConversations(prev => [fullConv, ...prev]);
      setActiveConversation(fullConv);
      onClose();
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setStartingChatId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Start New Conversation</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name, phone (+123...), or username..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto min-h-[250px]">
          {loading ? (
            <div className="text-center text-sm text-zinc-500 py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching users...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map(targetUser => (
                <div key={targetUser.id} className="flex items-center justify-between p-3 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl border border-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                      {targetUser.avatar_url ? (
                        <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-sm">{(targetUser.display_name || targetUser.username || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-100">{targetUser.display_name || targetUser.username}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>@{targetUser.username}</span>
                        {targetUser.phone && (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono">
                            <Phone className="h-3 w-3" />
                            {targetUser.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartChat(targetUser)}
                    disabled={startingChatId === targetUser.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {startingChatId === targetUser.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="text-center text-sm text-zinc-500 py-8">No users found matching "{query}"</div>
          ) : (
            <div className="text-center text-sm text-zinc-500 py-8">
              Type a name, phone number, or username above to find people and start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
