import { Search, Plus, Users, Shield, Settings, LogOut, MessageSquarePlus, UserPlus, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { NewChatDialog } from './NewChatDialog';
import { CreateGroupDialog } from '../groups/CreateGroupDialog';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { InAppToastContainer, showToast } from '@/components/notifications/InAppToast';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types';

export function ConversationList() {
  const { conversations, activeConversation, setActiveConversation } = useChat();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'private' | 'groups'>('all');
  const [search, setSearch] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleNewNotification = useCallback((notification: Notification) => {
    // Show in-app toast
    showToast(notification);
    // Play notification sound (respect user settings)
    notificationService.playNotificationSound();
    // Send browser notification if app is not focused
    if (document.hidden) {
      notificationService.sendBrowserNotification(
        notification.title,
        notification.body,
        notification.metadata
      );
    }
  }, []);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadMore,
    hasMore,
    loading: notifLoading,
  } = useNotifications(
    user?.id,
    activeConversation?.id,
    handleNewNotification
  );

  const handleSignOut = async () => {
    // Unregister push device on logout
    if (user?.id) {
      const deviceId = notificationService.getDeviceId();
      await notificationService.unregisterDevice(user.id, deviceId);
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);

    if (notif.conversation_id) {
      const conv = conversations.find((c) => c.id === notif.conversation_id);
      if (conv) {
        setActiveConversation(conv);
        // Deep link to message
        if (notif.message_id) {
          setTimeout(() => {
            const el = document.getElementById(`message-${notif.message_id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('notification-target-highlight');
              setTimeout(() => el.classList.remove('notification-target-highlight'), 5000);
            }
          }, 500);
        }
      }
    } else if (notif.type === 'contact_request' || notif.type === 'contact_accepted') {
      navigate('/contacts');
    }
  };

  const filteredConversations = conversations.filter(c => {
    const isGroup = c.type === 'group';
    if (filter === 'private' && isGroup) return false;
    if (filter === 'groups' && !isGroup) return false;
    
    const members = c.members || (c as any).conversation_members || [];
    const otherMemberObj = members.find((m: any) => m.user_id !== user?.id);
    const otherMember = otherMemberObj?.profiles || otherMemberObj?.profile;
    const name = isGroup ? c.group?.name : (otherMember?.display_name || otherMember?.username || 'Chat User');
    
    if (search && !name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white tracking-tight">Chats</h2>
            {profile?.is_admin && (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              title="New Message / Search Users"
              onClick={() => setIsNewChatOpen(true)}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-zinc-400 hover:text-white"
              title="Create Group"
              onClick={() => setIsCreateGroupOpen(true)}
            >
              <Users className="h-5 w-5" />
            </Button>
            {profile?.is_admin && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                title="Admin Dashboard"
                onClick={() => navigate('/admin')}
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}
            {/* Notification Bell */}
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                title="Notifications"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell className="h-5 w-5" />
                <NotificationBadge count={unreadCount} />
              </Button>
              <NotificationDropdown
                isOpen={isNotifOpen}
                notifications={notifications}
                onViewAll={() => {
                  setIsNotifOpen(false);
                  navigate('/notifications');
                }}
                onMarkAllAsRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
                onClose={() => setIsNotifOpen(false)}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={notifLoading}
              />
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-zinc-400 hover:text-white"
              title="Settings"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              title="Sign Out"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search messages or people..." 
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 mt-4">
          <button 
            className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setFilter('all')}
          >All</button>
          <button 
            className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'private' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setFilter('private')}
          >Private</button>
          <button 
            className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'groups' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setFilter('groups')}
          >Groups</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map(conv => (
          <ConversationItem 
            key={conv.id} 
            conversation={conv} 
            isActive={activeConversation?.id === conv.id}
            onClick={() => setActiveConversation(conv)}
          />
        ))}
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-zinc-400 text-sm mb-4">No conversations found</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button 
                onClick={() => setIsNewChatOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm gap-2"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Start New Chat
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsCreateGroupOpen(true)}
                className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm gap-2"
              >
                <Users className="h-4 w-4" />
                Create Group
              </Button>
            </div>
          </div>
        )}
      </div>

      <NewChatDialog isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <CreateGroupDialog isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />

      {/* In-App Toast Container (Portal) */}
      <InAppToastContainer onToastClick={handleNotificationClick} />
    </div>
  );
}
