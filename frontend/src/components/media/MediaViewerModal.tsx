import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mediaService } from '@/services/media.service';

export interface MediaViewerItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  fileName?: string;
  senderName?: string;
  createdAt?: string;
}

interface Props {
  items: MediaViewerItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaViewerModal({ items, initialIndex = 0, isOpen, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentItem = items[currentIndex];

  // Resolve authorized signed URL for the current item
  useEffect(() => {
    if (!currentItem || !isOpen) return;
    setLoading(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });

    let active = true;
    mediaService.getSignedUrl(currentItem.url).then((url) => {
      if (active) {
        setResolvedUrl(url || currentItem.url);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [currentItem, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) handlePrev();
      else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose]);

  if (!isOpen || !currentItem) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  // Drag / Pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    if (!currentItem) return;
    mediaService.downloadMedia(
      currentItem.url,
      currentItem.fileName,
      currentItem.type === 'video' ? 'video' : 'image'
    );
  };

  const handleShare = async () => {
    if (!currentItem) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.fileName || 'ChatFlow Media',
          url: resolvedUrl || window.location.href,
        });
      } catch (_) {}
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  return createPortal(
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
    >
      {/* Top Action Bar */}
      <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide text-zinc-300">
            {currentIndex + 1} / {items.length}
          </span>
          {currentItem.senderName && (
            <span className="text-xs text-zinc-400 hidden sm:inline">
              • Sent by {currentItem.senderName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentItem.type === 'image' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="text-zinc-300 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="text-zinc-300 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              {scale !== 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10 h-9 w-9 rounded-full"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-zinc-300 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="text-zinc-300 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-300 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full ml-2"
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur border border-zinc-700/60 transition-transform active:scale-95"
            title="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Media Render */}
        <div className="w-full h-full flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
          ) : currentItem.type === 'video' ? (
            <video
              src={resolvedUrl || currentItem.url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border border-zinc-800"
            />
          ) : (
            <img
              src={resolvedUrl || currentItem.url}
              alt="Media"
              onDoubleClick={handleDoubleClick}
              draggable={false}
              className={`max-w-full max-h-[82vh] object-contain transition-transform duration-100 ${
                scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              }`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
            />
          )}
        </div>

        {/* Next Button */}
        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur border border-zinc-700/60 transition-transform active:scale-95"
            title="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="p-4 text-center text-xs text-zinc-400 z-20 bg-gradient-to-t from-black/80 to-transparent">
        <span>Press ESC to close • Use ← / → arrows to navigate</span>
      </div>
    </div>,
    document.body
  );
}
