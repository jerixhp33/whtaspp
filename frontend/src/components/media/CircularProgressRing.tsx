import { X, Check } from 'lucide-react';

interface Props {
  progress: number; // 0 - 100
  size?: number; // default 32
  strokeWidth?: number; // default 3
  status?: 'queued' | 'preparing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  onCancel?: () => void;
  showText?: boolean;
}

export function CircularProgressRing({
  progress,
  size = 36,
  strokeWidth = 3,
  status = 'uploading',
  onCancel,
  showText = true,
}: Props) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  if (status === 'completed' || progress >= 100) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg animate-in zoom-in-75 duration-200"
        title="Upload complete"
      >
        <Check className="h-4 w-4 stroke-[2.5]" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center select-none group"
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800/80"
          fill="transparent"
        />
        {/* Animated progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-400 transition-all duration-200 ease-out"
          fill="transparent"
        />
      </svg>

      {/* Center content: Percentage or Cancel icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center">
        {onCancel ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="w-full h-full rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
            title="Cancel upload"
          >
            <X className="h-3.5 w-3.5 group-hover:block hidden text-red-400" />
            <span className="text-[10px] font-bold text-white group-hover:hidden font-mono">
              {showText ? `${Math.round(progress)}%` : ''}
            </span>
          </button>
        ) : (
          <span className="text-[10px] font-bold text-white font-mono">
            {showText ? `${Math.round(progress)}%` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
