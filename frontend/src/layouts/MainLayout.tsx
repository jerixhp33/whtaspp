import { Outlet } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CallView } from '@/components/calls/CallView';
import { IncomingCallDialog } from '@/components/calls/IncomingCallDialog';

export const MainLayout = () => {
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
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useWebRTC();

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col fixed inset-0">
      <Outlet />

      {/* Global Incoming Call Dialog */}
      {incomingCall && (
        <IncomingCallDialog
          caller={incomingCall.caller}
          isVideoCall={incomingCall.isVideo}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Global Active Call Interface */}
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
};
