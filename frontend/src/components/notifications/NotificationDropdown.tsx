import React from 'react';
import { Bell, MessageSquare, PhoneMissed, AtSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Mock types
type NotificationType = 'message' | 'mention' | 'call' | 'missed_call' | 'contact_request' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  timestamp: string;
  read: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onViewAll: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notif: Notification) => void;
  isOpen: boolean;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'message': return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case 'mention': return <AtSign className="h-4 w-4 text-purple-400" />;
    case 'missed_call': return <PhoneMissed className="h-4 w-4 text-red-400" />;
    default: return <Bell className="h-4 w-4 text-zinc-400" />;
  }
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onViewAll,
  onMarkAllAsRead,
  onNotificationClick,
  isOpen
}) => {
  if (!isOpen) return null;

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/90 backdrop-blur">
        <h3 className="font-semibold text-zinc-100">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={onMarkAllAsRead}
            className="text-xs font-medium text-emerald-500 hover:text-emerald-400"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400">No new notifications</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recentNotifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => onNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 border-b border-zinc-800/50 p-4 text-left transition-colors hover:bg-zinc-800/50",
                  !notif.read && "bg-emerald-950/10"
                )}
              >
                <div className="mt-0.5 rounded-full bg-zinc-800 p-1.5 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={cn(
                    "text-sm leading-tight",
                    notif.read ? "text-zinc-300" : "text-zinc-100 font-medium"
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {/* Simplified time ago */}
                    Just now
                  </p>
                </div>
                {!notif.read && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-2 bg-zinc-900">
        <Button 
          variant="ghost" 
          className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={onViewAll}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
};
