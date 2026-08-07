import { ArrowLeft, Phone, Video, Info, MoreVertical } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function ChatHeader({ onToggleDetails }: { onToggleDetails?: () => void }) {
  const { activeConversation, setActiveConversation, onlineUserIds, typingUsernames } = useChat();
  const { user } = useAuth();
  
  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const members = activeConversation.members || (activeConversation as any).conversation_members || [];
  const otherMemberObj = members.find((m: any) => m.user_id !== user?.id);
  const otherMember = otherMemberObj?.profiles || otherMemberObj?.profile;
  
  const name = isGroup 
    ? activeConversation.group?.name 
    : (otherMember?.display_name || otherMember?.username || 'Chat User');
    
  const avatarUrl = isGroup ? activeConversation.group?.avatar_url : otherMember?.avatar_url;
  const isOnline = isGroup ? false : (otherMember?.id ? onlineUserIds.has(otherMember.id) || otherMember?.is_online : false);
  const isTyping = typingUsernames[activeConversation.id];

  return (
    <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-10">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-zinc-400"
          onClick={() => setActiveConversation(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-medium text-zinc-200">
                {name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
          )}
        </div>
        
        <div>
          <h2 className="font-medium text-zinc-100">{name}</h2>
          <p className="text-xs">
            {isTyping ? (
              <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
            ) : isOnline ? (
              <span className="text-emerald-400">Online</span>
            ) : (
              <span className="text-zinc-500">Offline</span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={onToggleDetails}>
          <Info className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
