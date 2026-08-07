import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

// Global audio manager to pause other active voice messages when a new one starts
let activeAudioInstance: HTMLAudioElement | null = null;

interface Props {
  src: string;
  durationSecs?: number;
}

export function VoiceMessagePlayer({ src, durationSecs }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(() => {
    return (durationSecs && isFinite(durationSecs) && !isNaN(durationSecs)) ? durationSecs : 0;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      if (activeAudioInstance === audio) activeAudioInstance = null;
    };
  }, [src, totalDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (activeAudioInstance && activeAudioInstance !== audio) {
        activeAudioInstance.pause();
      }
      activeAudioInstance = audio;
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
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

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const validTotal = (totalDuration && isFinite(totalDuration) && !isNaN(totalDuration)) ? totalDuration : 0;
  const progressPct = validTotal > 0 ? (currentTime / validTotal) * 100 : 0;

  // Generate deterministic bar heights based on index
  const getBarHeight = (i: number) => {
    const heights = [35, 60, 85, 45, 95, 70, 40, 80, 100, 60, 75, 50, 90, 65, 40, 85, 95, 50, 70, 80, 45, 65];
    return heights[i % heights.length];
  };

  return (
    <div className="flex items-center gap-3 w-64 sm:w-72 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/80 shadow-inner my-1">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-600/20 cursor-pointer"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 ml-0.5 fill-white" />}
      </button>

      {/* Waveform Seekbar */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div
          onClick={handleSeek}
          className="h-7 flex items-center gap-0.5 w-full cursor-pointer py-1"
          title="Click to seek"
        >
          {[...Array(22)].map((_, i) => {
            const barPct = (i / 22) * 100;
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

        {/* Time info */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>{formatTime(isPlaying ? currentTime : validTotal)}</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Volume2 className="h-3 w-3" />
            <span>Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
}
