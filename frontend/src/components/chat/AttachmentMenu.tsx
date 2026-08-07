import { useState, useRef, useEffect } from 'react';
import { Image, Video, FileText, Camera, Music, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: File[]) => void;
  onCaptureCamera?: (file: File) => void;
}

export function AttachmentMenu({ isOpen, onClose, onSelectFiles }: Props) {
  const [permissionDeniedType, setPermissionDeniedType] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      onSelectFiles(fileList);
      onClose();
    }
    e.target.value = '';
  };

  const handleChoosePhotos = async () => {
    try {
      photoInputRef.current?.click();
    } catch {
      setPermissionDeniedType('Photos & Videos');
    }
  };

  const handleChooseVideos = async () => {
    try {
      videoInputRef.current?.click();
    } catch {
      setPermissionDeniedType('Videos');
    }
  };

  const handleChooseDocuments = async () => {
    try {
      documentInputRef.current?.click();
    } catch {
      setPermissionDeniedType('Documents');
    }
  };

  const handleChooseAudio = async () => {
    try {
      audioInputRef.current?.click();
    } catch {
      setPermissionDeniedType('Audio');
    }
  };

  const handleChooseCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request camera permission on demand
        await navigator.mediaDevices.getUserMedia({ video: true });
      }
      cameraInputRef.current?.click();
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setPermissionDeniedType('Camera');
    }
  };

  const menuOptions = [
    {
      id: 'photos',
      label: 'Photos',
      icon: Image,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      action: handleChoosePhotos,
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      action: handleChooseVideos,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      action: handleChooseDocuments,
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      action: handleChooseCamera,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      action: handleChooseAudio,
    },
  ];

  return (
    <>
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleFileInputChange}
        accept="video/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv,.tar,.gz"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleFileInputChange}
        accept="audio/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileInputChange}
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
      />

      {/* Permission Denied Modal */}
      {permissionDeniedType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              {permissionDeniedType} access is disabled
            </h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              ChatFlow needs permission to access your {permissionDeniedType.toLowerCase()} to attach them to your chat.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPermissionDeniedType(null)}
                className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPermissionDeniedType(null);
                  if (permissionDeniedType.includes('Camera')) handleChooseCamera();
                  else handleChoosePhotos();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Popover / Mobile Bottom Sheet */}
      <div
        ref={menuRef}
        className="absolute bottom-full left-0 mb-3 w-64 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl z-40 p-2 text-zinc-200 select-none animate-in fade-in slide-in-from-bottom-3 duration-150"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-1">
          <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
            Add to Chat
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-md"
            aria-label="Close attachment menu"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {menuOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={opt.action}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-zinc-900/90 text-left transition-colors cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${opt.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
