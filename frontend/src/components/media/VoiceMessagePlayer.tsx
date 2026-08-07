import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export function VoiceMessagePlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState('0:00');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => { setIsPlaying(false); setProgress(0); };
    const handleLoadedMetadata = () => {
      const mins = Math.floor(audio.duration / 60);
      const secs = Math.floor(audio.duration % 60);
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-3 w-64 bg-zinc-900/50 p-2 rounded-xl">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-1" />}
      </button>
      
      <div className="flex-1 flex flex-col justify-center">
        {/* Simple waveform mock */}
        <div className="h-6 flex items-center gap-0.5 w-full cursor-pointer" onClick={(e) => {
          if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * audioRef.current.duration;
          }
        }}>
          {[...Array(30)].map((_, i) => {
            const isPlayed = (i / 30) * 100 < progress;
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-full ${isPlayed ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                style={{ height: `${20 + Math.random() * 80}%` }}
              />
            );
          })}
        </div>
        <div className="text-[10px] text-zinc-400 mt-1">{duration}</div>
      </div>
      
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
