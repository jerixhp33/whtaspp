import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { ChatDetails } from '@/components/chat/ChatDetails';
import { useChat } from '@/hooks/useChat';

export function ChatPage() {
  const { activeConversation } = useChat();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const toggleDetails = () => setDetailsOpen(!detailsOpen);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-zinc-800 flex flex-col transition-all ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <ConversationList />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-zinc-900 transition-all ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatView onToggleDetails={toggleDetails} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Right Panel - Details */}
      {detailsOpen && activeConversation && (
        <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col hidden lg:flex">
          <ChatDetails />
        </div>
      )}
    </div>
  );
}
