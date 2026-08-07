import { useState, useRef, useEffect } from 'react';
import {
  Bell, MessageSquare, AtSign, PhoneMissed, Phone, UserPlus, Users,
  Heart, X, Video, Reply, Forward, ShieldAlert, UserMinus, Crown, Check, CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onViewAll: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notif: Notification) => void;
  isOpen: boolean;
  onClose?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

type FilterTab = 'all' | 'unread' | 'mentions' | 'calls';

function getIcon(type: NotificationType) {
  switch (type) {
    case 'message': return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case 'mention': return <AtSign className="h-4 w-4 text-purple-400" />;
    case 'reply': return <Reply className="h-4 w-4 text-cyan-400" />;
    case 'reaction': return <Heart className="h-4 w-4 text-pink-400" />;
    case 'forward': return <Forward className="h-4 w-4 text-teal-400" />;
    case 'contact_request': return <UserPlus className="h-4 w-4 text-amber-400" />;
    case 'contact_accepted': return <UserPlus className="h-4 w-4 text-emerald-400" />;
    case 'call_incoming': return <Phone className="h-4 w-4 text-emerald-400" />;
    case 'call_missed': return <PhoneMissed className="h-4 w-4 text-red-400" />;
    case 'group_invite': return <Users className="h-4 w-4 text-indigo-400" />;
    case 'group_added': return <Users className="h-4 w-4 text-indigo-400" />;
    case 'group_removed': return <UserMinus className="h-4 w-4 text-red-400" />;
    case 'group_admin': return <Crown className="h-4 w-4 text-amber-400" />;
    case 'system': return <ShieldAlert className="h-4 w-4 text-zinc-400" />;
    default: return <Bell className="h-4 w-4 text-zinc-400" />;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function filterNotifications(notifications: Notification[], tab: FilterTab): Notification[] {
  switch (tab) {
    case 'unread': return notifications.filter((n) => !n.is_read);
    case 'mentions': return notifications.filter((n) => n.type === 'mention');
    case 'calls': return notifications.filter((n) => n.type === 'call_incoming' || n.type === 'call_missed');
    default: return notifications;
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onViewAll,
  onMarkAllAsRead,
  onNotificationClick,
  isOpen,
  onClose,
  onLoadMore,
  hasMore,
  loading,
}) => {
  const [tab, setTab] = useState<FilterTab>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Scroll pagination
  const handleScroll = () => {
    if (!scrollRef.current || !onLoadMore || !hasMore || loading) return;
    const el = scrollRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      onLoadMore();
    }
  };

  if (!isOpen) return null;

  const filtered = filterNotifications(notifications, tab);
  const hasUnread = notifications.some((n) => !n.is_read);
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'mentions', label: 'Mentions' },
    { key: 'calls', label: 'Calls' },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/90 backdrop-blur">
        <h3 className="font-semibold text-zinc-100">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-medium text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-zinc-800/50 bg-zinc-900/50 px-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors',
              tab === t.key
                ? 'text-emerald-400 border-emerald-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-96 overflow-y-auto"
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400">No notifications</p>
            <p className="text-xs text-zinc-600 mt-1">
              {tab === 'all' ? "You're all caught up!" : `No ${tab} notifications`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((notif) => {
              const avatarUrl = notif.metadata?.avatar_url;
              const senderName = notif.metadata?.sender_name || notif.metadata?.actor_name;

              return (
                <button
                  key={notif.id}
                  onClick={() => onNotificationClick(notif)}
                  className={cn(
                    'flex items-start gap-3 border-b border-zinc-800/30 p-3.5 text-left transition-colors hover:bg-zinc-800/50',
                    !notif.is_read && 'bg-emerald-950/10'
                  )}
                >
                  {/* Avatar or icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        {getIcon(notif.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p
                      className={cn(
                        'text-sm leading-tight',
                        notif.is_read ? 'text-zinc-300' : 'text-zinc-100 font-medium'
                      )}
                    >
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-zinc-500 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[10px] text-zinc-600">
                      {formatTimeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
            {loading && (
              <div className="p-4 text-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-2 bg-zinc-900">
        <Button
          variant="ghost"
          className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs"
          onClick={onViewAll}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
};
