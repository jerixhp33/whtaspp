import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { usePWAInstall } from '@/capabilities/platform';
import {
  Shield,
  Users,
  Mic,
  Camera,
  Bell,
  FileImage,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Smartphone,
  Globe,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PermissionsSettings() {
  const {
    permissions,
    loading,
    refreshPermissions,
    requestNotification,
    requestMicrophone,
    requestCamera,
    requestContacts,
    platformName,
    isInstalled
  } = usePermissions();

  const { displayMode } = usePWAInstall();
  const [refreshing, setRefreshing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPermissions();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequest = async (type: string, fn: () => Promise<any>) => {
    setActiveAction(type);
    try {
      await fn();
      await refreshPermissions();
    } finally {
      setActiveAction(null);
    }
  };

  const renderStatus = (
    type: string,
    status: string,
    onRequest: () => Promise<any>
  ) => {
    if (status === 'granted') {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle className="h-3.5 w-3.5" /> Allowed
          </span>
        </div>
      );
    }

    if (status === 'unsupported') {
      return (
        <span className="text-xs text-zinc-500 italic bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
          Not Available
        </span>
      );
    }

    if (status === 'denied') {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Disabled
          </span>
          <Button
            size="sm"
            onClick={() => handleRequest(type, onRequest)}
            disabled={activeAction === type}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-7 px-3 rounded-lg font-medium"
          >
            {activeAction === type ? 'Checking...' : 'Enable'}
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => handleRequest(type, onRequest)}
        disabled={activeAction === type}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3.5 rounded-lg font-medium shadow-sm"
      >
        {activeAction === type ? 'Requesting...' : 'Allow'}
      </Button>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            ChatFlow Permissions
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time operating system and browser permissions for calls, contacts, and alerts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        
        {/* Contacts */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Contacts</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Find people you know on ChatFlow using privacy-preserving phone matching.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center">
            {renderStatus('contacts', permissions.contacts, requestContacts)}
          </div>
        </div>

        {/* Microphone */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Microphone</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Required for voice messages, voice calls, and video calls.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center">
            {renderStatus('microphone', permissions.microphone, requestMicrophone)}
          </div>
        </div>

        {/* Camera */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Camera</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Required for HD WebRTC video calls.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center">
            {renderStatus('camera', permissions.camera, requestCamera)}
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Alerts for incoming calls, direct messages, and contact requests.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center">
            {renderStatus('notifications', permissions.notifications, requestNotification)}
          </div>
        </div>

        {/* Photos & Files */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Photos & Files</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Send photos, videos, and documents via system file picker.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle className="h-3.5 w-3.5" /> Allowed
            </span>
          </div>
        </div>

      </div>

      {/* System Diagnostics & Platform Info */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
        <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-emerald-400" />
          Application & Environment Info
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Platform</p>
            <p className="text-xs font-semibold text-zinc-200 mt-0.5">{platformName}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Display Mode</p>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5 capitalize">{displayMode}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Service Worker</p>
            <p className="text-xs font-semibold text-zinc-200 mt-0.5">
              {'serviceWorker' in navigator ? 'Active' : 'Unavailable'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Install State</p>
            <p className="text-xs font-semibold text-zinc-200 mt-0.5">
              {isInstalled ? 'Installed App' : 'Web Browser'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
