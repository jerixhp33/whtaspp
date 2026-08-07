import { useState, useMemo } from 'react';
import { Search, X, Check, Send, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Message, Conversation } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ForwardModal({ message, isOpen, onClose }: Props) {
  const { conversations } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());
  const [forwarding, setForwarding] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const name =
        c.type === 'group'
          ? c.group?.name
          : c.members?.find((m: any) => m.user_id !== user?.id)?.profile?.display_name ||
            c.members?.find((m: any) => m.user_id !== user?.id)?.profile?.username;
      return name?.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery, user?.id]);

  if (!isOpen || !message) return null;

  const toggleSelect = (id: string) => {
    setSelectedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    if (selectedConvIds.size === 0 || !user || !message) return;
    setForwarding(true);

    try {
      for (const convId of selectedConvIds) {
        const payload: any = {
          conversation_id: convId,
          sender_id: user.id,
          content: message.content,
          message_type: message.message_type,
          metadata: {
            ...message.metadata,
            is_forwarded: true,
            original_sender: message.sender?.display_name || message.sender?.username || 'User',
          },
        };

        const { data: newMsg } = await supabase.from('messages').insert(payload).select().single();

        if (newMsg && message.attachments && message.attachments.length > 0) {
          const attachment = message.attachments[0];
          await supabase.from('message_attachments').insert({
            message_id: newMsg.id,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            file_url: attachment.file_url,
          });
        }

        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', convId);
      }

      alert(`Message forwarded to ${selectedConvIds.size} chat(s)`);
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err);
      alert('Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Forward Message</h3>
            <p className="text-xs text-zinc-400 truncate max-w-[280px]">"{message.content}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isGroup = conv.type === 'group';
            const otherMember = conv.members?.find((m: any) => m.user_id !== user?.id)?.profile;
            const name = isGroup
              ? conv.group?.name || 'Group Chat'
              : otherMember?.display_name || otherMember?.username || 'Private Chat';
            const avatarUrl = isGroup ? conv.group?.avatar_url : otherMember?.avatar_url;
            const isSelected = selectedConvIds.has(conv.id);

            return (
              <div
                key={conv.id}
                onClick={() => toggleSelect(conv.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : isGroup ? (
                      <Users className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <User className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {isGroup ? `${conv.members?.length || 2} members` : 'Direct message'}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <span className="text-xs text-zinc-400 font-medium">
            {selectedConvIds.size} selected
          </span>
          <Button
            type="button"
            disabled={selectedConvIds.size === 0 || forwarding}
            onClick={handleForward}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{forwarding ? 'Forwarding...' : 'Forward'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
