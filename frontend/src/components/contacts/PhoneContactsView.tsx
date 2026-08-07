import { useState, useEffect } from 'react';
import { Search, RefreshCw, Smartphone, MessageSquare, Share2, Shield, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { deviceContactService, MatchedPhoneContact } from '@/services/device-contact.service';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

export function PhoneContactsView({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const { conversations, setConversations, setActiveConversation } = useChat();

  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [onChatFlowContacts, setOnChatFlowContacts] = useState<MatchedPhoneContact[]>([]);
  const [inviteContacts, setInviteContacts] = useState<MatchedPhoneContact[]>([]);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  useEffect(() => {
    checkPermissionAndLoad();
  }, []);

  const checkPermissionAndLoad = async () => {
    const perm = await deviceContactService.checkPermission();
    setPermissionState(perm);
    if (perm === 'granted') {
      loadPhoneContacts();
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    const granted = await deviceContactService.requestPermission();
    if (granted) {
      setPermissionState('granted');
      await loadPhoneContacts();
    } else {
      setPermissionState('denied');
    }
    setLoading(false);
  };

  const loadPhoneContacts = async () => {
    setLoading(true);
    try {
      const deviceContacts = await deviceContactService.getDeviceContacts();
      if (deviceContacts.length > 0) {
        const { onChatFlow, inviteToChatFlow } = await deviceContactService.matchContacts(deviceContacts, user?.id);
        setOnChatFlowContacts(onChatFlow);
        setInviteContacts(inviteToChatFlow);
      } else {
        setOnChatFlowContacts([]);
        setInviteContacts([]);
      }
    } catch (err) {
      console.error('Failed to load phone contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (contact: Profile) => {
    if (!user) return;
    setStartingChatId(contact.id);
    try {
      const existing = conversations.find(c =>
        c.type === 'private' &&
        c.members?.some(m => m.user_id === contact.id)
      );

      if (existing) {
        setActiveConversation(existing);
        if (onClose) onClose();
        return;
      }

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'private', created_by: user.id })
        .select()
        .single();

      if (convError || !convData) throw convError;

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: convData.id, user_id: user.id, role: 'owner' },
          { conversation_id: convData.id, user_id: contact.id, role: 'member' }
        ]);

      if (membersError) throw membersError;

      const fullConv: any = {
        ...convData,
        members: [
          { conversation_id: convData.id, user_id: user.id, role: 'owner', profile: null },
          { conversation_id: convData.id, user_id: contact.id, role: 'member', profile: contact }
        ]
      };

      setConversations(prev => [fullConv, ...prev]);
      setActiveConversation(fullConv);
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to start chat with phone contact:", err);
    } finally {
      setStartingChatId(null);
    }
  };

  const handleInvite = (item: MatchedPhoneContact) => {
    deviceContactService.shareInvite(item.deviceContact.name, item.primaryPhone);
  };

  const filteredOnChatFlow = onChatFlowContacts.filter(c =>
    c.deviceContact.name.toLowerCase().includes(search.toLowerCase()) ||
    c.primaryPhone.includes(search)
  );

  const filteredInvite = inviteContacts.filter(c =>
    c.deviceContact.name.toLowerCase().includes(search.toLowerCase()) ||
    c.primaryPhone.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-semibold tracking-tight">Phone Contacts</h2>
        </div>
        {permissionState === 'granted' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={loadPhoneContacts}
            disabled={loading}
            className="text-zinc-400 hover:text-white gap-1.5"
            title="Refresh Contacts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
      </div>

      {/* Permission Not Granted / Denied Card */}
      {permissionState !== 'granted' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-xl">
            <Smartphone className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Find your contacts on ChatFlow</h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Allow access to your phone contacts to automatically find people you know already using ChatFlow.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={handleRequestPermission}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 py-2.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              <span>Allow Access</span>
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                Not Now
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Permission Granted - Contact List View */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Local Search Input */}
          <div className="p-4 border-b border-zinc-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search contacts..."
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-zinc-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Matching phone contacts...</span>
              </div>
            ) : (
              <>
                {/* ON CHATFLOW SECTION */}
                {filteredOnChatFlow.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                        On ChatFlow ({filteredOnChatFlow.length})
                      </span>
                    </div>

                    <div className="space-y-1">
                      {filteredOnChatFlow.map(item => (
                        <div
                          key={item.deviceContact.id + item.primaryPhone}
                          className="flex items-center justify-between p-3 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl border border-zinc-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                              {item.profile?.avatar_url ? (
                                <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-semibold text-sm text-zinc-200">
                                  {item.deviceContact.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm text-zinc-100 truncate">{item.deviceContact.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                <Check className="h-3 w-3" />
                                <span>On ChatFlow</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={startingChatId === item.profile?.id}
                            onClick={() => item.profile && handleStartChat(item.profile)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                          >
                            {startingChatId === item.profile?.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4" />
                                <span>Message</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INVITE TO CHATFLOW SECTION */}
                {filteredInvite.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                        Invite to ChatFlow ({filteredInvite.length})
                      </span>
                    </div>

                    <div className="space-y-1">
                      {filteredInvite.map(item => (
                        <div
                          key={item.deviceContact.id + item.primaryPhone}
                          className="flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-900/70 rounded-xl border border-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                              <span className="font-medium text-sm text-zinc-400">
                                {item.deviceContact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm text-zinc-200 truncate">{item.deviceContact.name}</h4>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvite(item)}
                            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 gap-1.5 shrink-0"
                          >
                            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Invite</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredOnChatFlow.length === 0 && filteredInvite.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    No phone contacts found matching "{search}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
