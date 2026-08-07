import { useState } from 'react';
import { Paperclip, Smile, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/message.service';

export function MessageComposer() {
  const [text, setText] = useState('');
  const { activeConversation } = useChat();
  const { user } = useAuth();

  const handleSend = () => {
    if (!text.trim() || !activeConversation || !user) return;
    messageService.sendMessage({
      content: text,
      message_type: 'text',
      conversation_id: activeConversation.id,
      sender_id: user.id
    });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
      <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white shrink-0 mb-0.5">
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2.5 text-zinc-100 placeholder-zinc-500"
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
          <Send className="h-4 w-4 ml-1" />
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
  );
}
