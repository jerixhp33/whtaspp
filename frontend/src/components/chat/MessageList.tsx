import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  onReply?: (msg: Message) => void;
}

export function MessageList({ onReply }: Props) {
  const { activeConversation } = useChat();
  const { user } = useAuth();
  const { messages } = useMessages(activeConversation?.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!activeConversation?.id || !user?.id || messages.length === 0) return;

    const unreadFromOthers = messages.filter(
      m => m.sender_id !== user.id && (!m.reads || !m.reads.some(r => r.user_id === user.id))
    );

    if (unreadFromOthers.length > 0) {
      const readInserts = unreadFromOthers.map(m => ({
        message_id: m.id,
        user_id: user.id,
      }));

      supabase.from('message_reads').upsert(readInserts, { onConflict: 'message_id,user_id' }).then();
    }
  }, [messages, activeConversation?.id, user?.id]);

  if (!activeConversation) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col h-full bg-zinc-950">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
            <span className="text-2xl">👋</span>
          </div>
          <p className="font-medium text-zinc-300">No messages here yet</p>
          <p className="text-xs text-zinc-500">Send a message to start chatting in real-time!</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            showAvatar={
              idx === messages.length - 1 || 
              messages[idx + 1].sender_id !== msg.sender_id
            }
            onReply={onReply}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
