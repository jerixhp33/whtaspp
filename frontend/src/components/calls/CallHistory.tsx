import React from 'react';
import { Phone, PhoneMissed, Video, PhoneOutgoing, PhoneIncoming } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

// Mock Call Record Type
export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration: number; // in seconds
  timestamp: string; // ISO string
}

interface CallHistoryProps {
  calls: CallRecord[];
  onCall: (userId: string, type: 'voice' | 'video') => void;
}

const formatDuration = (seconds: number) => {
  if (seconds === 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const CallHistory: React.FC<CallHistoryProps> = ({ calls, onCall }) => {
  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Your recent voice and video calls will appear here."
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-zinc-800">
        {calls.map((call) => {
          const isMissed = call.direction === 'missed';
          
          return (
            <div key={call.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-4">
                <UserAvatar name={call.callerName} src={call.callerAvatar} />
                
                <div>
                  <h4 className={cn("font-medium", isMissed ? "text-red-500" : "text-zinc-100")}>
                    {call.callerName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                    {call.direction === 'incoming' && <PhoneIncoming className="h-3 w-3" />}
                    {call.direction === 'outgoing' && <PhoneOutgoing className="h-3 w-3" />}
                    {call.direction === 'missed' && <PhoneMissed className="h-3 w-3 text-red-500" />}
                    
                    <span>
                      {new Date(call.timestamp).toLocaleDateString()} at {new Date(call.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    
                    {call.duration > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{formatDuration(call.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onCall(call.callerId, 'voice')}
                  className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onCall(call.callerId, 'video')}
                  className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
