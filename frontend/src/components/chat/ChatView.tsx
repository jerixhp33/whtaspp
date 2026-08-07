import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';

export function ChatView({ onToggleDetails }: { onToggleDetails?: () => void }) {
  const { activeConversation } = useChat();
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  if (!activeConversation) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950 w-full relative">
      <ChatHeader onToggleDetails={onToggleDetails} />
      <div className="flex-1 overflow-hidden">
        <MessageList onReply={(msg) => setReplyMessage(msg)} />
      </div>
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950">
        <MessageComposer 
          replyMessage={replyMessage} 
          onClearReply={() => setReplyMessage(null)} 
        />
      </div>
    </div>
  );
}
