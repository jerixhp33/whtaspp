import { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Music,
  Plus,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mediaService } from '@/services/media.service';

export interface PreSendMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption: string;
  rotation: number;
}

interface Props {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onSend: (items: { file: File; caption: string; rotation: number }[]) => void;
}

export function PreSendMediaModal({ isOpen, files, onClose, onSend }: Props) {
  const [items, setItems] = useState<PreSendMediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize pre-send items with local object URLs
  useEffect(() => {
    if (!isOpen || files.length === 0) {
      setItems([]);
      return;
    }

    const initialItems: PreSendMediaItem[] = files.map((file) => {
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      return {
        id: `${file.name}_${Date.now()}_${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        caption: '',
        rotation: 0,
      };
    });

    setItems(initialItems);
    setActiveIndex(0);
    setZoomLevel(1);

    return () => {
      // Clean up object URLs on close
      initialItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [isOpen, files]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];

  const handleRotate = () => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const handleCaptionChange = (val: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === activeIndex ? { ...item, caption: val } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    URL.revokeObjectURL(items[index].previewUrl);
    const newItems = items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      onClose();
      return;
    }
    setItems(newItems);
    setActiveIndex((prev) => Math.min(prev, newItems.length - 1));
  };

  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const extraFiles = e.target.files;
    if (!extraFiles || extraFiles.length === 0) return;

    const newItems: PreSendMediaItem[] = Array.from(extraFiles).map((file) => {
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      return {
        id: `${file.name}_${Date.now()}_${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        caption: '',
        rotation: 0,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleSendAll = () => {
    const payload = items.map((it) => ({
      file: it.file,
      caption: it.caption.trim(),
      rotation: it.rotation,
    }));
    onSend(payload);
    onClose();
  };

  const renderActivePreview = () => {
    switch (currentItem.type) {
      case 'image':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={currentItem.previewUrl}
              alt={currentItem.file.name}
              style={{
                transform: `scale(${zoomLevel}) rotate(${currentItem.rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-h-[60vh] max-w-full object-contain rounded-xl select-none"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-2xl">
            <video
              ref={videoRef}
              src={currentItem.previewUrl}
              muted={isMuted}
              playsInline
              onTimeUpdate={() => {
                if (videoRef.current) setVideoCurrentTime(videoRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) setVideoDuration(videoRef.current.duration);
              }}
              className="max-h-[55vh] max-w-full rounded-xl bg-black shadow-2xl"
            />

            {/* Video Controls Bar */}
            <div className="w-full flex items-center gap-3 mt-3 px-4 py-2 bg-zinc-950/80 backdrop-blur rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-emerald-400"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={videoDuration || 100}
                value={videoCurrentTime}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = time;
                  setVideoCurrentTime(time);
                }}
                className="flex-1 accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-zinc-800"
              />

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/80 rounded-2xl border border-zinc-800 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Music className="h-8 w-8" />
            </div>
            <p className="font-semibold text-sm text-zinc-100 mb-1 truncate max-w-xs">
              {currentItem.file.name}
            </p>
            <p className="text-xs text-zinc-400 font-mono mb-4">
              {mediaService.formatFileSize(currentItem.file.size)}
            </p>
            <audio
              ref={audioRef}
              src={currentItem.previewUrl}
              controls
              className="w-full h-10 rounded-lg accent-emerald-500"
            />
          </div>
        );

      case 'document':
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/80 rounded-2xl border border-zinc-800 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <p className="font-semibold text-sm text-zinc-100 mb-1 truncate max-w-xs">
              {currentItem.file.name}
            </p>
            <p className="text-xs text-zinc-400 font-mono mb-2">
              {mediaService.formatFileSize(currentItem.file.size)}
            </p>
            <span className="text-[11px] bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-wider font-semibold">
              {currentItem.file.name.split('.').pop() || 'Document'}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150">
      {/* Hidden input to add more files */}
      <input
        type="file"
        ref={addMoreInputRef}
        onChange={handleAddMoreFiles}
        multiple
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="h-14 px-4 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Preview Attachment {items.length > 1 && `(${activeIndex + 1}/${items.length})`}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate max-w-xs">{currentItem.file.name}</p>
          </div>
        </div>

        {/* Toolbar Tools */}
        <div className="flex items-center gap-1.5">
          {currentItem.type === 'image' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="text-zinc-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="text-zinc-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="text-zinc-400 hover:text-white"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveItem(activeIndex)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
            title="Remove this item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
        {renderActivePreview()}
      </div>

      {/* Bottom Composer & Multi-file Strip */}
      <div className="p-4 bg-zinc-950/95 border-t border-zinc-800 flex flex-col gap-3 shrink-0">
        {/* Horizontal Multi-file Thumbnails */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                  idx === activeIndex
                    ? 'border-emerald-500 scale-105 shadow-md'
                    : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'image' ? (
                  <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : item.type === 'video' ? (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-purple-400">
                    <Play className="h-4 w-4" />
                  </div>
                ) : item.type === 'audio' ? (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-emerald-400">
                    <Music className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-amber-400">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => addMoreInputRef.current?.click()}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-800 hover:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 transition-colors"
              title="Add more files"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Caption Input & Send Action */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentItem.caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendAll();
            }}
          />

          <Button
            type="button"
            onClick={handleSendAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span>Send</span>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
