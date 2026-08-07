import { useState, useEffect } from 'react';

// BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const platform = {
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as any).standalone === true
    );
  },

  isCapacitor(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).Capacitor?.isNativePlatform?.());
  },

  isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  },

  isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  isIOSSafari(): boolean {
    if (!this.isIOS()) return false;
    const ua = navigator.userAgent;
    return /WebKit/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua) && !/OPiOS/i.test(ua);
  },

  isDesktop(): boolean {
    return !this.isAndroid() && !this.isIOS();
  },

  isInstalled(): boolean {
    return this.isStandalone() || this.isCapacitor();
  },

  getPlatformName(): 'Android' | 'iOS' | 'Desktop' | 'Web' {
    if (this.isCapacitor()) return 'Android';
    if (this.isAndroid()) return 'Android';
    if (this.isIOS()) return 'iOS';
    return 'Desktop';
  },

  getDisplayMode(): 'standalone' | 'browser' | 'native' {
    if (this.isCapacitor()) return 'native';
    if (this.isStandalone()) return 'standalone';
    return 'browser';
  }
};

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(platform.isInstalled());
  const [isIOS, setIsIOS] = useState(platform.isIOS());
  const [isIOSSafari, setIsIOSSafari] = useState(platform.isIOSSafari());

  useEffect(() => {
    const handleInstallable = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    isIOS,
    isIOSSafari,
    promptInstall,
    displayMode: platform.getDisplayMode(),
    platformName: platform.getPlatformName()
  };
}
