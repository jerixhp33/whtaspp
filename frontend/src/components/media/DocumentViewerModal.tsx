import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mediaService } from '@/services/media.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

export function DocumentViewerModal({ isOpen, onClose, fileUrl, fileName, fileSize }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('.pdf');

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    mediaService
      .getMediaBlob(fileUrl, 'documents')
      .then((res) => {
        if (!active) return;
        if (res?.blobUrl) {
          setBlobUrl(res.blobUrl);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    mediaService.downloadMedia(fileUrl, fileName, 'document');
  };

  const handleOpenExternal = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="h-14 px-4 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-zinc-900 text-amber-400 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-xs sm:max-w-md">
              {fileName}
            </h3>
            {fileSize && (
              <p className="text-[11px] text-zinc-400 font-mono">
                {mediaService.formatFileSize(fileSize)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {blobUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenExternal}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
            title="Download document"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 ml-1"
            title="Close viewer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Document Preview Body */}
      <div className="flex-1 min-h-0 bg-zinc-900 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs">Loading document preview...</p>
          </div>
        ) : error || !blobUrl ? (
          <div className="flex flex-col items-center gap-3 text-zinc-400 max-w-sm text-center p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <AlertCircle className="h-10 w-10 text-amber-400" />
            <p className="font-semibold text-zinc-200 text-sm">Preview Unavailable</p>
            <p className="text-xs text-zinc-400">
              The document could not be loaded into the previewer. You can download the file directly to view it on your device.
            </p>
            <Button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 mt-2"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download File
            </Button>
          </div>
        ) : isPdf ? (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title={fileName}
            className="w-full h-full rounded-xl border border-zinc-800 bg-white"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-zinc-300 p-8 bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md text-center shadow-xl">
            <div className="p-4 rounded-2xl bg-zinc-900 text-amber-400 shadow-inner">
              <FileText className="h-12 w-12" />
            </div>
            <div>
              <p className="font-semibold text-base text-zinc-100 mb-1">{fileName}</p>
              <p className="text-xs text-zinc-400 font-mono">
                {fileSize ? mediaService.formatFileSize(fileSize) : 'Document'}
              </p>
            </div>
            <Button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Download className="h-4 w-4" />
              Download & Open Document
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
