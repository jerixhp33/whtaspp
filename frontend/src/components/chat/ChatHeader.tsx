import { useState } from 'react';
import { ArrowLeft, Phone, Video, Info, MoreVertical, Search, Bell, Ban, ShieldAlert, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface ChatHeaderProps {
  onToggleDetails?: () => void;
  onStartCall?: (targetUser: Profile, isVideo: boolean) => void;
  onSearchChat?: () => void;
}

export function ChatHeader({ onToggleDetails, onStartCall, onSearchChat }: ChatHeaderProps) {
  const { activeConversation, setActiveConversation, onlineUserIds, typingUsernames, setConversations } = useChat();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Bug 4: Persist mute state to localStorage per conversation
  const [isMuted, setIsMuted] = useState(() => {
    if (!activeConversation) return false;
    return localStorage.getItem(`chatflow_muted_${activeConversation.id}`) === 'true';
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (activeConversation) {
        localStorage.setItem(`chatflow_muted_${activeConversation.id}`, next.toString());
      }
      return next;
    });
    setIsMenuOpen(false);
  };
  
  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const members = activeConversation.members || (activeConversation as any).conversation_members || [];
  const otherMemberObj = members.find((m: any) => m.user_id !== user?.id);
  const otherMember: Profile | undefined = otherMemberObj?.profiles || otherMemberObj?.profile;
  
  const name = isGroup 
    ? activeConversation.group?.name 
    : (otherMember?.display_name || otherMember?.username || 'Chat User');
    
  const avatarUrl = isGroup ? activeConversation.group?.avatar_url : otherMember?.avatar_url;
  const isOnline = isGroup ? false : (otherMember?.id ? onlineUserIds.has(otherMember.id) || otherMember?.is_online : false);
  const isTyping = typingUsernames[activeConversation.id];

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all messages in this chat?')) return;
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', activeConversation.id);
      
      // Bug 8: Clear messages locally
      window.dispatchEvent(new CustomEvent(`chatflow_clear_chat_${activeConversation.id}`));
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleBlockUser = async () => {
    if (!otherMember || !user) return;
    if (!confirm(`Block ${name}? You will no longer receive messages or calls from them.`)) return;
    try {
      await supabase
        .from('blocked_users')
        .insert({ user_id: user.id, blocked_user_id: otherMember.id });
      alert(`${name} has been blocked.`);
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const handleReportUser = async () => {
    if (!otherMember || !user) return;
    const reason = prompt(`Report ${name} for inappropriate behavior:`, 'Spam or harassment');
    if (!reason) return;
    try {
      await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: otherMember.id,
          conversation_id: activeConversation.id,
          reason,
          description: `User reported via chat header menu: ${reason}`
        });
      alert('Report submitted successfully. Thank you for keeping ChatFlow safe.');
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Failed to report user:', err);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-10 relative">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-zinc-400"
          onClick={() => setActiveConversation(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative cursor-pointer" onClick={onToggleDetails}>
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
        
        <div className="cursor-pointer min-w-0" onClick={onToggleDetails}>
          <h2 className="font-medium text-zinc-100 truncate">{name}</h2>
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
        {otherMember && onStartCall && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStartCall(otherMember, false)}
              className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
              title="Voice Call"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStartCall(otherMember, true)}
              className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
              title="Video Call"
            >
              <Video className="h-5 w-5" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={onToggleDetails}
          title="Conversation Details"
        >
          <Info className="h-5 w-5" />
        </Button>
        
        {/* Three Dot Options Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Options Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1 text-sm text-zinc-200 animate-in fade-in zoom-in-95">
              {onSearchChat && (
                <button
                  onClick={() => { onSearchChat(); setIsMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2.5"
                >
                  <Search className="h-4 w-4 text-zinc-400" />
                  <span>Search Chat</span>
                </button>
              )}
              <button
                onClick={toggleMute}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors flex items-center gap-3 text-zinc-300"
              >
                <Bell className="h-4 w-4 text-zinc-400" />
                <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>
              <button
                onClick={handleClearChat}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2.5 text-amber-400"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Chat</span>
              </button>

              {!isGroup && otherMember && (
                <>
                  <div className="border-t border-zinc-800/80 my-1" />
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-3 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2.5"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Block User</span>
                  </button>
                  <button
                    onClick={handleReportUser}
                    className="w-full px-3 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2.5"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Report User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
