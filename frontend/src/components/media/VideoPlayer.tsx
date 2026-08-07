import { useRef, useState } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Download } from 'lucide-react';

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden bg-black max-w-sm">
      <video 
        ref={videoRef}
        src={src} 
        className="w-full h-auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-1 bg-zinc-600 rounded-full mb-2 cursor-pointer">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="hover:text-emerald-400">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={toggleMute} className="hover:text-emerald-400">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <a href={src} download className="hover:text-emerald-400">
              <Download className="h-4 w-4" />
            </a>
            <button onClick={toggleFullscreen} className="hover:text-emerald-400">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {!isPlaying && (
        <button 
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white hover:bg-emerald-600 transition-colors"
        >
          <Play className="h-8 w-8 ml-1" />
        </button>
      )}
    </div>
  );
}
