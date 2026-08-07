import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download, AlertCircle } from 'lucide-react';
import { mediaService } from '@/services/media.service';

// Global audio manager to pause any other active voice messages when a new one starts
let activeAudioInstance: HTMLAudioElement | null = null;
let pauseCallback: (() => void) | null = null;

interface Props {
  src: string;
  durationSecs?: number;
  fileName?: string;
}

export function VoiceMessagePlayer({ src, durationSecs, fileName }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(() => {
    return (durationSecs && isFinite(durationSecs) && !isNaN(durationSecs)) ? durationSecs : 0;
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isOfflineUnavailable, setIsOfflineUnavailable] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resolve signed URL or offline cached blob URL
  useEffect(() => {
    let active = true;
    setHasError(false);
    setIsOfflineUnavailable(false);

    mediaService.getSignedUrl(src, 'voice-messages').then((url) => {
      if (!active) return;
      if (!url) {
        if (!navigator.onLine) {
          setIsOfflineUnavailable(true);
        } else {
          setHasError(true);
        }
      } else {
        setResolvedUrl(url);
      }
    });

    return () => {
      active = false;
    };
  }, [src]);

  // Audio setup
  useEffect(() => {
    if (!resolvedUrl) return;

    const audio = new Audio(resolvedUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration) && (!totalDuration || totalDuration === 0)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      if (activeAudioInstance === audio) {
        activeAudioInstance = null;
        pauseCallback = null;
      }
    };
  }, [resolvedUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (activeAudioInstance && activeAudioInstance !== audio) {
        activeAudioInstance.pause();
        if (pauseCallback) pauseCallback();
      }
      activeAudioInstance = audio;
      pauseCallback = () => setIsPlaying(false);

      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Audio play error:', err);
        setHasError(true);
      });
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration || !isFinite(totalDuration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = pct * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediaService.downloadMedia(src, fileName, 'voice');
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isOfflineUnavailable) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-400">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <span>Connect to the internet to listen to this voice message.</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Voice message unavailable</span>
      </div>
    );
  }

  const validTotal = (totalDuration && isFinite(totalDuration) && !isNaN(totalDuration)) ? totalDuration : 0;
  const progressPct = validTotal > 0 ? (currentTime / validTotal) * 100 : 0;

  const getBarHeight = (i: number) => {
    const heights = [35, 60, 85, 45, 95, 70, 40, 80, 100, 60, 75, 50, 90, 65, 40, 85, 95, 50, 70, 80, 45, 65];
    return heights[i % heights.length];
  };

  return (
    <div className="flex items-center gap-2.5 w-64 sm:w-72 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 shadow-inner my-1 select-none">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        className="w-10 h-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 ml-0.5 fill-white" />}
      </button>

      {/* Waveform Seekbar */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div
          onClick={handleSeek}
          className="h-6 flex items-center gap-0.5 w-full cursor-pointer py-1"
          title="Click to seek"
        >
          {[...Array(20)].map((_, i) => {
            const barPct = (i / 20) * 100;
            const isPlayed = barPct <= progressPct;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-emerald-400' : 'bg-zinc-700'
                }`}
                style={{ height: `${getBarHeight(i)}%` }}
              />
            );
          })}
        </div>

        {/* Time info & playback controls */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>{formatTime(isPlaying ? currentTime : validTotal)}</span>
          <div className="flex items-center gap-1.5">
            {/* Speed Toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-1.5 py-0.5 rounded-md border border-zinc-700 transition-colors"
              title="Change speed"
            >
              {playbackSpeed}x
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Download voice note"
              className="p-1 hover:text-white rounded transition-colors text-zinc-400"
              title="Download voice note"
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
