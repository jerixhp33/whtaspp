import { format } from 'date-fns';
import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Check, CheckCheck } from 'lucide-react';

interface Props {
  message: Message;
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: Props) {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mb-1">
             {/* Avatar would go here */}
             <div className="w-full h-full flex items-center justify-center text-xs font-medium">
               {(message.sender?.display_name || message.sender?.username || '?').charAt(0).toUpperCase()}
             </div>
          </div>
        )}
        
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && showAvatar && message.sender && (
            <span className="text-xs text-zinc-400 ml-1 mb-1">{message.sender.display_name || message.sender.username}</span>
          )}
          
          <div 
            className={`relative px-4 py-2 rounded-2xl ${
              isOwn 
                ? 'bg-emerald-600 text-white rounded-br-sm' 
                : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
            }`}
          >
            {/* Content rendering based on type */}
            <div className="break-words">
              {message.content}
            </div>
            
            <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isOwn ? 'text-emerald-200' : 'text-zinc-400'} text-[10px]`}>
              <span>{format(new Date(message.created_at), 'HH:mm')}</span>
              {isOwn && (
                message.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-400" /> :
                message.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
                <Check className="w-3 h-3" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
