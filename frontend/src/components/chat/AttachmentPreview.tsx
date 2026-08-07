import { X, FileText, Image as ImageIcon, Film, Music, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  file: File;
  previewUrl?: string | null;
  uploadProgress?: number;
  isUploading?: boolean;
  onRemove: () => void;
}

export function AttachmentPreview({ file, previewUrl, uploadProgress = 0, isUploading = false, onRemove }: Props) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');

  return (
    <div className="flex items-center gap-3 p-2.5 bg-zinc-950/90 border border-zinc-800 rounded-xl relative group shadow-md mb-2 animate-fade-in">
      {/* File Icon or Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden flex items-center justify-center border border-zinc-800 shrink-0">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isVideo ? (
          <Film className="h-6 w-6 text-purple-400" />
        ) : isAudio ? (
          <Music className="h-6 w-6 text-emerald-400" />
        ) : isImage ? (
          <ImageIcon className="h-6 w-6 text-blue-400" />
        ) : (
          <FileText className="h-6 w-6 text-amber-400" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-100 truncate">{file.name}</p>
        <p className="text-[11px] text-zinc-400">{formatSize(file.size)}</p>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-1.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={isUploading}
        className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full shrink-0"
        title="Remove attachment"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
