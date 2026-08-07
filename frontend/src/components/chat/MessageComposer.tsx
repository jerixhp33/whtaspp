import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/message.service';
import { Message } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  replyMessage?: Message | null;
  onClearReply?: () => void;
}

export function MessageComposer({ replyMessage, onClearReply }: Props) {
  const [text, setText] = useState('');
  const { activeConversation, sendTypingSignal } = useChat();
  const { user } = useAuth();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    if (activeConversation) {
      sendTypingSignal(activeConversation.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTypingSignal(activeConversation.id, false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConversation || !user) return;
    
    const messageContent = text.trim();
    setText('');
    if (onClearReply) onClearReply();

    if (activeConversation) {
      sendTypingSignal(activeConversation.id, false);
    }

    try {
      const payload: any = {
        content: messageContent,
        message_type: 'text',
        conversation_id: activeConversation.id,
        sender_id: user.id,
      };

      if (replyMessage?.id) {
        payload.reply_to_id = replyMessage.id;
      }

      await messageService.sendMessage(payload);

      // Update conversations last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeConversation.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
      {/* Reply Quote Preview */}
      {replyMessage && (
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/80 border-l-4 border-l-emerald-500 rounded-lg text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-emerald-400 block truncate">
                Replying to {replyMessage.sender?.display_name || replyMessage.sender?.username || 'User'}
              </span>
              <span className="text-zinc-400 block truncate">{replyMessage.content}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClearReply} className="h-6 w-6 text-zinc-400 hover:text-white shrink-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white shrink-0 mb-0.5">
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2 text-zinc-100 placeholder-zinc-500 text-sm"
            rows={1}
          />
        </div>

        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white shrink-0 mb-0.5">
          <Smile className="h-5 w-5" />
        </Button>
        
        {text.trim() ? (
          <Button 
            size="icon" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 mb-0.5 rounded-full"
            onClick={handleSend}
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        ) : (
          <Button 
            size="icon" 
            className="bg-zinc-800 hover:bg-zinc-700 text-white shrink-0 mb-0.5 rounded-full"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
