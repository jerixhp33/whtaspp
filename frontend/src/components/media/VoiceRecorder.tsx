import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoiceRecorder({ onSend, onCancel }: { onSend: (blob: Blob) => void, onCancel: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        onSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current = recorder;
      audioChunks.current = [];
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 w-full bg-zinc-900 rounded-xl px-4 py-2 border border-zinc-800">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-zinc-100 font-medium">{formatDuration(duration)}</span>
            <div className="flex-1 h-6 flex items-center gap-1 overflow-hidden px-4">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-1 bg-emerald-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-zinc-400 hover:text-red-500">
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={stopRecording} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="icon" onClick={startRecording} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
