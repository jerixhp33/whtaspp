import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Lock, Bell, Palette, Shield, ArrowLeft, ShieldCheck } from 'lucide-react';
import { PrivacySettings } from './PrivacySettings';
import { NotificationSettings } from './NotificationSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { AccountSettings } from './AccountSettings';
import { PermissionsSettings } from './PermissionsSettings';
import { ProfileEdit } from '../profile/ProfileEdit';
import { useNavigate, useLocation } from 'react-router-dom';

type SettingsSection = 'profile' | 'privacy' | 'notifications' | 'appearance' | 'account' | 'permissions';

interface Props {
  initialSection?: SettingsSection;
}

export const SettingsLayout: React.FC<Props> = ({ initialSection }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getSectionFromPath = (): SettingsSection => {
    if (initialSection) return initialSection;
    if (location.pathname.includes('/permissions')) return 'permissions';
    if (location.pathname.includes('/privacy')) return 'privacy';
    if (location.pathname.includes('/notifications')) return 'notifications';
    if (location.pathname.includes('/appearance')) return 'appearance';
    if (location.pathname.includes('/account')) return 'account';
    return 'profile';
  };

  const [activeSection, setActiveSection] = useState<SettingsSection>(getSectionFromPath());

  useEffect(() => {
    setActiveSection(getSectionFromPath());
  }, [location.pathname, initialSection]);

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account Security', icon: Lock },
  ] as const;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileEdit />;
      case 'permissions':
        return <PermissionsSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Settings Navigation Header (Mobile) / Sidebar (Desktop) */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Back to Chats"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
            </div>
            <button
              onClick={() => navigate('/')}
              className="md:hidden text-xs text-emerald-400 hover:underline font-medium"
            >
              Done
            </button>
          </div>

          {/* Horizontal scroll on mobile, vertical stack on desktop */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === 'permissions') {
                    navigate('/settings/permissions');
                  } else {
                    navigate('/settings');
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                  activeSection === item.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Messages</span>
        </button>
      </div>

      {/* Main Content Area - Full width on mobile */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
