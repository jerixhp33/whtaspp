import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { Message, Profile } from '@/types';
import { useWebRTC } from '@/hooks/useWebRTC';

export function ChatView({ onToggleDetails }: { onToggleDetails?: () => void }) {
  const { activeConversation } = useChat();
  const { user, profile } = useAuth();
  const messagesHook = useMessages(activeConversation?.id);
  const { sendMessage, sendMediaMessage, editMessage } = messagesHook;

  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const { startCall } = useWebRTC();

  if (!activeConversation) return null;

  const handleStartCall = (targetUser: Profile, isVideo: boolean) => {
    startCall(
      {
        id: targetUser.id,
        name: targetUser.display_name || targetUser.username || 'Chat User',
        avatarUrl: targetUser.avatar_url,
      },
      activeConversation.id,
      isVideo
    );
  };

  const handleSendMessage = (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' = 'text',
    fileAttachment?: { file_name: string; file_url: string; file_size?: number; file_type?: string },
    replyTo?: Message | null
  ) => {
    if (!user) return;
    sendMessage(content, messageType, fileAttachment, replyTo, user, profile);
  };

  const handleSendMediaMessage = (
    file: File | Blob,
    messageType: 'image' | 'video' | 'audio' | 'voice' | 'document',
    caption: string = '',
    replyTo?: Message | null,
    duration?: number
  ) => {
    if (!user) return;
    sendMediaMessage(file, messageType, caption, replyTo, user, profile, undefined, duration);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 z-20">
        <ChatHeader onToggleDetails={onToggleDetails} onStartCall={handleStartCall} />
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative z-10">
        <MessageList
          messagesHook={messagesHook}
          onReply={(msg) => {
            setEditingMessage(null);
            setReplyMessage(msg);
          }}
          onEdit={(msg) => {
            setReplyMessage(null);
            setEditingMessage(msg);
          }}
        />
      </div>

      {/* Fixed Bottom Composer */}
      <div className="flex-shrink-0 p-2.5 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur z-20 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <MessageComposer
          replyMessage={replyMessage}
          editingMessage={editingMessage}
          onClearReply={() => setReplyMessage(null)}
          onClearEdit={() => setEditingMessage(null)}
          onSendMessage={handleSendMessage}
          onSendMediaMessage={handleSendMediaMessage}
          onSaveEdit={(id, content) => editMessage(id, content)}
        />
      </div>
    </div>
  );
}
