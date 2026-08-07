import React from 'react';
import { MessageSquare, AtSign, Phone, PhoneMissed, UserPlus, Users, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

// Mock types
type NotificationType = 'message' | 'mention' | 'call' | 'missed_call' | 'contact_request' | 'group_invite' | 'group_activity' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'mention': return <AtSign className="h-5 w-5 text-purple-500" />;
    case 'call': return <Phone className="h-5 w-5 text-emerald-500" />;
    case 'missed_call': return <PhoneMissed className="h-5 w-5 text-red-500" />;
    case 'contact_request': return <UserPlus className="h-5 w-5 text-amber-500" />;
    case 'group_invite':
    case 'group_activity': return <Users className="h-5 w-5 text-indigo-500" />;
    case 'system':
    default: return <Bell className="h-5 w-5 text-zinc-400" />;
  }
};

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}) => {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="When you get new messages, calls, or mentions, they will show up here."
      />
    );
  }

  // Simple grouping by date (Today, Yesterday, Older)
  const grouped = notifications.reduce((acc, curr) => {
    // In a real app, use a library like date-fns
    const date = new Date(curr.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-zinc-100">Notifications</h2>
        <button 
          onClick={onMarkAllAsRead}
          className="text-sm text-emerald-500 hover:text-emerald-400 font-medium"
        >
          Mark all as read
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(grouped).map(([date, notifs]) => (
          <div key={date} className="mb-6">
            <h3 className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider sticky top-0 bg-zinc-950/90 backdrop-blur">
              {date}
            </h3>
            <div className="space-y-1">
              {notifs.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkAsRead(notif.id);
                    onNotificationClick(notif);
                  }}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors",
                    notif.read ? "hover:bg-zinc-900" : "bg-emerald-900/10 hover:bg-emerald-900/20"
                  )}
                >
                  <div className="mt-1 flex-shrink-0 bg-zinc-800 p-2 rounded-full">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      notif.read ? "text-zinc-200" : "text-emerald-400"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">
                      {notif.body}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
