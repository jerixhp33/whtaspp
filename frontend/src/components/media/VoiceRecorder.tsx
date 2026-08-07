import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Send, StopCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSend: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(24).fill(15));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      stopTracksAndContext();
    };
  }, []);

  const stopTracksAndContext = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API for real-time waveform visualization
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Sample frequencies across 24 bars
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 24));
        for (let i = 0; i < 24; i++) {
          const val = dataArray[i * step] || 0;
          // Scale between 15% and 100%
          const pct = Math.min(100, Math.max(15, (val / 255) * 100 * 1.5));
          bars.push(pct);
        }
        setAudioLevels(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone permission denied or failed:', err);
      alert('Could not access microphone. Please check browser permissions.');
      onCancel();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTracksAndContext();
    }
  };

  const handleSend = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onSend(blob, duration);
        };
        mediaRecorderRef.current.stop();
      }
      stopTracksAndContext();
    } else if (audioBlob) {
      onSend(audioBlob, duration);
    }
  };

  const togglePreviewPlay = () => {
    if (!audioBlob) return;
    if (!previewAudioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.ontimeupdate = () => {
        setPreviewProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };
      previewAudioRef.current = audio;
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-zinc-900/90 border border-emerald-500/30 rounded-2xl px-4 py-2.5 shadow-lg animate-fade-in">
      {/* Delete / Cancel Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          stopTracksAndContext();
          onCancel();
        }}
        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
        title="Discard recording"
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      {/* Recording in progress view */}
      {isRecording ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-sm font-mono font-semibold text-zinc-100">{formatTime(duration)}</span>
          </div>

          {/* Dynamic Audio Waveform Bars */}
          <div className="flex-1 h-7 flex items-center gap-1 overflow-hidden px-2">
            {audioLevels.map((lvl, idx) => (
              <div
                key={idx}
                className="flex-1 bg-emerald-500 rounded-full transition-all duration-75"
                style={{ height: `${lvl}%` }}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleStopRecording}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 shrink-0"
            title="Stop & preview"
          >
            <StopCircle className="h-6 w-6" />
          </Button>
        </div>
      ) : (
        /* Preview View after stopping */
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={togglePreviewPlay}
            className="text-emerald-400 hover:bg-emerald-500/10 shrink-0"
          >
            {isPlayingPreview ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden w-full relative">
              <div
                className="h-full bg-emerald-500 transition-all duration-100"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Send Button */}
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shrink-0 shadow-md shadow-emerald-600/20"
        title="Send voice message"
      >
        <Send className="h-4 w-4 ml-0.5" />
      </Button>
    </div>
  );
}
