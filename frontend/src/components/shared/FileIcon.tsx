import React from 'react';
import { File, FileText, FileSpreadsheet, Image as ImageIcon, Film, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileType: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileType, className }) => {
  const defaultClass = cn("h-8 w-8 text-zinc-400", className);
  
  if (fileType.includes('pdf')) {
    return <FileText className={cn("h-8 w-8 text-red-400", className)} />;
  }
  if (fileType.includes('word') || fileType.includes('document')) {
    return <FileText className={cn("h-8 w-8 text-blue-400", className)} />;
  }
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) {
    return <FileSpreadsheet className={cn("h-8 w-8 text-green-400", className)} />;
  }
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={cn("h-8 w-8 text-purple-400", className)} />;
  }
  if (fileType.startsWith('video/')) {
    return <Film className={cn("h-8 w-8 text-amber-400", className)} />;
  }
  if (fileType.startsWith('audio/')) {
    return <Music className={cn("h-8 w-8 text-pink-400", className)} />;
  }

  return <File className={defaultClass} />;
};
