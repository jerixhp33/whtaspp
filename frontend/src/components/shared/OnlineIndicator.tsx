import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3 border-2',
    lg: 'h-4 w-4 border-2'
  };

  return (
    <div className={cn("relative flex", sizeClasses[size], className)}>
      <div
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75",
          isOnline ? "bg-emerald-400 animate-ping" : "hidden"
        )}
      />
      <div
        className={cn(
          "relative inline-flex h-full w-full rounded-full border-zinc-900",
          isOnline ? "bg-emerald-500" : "bg-zinc-500"
        )}
      />
    </div>
  );
};
