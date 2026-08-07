import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { ChatDetails } from '@/components/chat/ChatDetails';
import { useChat } from '@/hooks/useChat';
import { PermissionsModal } from '@/components/shared/PermissionsModal';

export function ChatPage() {
  const { activeConversation } = useChat();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showPermissions, setShowPermissions] = useState(() => {
    const prompted = localStorage.getItem('permissions_prompted');
    return !prompted;
  });

  const toggleDetails = () => setDetailsOpen(!detailsOpen);

  const handleClosePermissions = () => {
    localStorage.setItem('permissions_prompted', 'true');
    setShowPermissions(false);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-zinc-800 flex flex-col transition-all h-[100dvh] shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <ConversationList />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-zinc-900 transition-all h-[100dvh] min-w-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatView onToggleDetails={toggleDetails} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-center mb-4 text-emerald-500 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-zinc-300 font-semibold text-lg mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs text-zinc-500">Select a conversation or start a new chat to begin messaging.</p>
          </div>
        )}
      </div>

      {/* Right Panel - Details */}
      {detailsOpen && activeConversation && (
        <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col hidden lg:flex h-[100dvh] shrink-0">
          <ChatDetails />
        </div>
      )}

      {/* Permissions Modal after login */}
      <PermissionsModal isOpen={showPermissions} onClose={handleClosePermissions} />
    </div>
  );
}
