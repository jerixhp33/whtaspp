import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Download, AlertCircle } from 'lucide-react';
import { mediaService } from '@/services/media.service';

interface Props {
  src: string;
  fileName?: string;
  onOpenFullscreen?: () => void;
}

export function VideoPlayer({ src, fileName, onOpenFullscreen }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isOfflineUnavailable, setIsOfflineUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    mediaService.getSignedUrl(src, 'media').then((url) => {
      if (!active) return;
      if (!url) {
        if (!navigator.onLine) setIsOfflineUnavailable(true);
      } else {
        setResolvedUrl(url);
      }
    });

    return () => {
      active = false;
    };
  }, [src]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediaService.downloadMedia(src, fileName, 'video');
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isOfflineUnavailable) {
    return (
      <div className="flex items-center gap-2 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-400 max-w-sm">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <span>Connect to the internet to view this video.</span>
      </div>
    );
  }

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-black max-w-sm border border-zinc-800 shadow-md my-1 select-none">
      <video
        ref={videoRef}
        src={resolvedUrl || src}
        className="w-full max-h-72 object-cover cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Control Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
        {/* Seekbar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            if (videoRef.current && duration) {
              videoRef.current.currentTime = pct * duration;
            }
          }}
          className="w-full h-1.5 bg-zinc-700/80 rounded-full cursor-pointer relative"
        >
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1 hover:text-emerald-400 transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-emerald-400 transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="text-[10px] text-zinc-300 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              aria-label="Download video"
              className="p-1 text-zinc-300 hover:text-white transition-colors"
              title="Download video"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenFullscreen || (() => videoRef.current?.requestFullscreen())}
              aria-label="Fullscreen"
              className="p-1 text-zinc-300 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 hover:bg-emerald-600 p-3.5 rounded-full text-white backdrop-blur transition-all active:scale-95 shadow-xl"
        >
          <Play className="h-6 w-6 ml-0.5" />
        </button>
      )}
    </div>
  );
}
