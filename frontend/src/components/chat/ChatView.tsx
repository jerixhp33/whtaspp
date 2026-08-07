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
    <div className="flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 z-20">
        <ChatHeader onToggleDetails={onToggleDetails} />
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative z-10">
        <MessageList onReply={(msg) => setReplyMessage(msg)} />
      </div>

      {/* Fixed Bottom Composer */}
      <div className="flex-shrink-0 p-2.5 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur z-20 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <MessageComposer 
          replyMessage={replyMessage} 
          onClearReply={() => setReplyMessage(null)} 
        />
      </div>
    </div>
  );
}
