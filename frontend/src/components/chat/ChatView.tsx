import { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { useChat } from '@/hooks/useChat';
import { Message, Profile } from '@/types';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CallView } from '@/components/calls/CallView';
import { IncomingCallDialog } from '@/components/calls/IncomingCallDialog';

export function ChatView({ onToggleDetails }: { onToggleDetails?: () => void }) {
  const { activeConversation } = useChat();
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  
  const {
    localStream,
    remoteStream,
    callStatus,
    isVideoCall,
    remoteUser,
    callDuration,
    isMuted,
    isCameraOff,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useWebRTC();

  if (!activeConversation) return null;

  const handleStartCall = (targetUser: Profile, isVideo: boolean) => {
    startCall(
      {
        id: targetUser.id,
        name: targetUser.display_name || targetUser.username || 'Chat User',
        avatarUrl: targetUser.avatar_url
      },
      activeConversation.id,
      isVideo
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 z-20">
        <ChatHeader
          onToggleDetails={onToggleDetails}
          onStartCall={handleStartCall}
        />
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

      {/* Incoming Call Dialog */}
      {incomingCall && (
        <IncomingCallDialog
          caller={incomingCall.caller}
          isVideoCall={incomingCall.isVideo}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Active WebRTC Voice/Video Call Interface */}
      {callStatus !== 'idle' && remoteUser && (
        <CallView
          remoteUser={remoteUser}
          isVideoCall={isVideoCall}
          duration={callDuration}
          status={callStatus === 'calling' ? 'ringing' : 'connected'}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={endCall}
          onMinimize={endCall}
        />
      )}
    </div>
  );
}
