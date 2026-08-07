import React, { useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface IncomingCallDialogProps {
  caller: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  isVideoCall: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  caller,
  isVideoCall,
  onAccept,
  onReject
}) => {
  useEffect(() => {
    // Auto-reject after 30 seconds
    const timeout = setTimeout(() => {
      onReject();
    }, 30000);

    // Play ringtone (using a simple oscillator for demo purposes or a real Audio object)
    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      
      // Ring pattern
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      
      // Start/stop loop hack for ringing effect
      setInterval(() => {
        if(audioCtx?.state === 'running') {
            gainNode.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.1);
            gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + 1, 0.1);
        }
      }, 2000);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();

      return () => {
        clearTimeout(timeout);
        oscillator.stop();
        audioCtx?.close();
      };
    } catch (e) {
      console.error("Audio API not supported", e);
      return () => clearTimeout(timeout);
    }
  }, [onReject]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex w-80 flex-col items-center rounded-2xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800 animate-in zoom-in-95 duration-200">
        
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <UserAvatar 
            name={caller.name} 
            src={caller.avatarUrl} 
            size="xl" 
            className="w-24 h-24 relative z-10 border-4 border-zinc-900"
          />
        </div>

        <h2 className="mb-1 text-2xl font-semibold text-zinc-100">{caller.name}</h2>
        <p className="mb-8 text-sm text-zinc-400">
          Incoming {isVideoCall ? 'Video' : 'Voice'} Call...
        </p>

        <div className="flex w-full justify-center gap-8">
          <button
            onClick={onReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 hover:bg-red-700 shadow-lg shadow-red-900/20"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          
          <button
            onClick={onAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform hover:scale-105 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 animate-pulse"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
