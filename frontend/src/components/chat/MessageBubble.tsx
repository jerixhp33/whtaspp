import { format } from 'date-fns';
import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Check, CheckCheck, Reply } from 'lucide-react';

interface Props {
  message: Message;
  showAvatar?: boolean;
  onReply?: (msg: Message) => void;
}

export function MessageBubble({ message, showAvatar = true, onReply }: Props) {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  const isRead = message.reads && message.reads.length > 0;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} group relative my-1`}>
      <div className={`flex max-w-[80%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Sender Avatar */}
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden mb-1 border border-zinc-700 flex items-center justify-center">
             {message.sender?.avatar_url ? (
               <img src={message.sender.avatar_url} alt="" className="w-full h-full object-cover" />
             ) : (
               <span className="text-xs font-semibold text-zinc-200">
                 {(message.sender?.display_name || message.sender?.username || '?').charAt(0).toUpperCase()}
               </span>
             )}
          </div>
        )}
        
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0`}>
          {!isOwn && showAvatar && message.sender && (
            <span className="text-[11px] text-zinc-400 ml-1 mb-1 font-medium">
              {message.sender.display_name || message.sender.username}
            </span>
          )}
          
          <div 
            className={`relative px-3.5 py-2 rounded-2xl shadow-sm ${
              isOwn 
                ? 'bg-emerald-600 text-white rounded-br-xs' 
                : 'bg-zinc-800 text-zinc-100 rounded-bl-xs'
            }`}
          >
            {/* Reply Quote Preview if message is a reply */}
            {message.reply_to && (
              <div className={`p-2 mb-2 rounded-lg text-xs border-l-2 ${isOwn ? 'bg-emerald-700/50 border-l-white text-emerald-100' : 'bg-zinc-900 border-l-emerald-500 text-zinc-300'}`}>
                <p className="font-semibold text-[11px]">
                  {message.reply_to.sender?.display_name || message.reply_to.sender?.username || 'User'}
                </p>
                <p className="truncate opacity-90">{message.reply_to.content}</p>
              </div>
            )}

            {/* Message Content */}
            <div className="break-words text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Timestamp & Read Receipt */}
            <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isOwn ? 'text-emerald-200' : 'text-zinc-400'} text-[10px]`}>
              <span>{format(new Date(message.created_at), 'HH:mm')}</span>
              {isOwn && (
                isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Hover Action: Reply */}
        {onReply && (
          <button 
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white self-center"
            title="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
