import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { OnlineIndicator } from './OnlineIndicator';

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-20 h-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null;
  name: string;
  isOnline?: boolean;
  className?: string;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size,
  isOnline,
  className,
}) => {
  return (
    <div className="relative inline-block">
      <div className={cn(avatarVariants({ size }), className, !src && getAvatarColor(name))}>
        {src ? (
          <img
            src={src}
            alt={name}
            className="aspect-square h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-medium text-white",
            src ? "hidden" : ""
          )}
        >
          {getInitials(name)}
        </span>
      </div>
      {isOnline !== undefined && (
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
          <OnlineIndicator isOnline={isOnline} />
        </div>
      )}
    </div>
  );
};
