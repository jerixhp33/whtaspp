import { useState } from 'react';
import { UploadCloud, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FileUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
      {selectedFiles.length > 0 ? (
        <div className="space-y-3">
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
              <div className="flex items-center gap-3">
                <FileIcon className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-100 truncate w-48">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4 text-zinc-400" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setSelectedFiles([])}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onUpload(selectedFiles)}>Upload Files</Button>
          </div>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium mb-1">Drag & drop files here</p>
          <p className="text-zinc-500 text-sm mb-4">or click to browse from your computer</p>
          <Button variant="outline" className="bg-zinc-900 border-zinc-700">Select Files</Button>
        </div>
      )}
    </div>
  );
}
