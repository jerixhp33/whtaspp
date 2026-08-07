import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/50 mb-6">
        <Icon className="h-10 w-10 text-zinc-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-zinc-100">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-400">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {action.text}
        </Button>
      )}
    </div>
  );
};
