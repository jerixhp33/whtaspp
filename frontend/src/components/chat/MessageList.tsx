import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';

export function MessageList() {
  const { activeConversation } = useChat();
  const { messages } = useMessages(activeConversation?.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col h-full bg-[url('/chat-pattern-dark.png')] bg-repeat">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
            <span className="text-2xl">👋</span>
          </div>
          <p>No messages here yet...</p>
          <p className="text-sm">Send a message to start the conversation.</p>
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
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
