import {
  MessageSquare, AtSign, Phone, PhoneMissed, UserPlus, Users,
  Bell, Heart, Reply, Forward, ShieldAlert, UserMinus, Crown, CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Notification, NotificationType } from '@/types';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'mention': return <AtSign className="h-5 w-5 text-purple-500" />;
    case 'reply': return <Reply className="h-5 w-5 text-cyan-500" />;
    case 'reaction': return <Heart className="h-5 w-5 text-pink-500" />;
    case 'forward': return <Forward className="h-5 w-5 text-teal-500" />;
    case 'contact_request': return <UserPlus className="h-5 w-5 text-amber-500" />;
    case 'contact_accepted': return <UserPlus className="h-5 w-5 text-emerald-500" />;
    case 'call_incoming': return <Phone className="h-5 w-5 text-emerald-500" />;
    case 'call_missed': return <PhoneMissed className="h-5 w-5 text-red-500" />;
    case 'group_invite': return <Users className="h-5 w-5 text-indigo-500" />;
    case 'group_added': return <Users className="h-5 w-5 text-indigo-500" />;
    case 'group_removed': return <UserMinus className="h-5 w-5 text-red-500" />;
    case 'group_admin': return <Crown className="h-5 w-5 text-amber-500" />;
    case 'system':
    default: return <Bell className="h-5 w-5 text-zinc-400" />;
  }
};

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

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onLoadMore,
  hasMore,
  loading,
}) => {
  if (!loading && notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="When you get new messages, calls, or mentions, they will show up here."
      />
    );
  }

  // Group by date
  const grouped = notifications.reduce((acc, curr) => {
    const group = getDateGroup(curr.created_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, Notification[]>);

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-zinc-100">Notifications</h2>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(grouped).map(([date, notifs]) => (
          <div key={date} className="mb-4">
            <h3 className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 bg-zinc-950/90 backdrop-blur">
              {date}
            </h3>
            <div className="space-y-0.5">
              {notifs.map((notif) => {
                const avatarUrl = notif.metadata?.avatar_url;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) onMarkAsRead(notif.id);
                      onNotificationClick(notif);
                    }}
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-colors',
                      notif.is_read ? 'hover:bg-zinc-900' : 'bg-emerald-900/10 hover:bg-emerald-900/20'
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="bg-zinc-800 p-2 rounded-full">{getIcon(notif.type)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        notif.is_read ? 'text-zinc-200' : 'text-zinc-100'
                      )}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">{notif.body}</p>
                      )}
                      <p className="text-xs text-zinc-600 mt-1.5">
                        {formatTimeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {loading && (
          <div className="p-6 text-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
          </div>
        )}

        {onLoadMore && hasMore && !loading && (
          <button
            onClick={onLoadMore}
            className="w-full p-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Load more notifications
          </button>
        )}
      </div>
    </div>
  );
};
