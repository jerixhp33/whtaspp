import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare, AtSign, PhoneMissed, Phone, UserPlus, Users,
  Heart, Bell, X, Video, Reply, Forward, ShieldAlert, UserMinus, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

const TOAST_DURATION = 5000;
const MAX_TOASTS = 3;

interface ToastItem {
  id: string;
  notification: Notification;
  visible: boolean;
}

function getNotifIcon(type: NotificationType) {
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

function getAvatarInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function InAppToastContainer({
  onToastClick,
}: {
  onToastClick?: (notification: Notification) => void;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastQueueRef = useRef<ToastItem[]>([]);

  const addToast = useCallback((notification: Notification) => {
    const id = notification.id + '_' + Date.now();
    const item: ToastItem = { id, notification, visible: false };

    setToasts((prev) => {
      const next = [item, ...prev].slice(0, MAX_TOASTS);
      return next;
    });

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
        );
      });
    });

    // Auto-dismiss
    setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  // Expose addToast via ref for external access
  useEffect(() => {
    (window as any).__chatflowShowToast = addToast;
    return () => {
      delete (window as any).__chatflowShowToast;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:w-96">
      {toasts.map((toast, idx) => {
        const n = toast.notification;
        const senderName = n.metadata?.sender_name || n.metadata?.actor_name || n.title;
        const avatarUrl = n.metadata?.avatar_url;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto cursor-pointer transition-all duration-300 ease-out',
              toast.visible
                ? 'translate-y-0 opacity-100 scale-100'
                : '-translate-y-4 opacity-0 scale-95'
            )}
            onClick={() => {
              removeToast(toast.id);
              onToastClick?.(n);
            }}
          >
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/40 p-3.5 flex items-start gap-3 hover:bg-zinc-800/95 transition-colors">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-700/50"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-zinc-700/50">
                    {getAvatarInitials(senderName)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {getNotifIcon(n.type)}
                  <span className="text-sm font-semibold text-zinc-100 truncate">
                    {n.title}
                  </span>
                </div>
                {n.body && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {n.body}
                  </p>
                )}
                <p className="text-[10px] text-zinc-600 mt-1">Just now</p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

// Utility for showing toast from anywhere
export function showToast(notification: Notification) {
  const fn = (window as any).__chatflowShowToast;
  if (fn) fn(notification);
}
