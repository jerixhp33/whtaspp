import { useEffect, useRef, useState, UIEvent } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { supabase } from '@/lib/supabase';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onReply?: (msg: Message) => void;
}

export function MessageList({ onReply }: Props) {
  const { activeConversation } = useChat();
  const { user } = useAuth();
  const { messages } = useMessages(activeConversation?.id);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowScrollBottomBtn(false);
    setUnreadCount(0);
  };

  // Scroll listener to detect when user has scrolled up
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    if (distanceFromBottom > 150) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
      setUnreadCount(0);
    }
  };

  // Handle auto-scroll logic on messages change
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isInitialLoad = prevMessagesLengthRef.current === 0;
    const newMsgCount = messages.length - prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isInitialLoad) {
      scrollToBottom('auto');
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    // If user is near bottom (< 150px) or the user sent the last message, scroll down automatically
    const lastMsg = messages[messages.length - 1];
    const isOwnLastMsg = lastMsg?.sender_id === user?.id;

    if (distanceFromBottom < 150 || isOwnLastMsg) {
      scrollToBottom('smooth');
    } else if (newMsgCount > 0) {
      setShowScrollBottomBtn(true);
      setUnreadCount(prev => prev + newMsgCount);
    }
  }, [messages, user?.id]);

  // Reset scroll on active conversation change
  useEffect(() => {
    prevMessagesLengthRef.current = 0;
    setShowScrollBottomBtn(false);
    setUnreadCount(0);
    scrollToBottom('auto');
  }, [activeConversation?.id]);

  // Mark unread messages as read in database
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
    <div className="relative flex-1 min-h-0 h-full w-full bg-zinc-950 overflow-hidden flex flex-col">
      {/* Scrollable Messages Area */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 flex flex-col"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2 shadow-inner">
              <span className="text-3xl">👋</span>
            </div>
            <p className="font-semibold text-zinc-300">No messages here yet</p>
            <p className="text-xs text-zinc-500">Send a message or attachment to start chatting!</p>
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

      {/* Floating "↓ New messages" pill button */}
      {showScrollBottomBtn && (
        <div className="absolute bottom-4 right-4 z-20 animate-bounce">
          <Button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border border-emerald-400/30"
          >
            <ArrowDown className="h-4 w-4" />
            <span>New messages</span>
            {unreadCount > 0 && (
              <span className="bg-white text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-0.5">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
