import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isVideoCall: boolean;
  speakerOn?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker?: () => void;
  onEndCall: () => void;
  className?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isCameraOff,
  isVideoCall,
  speakerOn = true,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onEndCall,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className={cn(
          "h-14 w-14 rounded-full border-zinc-700 transition-all",
          isMuted ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 hover:text-red-400" : "bg-zinc-800/50 text-white hover:bg-zinc-700 backdrop-blur-md"
        )}
      >
        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      {isVideoCall && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleCamera}
          className={cn(
            "h-14 w-14 rounded-full border-zinc-700 transition-all",
            isCameraOff ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 hover:text-red-400" : "bg-zinc-800/50 text-white hover:bg-zinc-700 backdrop-blur-md"
          )}
        >
          {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>
      )}

      {onToggleSpeaker && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSpeaker}
          className={cn(
            "h-14 w-14 rounded-full border-zinc-700 transition-all backdrop-blur-md",
            !speakerOn ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800/50 text-white hover:bg-zinc-700"
          )}
        >
          {!speakerOn ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
      )}

      <Button
        variant="destructive"
        size="icon"
        onClick={onEndCall}
        className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 ml-4 shadow-lg shadow-red-900/20"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};
