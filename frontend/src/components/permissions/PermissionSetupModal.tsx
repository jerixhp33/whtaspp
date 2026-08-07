import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ShieldCheck, Users, Mic, Camera, Bell, FileImage, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen?: boolean;
  onComplete: () => void;
}

export function PermissionSetupModal({ isOpen = true, onComplete }: Props) {
  const {
    permissions,
    requestNotification,
    requestMicrophone,
    requestCamera,
    requestContacts,
  } = usePermissions();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (type: string, fn: () => Promise<any>) => {
    setLoadingAction(type);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('chatflow_setup_completed', 'true');
    onComplete();
  };

  const renderStatusButton = (
    type: string,
    status: string,
    onRequest: () => Promise<any>,
    label: string = 'Allow'
  ) => {
    if (status === 'granted') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Check className="h-3.5 w-3.5" /> Allowed
        </span>
      );
    }

    if (status === 'unsupported') {
      return (
        <span className="text-[11px] text-zinc-500 italic">
          Not supported on this device
        </span>
      );
    }

    if (status === 'denied') {
      return (
        <button
          onClick={() => handleAction(type, onRequest)}
          disabled={loadingAction === type}
          className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium transition-colors"
        >
          {loadingAction === type ? 'Checking...' : 'Try Again'}
        </button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => handleAction(type, onRequest)}
        disabled={loadingAction === type}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3.5 py-1 h-7 rounded-lg shadow-sm"
      >
        {loadingAction === type ? 'Allowing...' : label}
      </Button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-zinc-800/80 relative">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Set up ChatFlow</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
            Allow the permissions you want to use with ChatFlow. You can always change these later in Settings.
          </p>
        </div>

        {/* Permissions List */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          
          {/* Contacts */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Contacts</p>
                <p className="text-xs text-zinc-400">Find people you know on ChatFlow</p>
              </div>
            </div>
            <div className="shrink-0">
              {renderStatusButton('contacts', permissions.contacts, requestContacts)}
            </div>
          </div>

          {/* Microphone */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Microphone</p>
                <p className="text-xs text-zinc-400">Voice messages and voice calls</p>
              </div>
            </div>
            <div className="shrink-0">
              {renderStatusButton('microphone', permissions.microphone, requestMicrophone)}
            </div>
          </div>

          {/* Camera */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Camera</p>
                <p className="text-xs text-zinc-400">High definition video calls</p>
              </div>
            </div>
            <div className="shrink-0">
              {renderStatusButton('camera', permissions.camera, requestCamera)}
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Notifications</p>
                <p className="text-xs text-zinc-400">New messages and incoming calls</p>
              </div>
            </div>
            <div className="shrink-0">
              {renderStatusButton('notifications', permissions.notifications, requestNotification)}
            </div>
          </div>

          {/* Photos / Files */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <FileImage className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Photos & Files</p>
                <p className="text-xs text-zinc-400">Send photos, videos, and documents</p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Check className="h-3.5 w-3.5" /> Allowed
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between gap-3">
          <button
            onClick={handleFinish}
            className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl transition-colors"
          >
            Skip for now
          </button>

          <Button
            onClick={handleFinish}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

      </div>
    </div>
  );
}
