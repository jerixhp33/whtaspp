import { useState, useEffect } from 'react';
import { Search, RefreshCw, Smartphone, MessageSquare, Share2, Shield, Loader2, Check, UserPlus, Plus } from 'lucide-react';
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

  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

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
      const { onChatFlow, inviteToChatFlow } = await deviceContactService.matchContacts(deviceContacts, user?.id);
      setOnChatFlowContacts(onChatFlow);
      setInviteContacts(inviteToChatFlow);
    } catch (err) {
      console.error('Failed to load phone contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    deviceContactService.addCustomContact(newContactName.trim(), newContactPhone.trim());
    setNewContactName('');
    setNewContactPhone('');
    setShowAddModal(false);
    await loadPhoneContacts();
  };

  const handleAddDemoContacts = async () => {
    deviceContactService.addCustomContact('Alex Morgan', '+14155552671');
    deviceContactService.addCustomContact('Sarah Johnson', '+919876543210');
    deviceContactService.addCustomContact('David Chen', '+14155558901');
    await loadPhoneContacts();
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
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold tracking-tight">Phone Contacts</h2>
        </div>
        <div className="flex items-center gap-2">
          {permissionState === 'granted' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModal(true)}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-emerald-400 text-xs gap-1.5 h-8"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadPhoneContacts}
                disabled={loading}
                className="text-zinc-400 hover:text-white h-8 px-2"
                title="Refresh Contacts"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Permission Not Granted Card */}
      {permissionState !== 'granted' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-xl">
            <Smartphone className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Find your contacts on ChatFlow</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Allow access to your phone contacts to automatically find friends already using ChatFlow.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={handleRequestPermission}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 py-2.5 rounded-xl shadow-lg shadow-emerald-950"
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
          <div className="p-3.5 border-b border-zinc-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search phone contacts..."
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs sm:text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-zinc-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                <span className="text-xs">Matching contacts...</span>
              </div>
            ) : (
              <>
                {/* ON CHATFLOW SECTION */}
                {filteredOnChatFlow.length > 0 && (
                  <div>
                    <div className="px-2 mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                        On ChatFlow ({filteredOnChatFlow.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {filteredOnChatFlow.map(item => (
                        <div
                          key={item.deviceContact.id + item.primaryPhone}
                          className="flex items-center justify-between p-3 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl border border-zinc-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                              {item.profile?.avatar_url ? (
                                <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-sm text-zinc-200">
                                  {item.deviceContact.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-zinc-100 truncate">{item.deviceContact.name}</h4>
                              <p className="text-xs text-zinc-400 truncate">{item.primaryPhone}</p>
                              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-0.5">
                                <Check className="h-3 w-3" />
                                <span>Active on ChatFlow</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={startingChatId === item.profile?.id}
                            onClick={() => item.profile && handleStartChat(item.profile)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shrink-0 text-xs h-8 px-3 rounded-lg"
                          >
                            {startingChatId === item.profile?.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Chat</span>
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
                      <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                        Invite to ChatFlow ({filteredInvite.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {filteredInvite.map(item => (
                        <div
                          key={item.deviceContact.id + item.primaryPhone}
                          className="flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-900/70 rounded-xl border border-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                              <span className="font-medium text-sm text-zinc-400">
                                {item.deviceContact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm text-zinc-200 truncate">{item.deviceContact.name}</h4>
                              <p className="text-xs text-zinc-500 truncate">{item.primaryPhone}</p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvite(item)}
                            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 gap-1.5 shrink-0 text-xs h-8 px-3 rounded-lg"
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
                  <div className="text-center py-10 px-4 space-y-4">
                    <div className="p-3 bg-zinc-900/60 rounded-2xl max-w-sm mx-auto border border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-200">No contacts synced yet</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Add a phone contact or quick-import sample contacts to test matching.
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => setShowAddModal(true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Contact
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddDemoContacts}
                          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs h-8 rounded-lg"
                        >
                          Load Demo Contacts
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Contact Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomContact} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Add Phone Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Phone Number</label>
                <Input
                  placeholder="e.g. +14155552671 or 9876543210"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              >
                Save & Match
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
