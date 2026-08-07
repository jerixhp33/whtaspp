import React from 'react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { CallControls } from './CallControls';

interface CallViewProps {
  remoteUser: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  isVideoCall: boolean;
  duration: number; // in seconds
  status: 'connecting' | 'ringing' | 'connected' | 'reconnecting';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onMinimize: () => void;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const CallView: React.FC<CallViewProps> = ({
  remoteUser,
  isVideoCall,
  duration,
  status,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  onMinimize
}) => {
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-zinc-950/80 to-transparent">
        <div className="text-white drop-shadow-md">
          <h2 className="text-xl font-semibold">{remoteUser.name}</h2>
          <p className="text-sm opacity-80">
            {status === 'connected' ? formatDuration(duration) : status}
          </p>
        </div>
        <button 
          onClick={onMinimize}
          className="text-white hover:bg-white/10 p-2 rounded-full backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isVideoCall ? (
          <>
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 bg-zinc-900">
              {remoteStream ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserAvatar name={remoteUser.name} src={remoteUser.avatarUrl} size="xl" />
                </div>
              )}
            </div>

            {/* Local Video (PiP) */}
            <div className="absolute bottom-24 right-4 w-32 h-48 bg-zinc-800 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50">
              {localStream && !isCameraOff ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <UserAvatar name="You" size="md" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Voice Call View */
          <div className="flex flex-col items-center">
            <div className={`relative ${status === 'ringing' ? 'animate-pulse' : ''}`}>
              {status === 'ringing' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute inset-[-20px] rounded-full bg-emerald-500/10 animate-pulse delay-75" />
                </>
              )}
              <UserAvatar 
                name={remoteUser.name} 
                src={remoteUser.avatarUrl} 
                size="xl" 
                className="w-32 h-32 border-4 border-zinc-800 relative z-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-zinc-950 to-transparent flex justify-center">
        <CallControls 
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isVideoCall={isVideoCall}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  );
};
