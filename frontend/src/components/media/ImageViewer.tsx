import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(s + 0.25, 3))} className="text-white hover:bg-white/20">
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} className="text-white hover:bg-white/20">
          <ZoomOut className="h-5 w-5" />
        </Button>
        <a href={src} download="" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-white hover:bg-white/20 h-10 w-10">
          <Download className="h-5 w-5" />
        </a>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 ml-2">
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="w-full h-full flex items-center justify-center overflow-hidden p-4">
        <img 
          src={src} 
          alt="Fullscreen view" 
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
