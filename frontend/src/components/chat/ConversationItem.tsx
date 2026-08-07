import { formatDistanceToNow } from 'date-fns';
import { Image, Video, File, Mic } from 'lucide-react';
import { Conversation } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const { user } = useAuth();
  
  const renderLastMessage = () => {
    if (!conversation.last_message) return 'No messages yet';
    const msg = conversation.last_message;
    
    switch(msg.message_type) {
      case 'image': return <><Image className="inline w-3 h-3 mr-1" /> Photo</>;
      case 'video': return <><Video className="inline w-3 h-3 mr-1" /> Video</>;
      case 'document': return <><File className="inline w-3 h-3 mr-1" /> Document</>;
      case 'voice': return <><Mic className="inline w-3 h-3 mr-1" /> Voice message</>;
      default: return msg.content;
    }
  };

  const isGroup = conversation.type === 'group';
  const members = conversation.members || (conversation as any).conversation_members || [];
  const otherMemberObj = members.find((m: any) => m.user_id !== user?.id);
  const otherMember = otherMemberObj?.profiles || otherMemberObj?.profile;
  
  const name = isGroup 
    ? conversation.group?.name 
    : (otherMember?.display_name || otherMember?.username || 'Chat User');
    
  const avatarUrl = isGroup ? conversation.group?.avatar_url : otherMember?.avatar_url;
  const isOnline = isGroup ? false : otherMember?.is_online;

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-zinc-800/50
        ${isActive ? 'bg-zinc-800/80 border-l-2 border-l-emerald-500' : 'hover:bg-zinc-800/50'}`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-medium text-zinc-300">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-medium text-zinc-100 truncate">{name}</h3>
          {conversation.last_message_at && (
            <span className="text-[11px] text-zinc-500 whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-zinc-400 truncate">
            {renderLastMessage()}
          </p>
          {conversation.unread_count > 0 && (
            <span className="bg-emerald-500 text-zinc-950 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
