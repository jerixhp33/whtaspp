import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Lock, Bell, Palette, Shield, ArrowLeft } from 'lucide-react';
import { PrivacySettings } from './PrivacySettings';
import { NotificationSettings } from './NotificationSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { AccountSettings } from './AccountSettings';
import { ProfileEdit } from '../profile/ProfileEdit';
import { useNavigate } from 'react-router-dom';

type SettingsSection = 'profile' | 'privacy' | 'notifications' | 'appearance' | 'account';

export const SettingsLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const navigate = useNavigate();

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account Security', icon: Lock },
  ] as const;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileEdit />;
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
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6 px-2">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Back to Chats"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Messages</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
