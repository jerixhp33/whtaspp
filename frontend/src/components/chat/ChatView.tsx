import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useChat } from '@/hooks/useChat';

export function ChatView({ onToggleDetails }: { onToggleDetails?: () => void }) {
  const { activeConversation } = useChat();

  if (!activeConversation) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950 w-full relative">
      <ChatHeader onToggleDetails={onToggleDetails} />
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <MessageComposer />
      </div>
    </div>
  );
}
