import { useState } from 'react';
import { usePWAInstall } from '@/capabilities/platform';
import { Download, CheckCircle, Share, PlusSquare, X, Sparkles, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallAppCard({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, isIOS, isIOSSafari, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (dismissed) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  // If already installed, show subtle confirmation or hide
  if (isInstalled) {
    return (
      <div className={`p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-emerald-300 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-200">ChatFlow is installed</p>
            <p className="text-[11px] text-emerald-400/80">Running in standalone application mode</p>
          </div>
        </div>
      </div>
    );
  }

  // If not installable and not iOS Safari, don't show non-working button
  if (!isInstallable && !isIOSSafari) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-emerald-500/20 shadow-xl backdrop-blur-xl ${className}`}>
      {/* Ambient background highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
        aria-label="Dismiss install card"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <Smartphone className="h-5 w-5" />
        </div>

        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-white tracking-tight">Install ChatFlow</h3>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5" /> App
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Get the full ChatFlow experience directly from your device with offline launch and native speed.
          </p>

          {isInstallable && (
            <div className="mt-3.5">
              <Button
                onClick={handleInstallClick}
                disabled={installing}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                {installing ? 'Installing...' : 'Install App'}
              </Button>
            </div>
          )}

          {isIOSSafari && !isInstallable && (
            <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
              <p className="font-medium text-emerald-400">To install on iPhone / iPad:</p>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span>1. Tap the Share button</span>
                <Share className="h-3.5 w-3.5 text-blue-400 inline" />
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span>2. Select</span>
                <strong className="text-white">Add to Home Screen</strong>
                <PlusSquare className="h-3.5 w-3.5 text-emerald-400 inline" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
