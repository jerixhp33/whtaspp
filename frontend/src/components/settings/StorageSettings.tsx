import { useState, useEffect } from 'react';
import { Database, Trash2, HardDrive, MessageSquare, Image, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { offlineDBService } from '@/services/offline/offline-db.service';
import { mediaService } from '@/services/media.service';

export function StorageSettings() {
  const [stats, setStats] = useState({
    conversationsCount: 0,
    messagesCount: 0,
    mediaBytes: 0,
    mediaCount: 0,
  });
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const loadStats = async () => {
    const s = await offlineDBService.getStorageStats();
    setStats(s);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    if (!confirm('Clear local offline cache? This will not delete your messages from the server.')) return;
    setClearing(true);
    try {
      await offlineDBService.clearLocalCache();
      setCleared(true);
      await loadStats();
      setTimeout(() => setCleared(false), 3000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Storage & Data</h3>
        <p className="text-sm text-zinc-400">
          Manage local cached messages, conversations, and offline media on this device.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cached Conversations */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <span>Saved Conversations</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-2 font-mono">{stats.conversationsCount}</p>
          <span className="text-[10px] text-zinc-500 mt-1">Available offline</span>
        </div>

        {/* Cached Messages */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Database className="h-4 w-4 text-sky-400" />
            <span>Cached Messages</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-2 font-mono">{stats.messagesCount}</p>
          <span className="text-[10px] text-zinc-500 mt-1">IndexedDB Store</span>
        </div>

        {/* Media Cache */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Image className="h-4 w-4 text-amber-400" />
            <span>Media Cache</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-2 font-mono">
            {stats.mediaBytes > 0 ? mediaService.formatFileSize(stats.mediaBytes) : '0 B'}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1">{stats.mediaCount} cached files</span>
        </div>
      </div>

      {/* Clear Cache Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Clear Local Cache</h4>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-md">
              Free up device space by clearing locally saved messages and downloaded media blobs. Server data remains safe.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleClearCache}
          disabled={clearing}
          variant="destructive"
          className="shrink-0 gap-2 cursor-pointer active:scale-95 transition-all text-xs"
        >
          {clearing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : cleared ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span>Cache Cleared</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>Clear Cache</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
