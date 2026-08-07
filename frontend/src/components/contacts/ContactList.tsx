import { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Loader2, Phone, Smartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';
import { UserSearch } from './UserSearch';
import { PhoneContactsView } from './PhoneContactsView';

export function ContactList() {
  const { user } = useAuth();
  const { conversations, setConversations, setActiveConversation } = useChat();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isPhoneContactsOpen, setIsPhoneContactsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchContacts = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch explicit contact IDs
        const { data: contactsData, error: contactsErr } = await supabase
          .from('contacts')
          .select('contact_id')
          .eq('user_id', user.id);

        let list: Profile[] = [];

        if (!contactsErr && contactsData && contactsData.length > 0) {
          const contactIds = contactsData.map(c => c.contact_id).filter(Boolean);
          if (contactIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', contactIds);

            if (profilesData) list = profilesData as Profile[];
          }
        }

        // Step 2: Fallback - discover other registered users in ChatFlow
        if (list.length === 0) {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .limit(30);

          if (allProfiles) list = allProfiles as Profile[];
        }

        setContacts(list);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  const handleSelectContact = async (contact: Profile) => {
    if (!user) return;
    try {
      const existing = conversations.find(c =>
        c.type === 'private' &&
        c.members?.some(m => m.user_id === contact.id)
      );

      if (existing) {
        setActiveConversation(existing);
        return;
      }

      // Create new private conversation
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
    } catch (err) {
      console.error("Failed to start chat with contact:", err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.display_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Contacts</h2>
          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsPhoneContactsOpen(true)}
              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              title="Phone Contacts (Address Book)"
            >
              <Smartphone className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsAddContactOpen(true)}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Add New Contact"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search contacts by name or phone..." 
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-zinc-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading contacts...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 flex flex-col items-center">
            <p className="text-sm mb-4">No contacts found.</p>
            <div className="flex gap-2">
              <Button onClick={() => setIsPhoneContactsOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                <Smartphone className="h-4 w-4" />
                Phone Contacts
              </Button>
              <Button onClick={() => setIsAddContactOpen(true)} variant="outline" className="border-zinc-800 bg-zinc-900 text-xs gap-1.5">
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => handleSelectContact(contact)}
                className="flex items-center gap-3 p-3 hover:bg-zinc-900/80 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-zinc-800/50"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                    {contact.avatar_url ? (
                      <img src={contact.avatar_url} alt={contact.display_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-sm">{(contact.display_name || contact.username || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {contact.is_online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-zinc-200 group-hover:text-white truncate">{contact.display_name || contact.username}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 truncate">
                    <span>@{contact.username}</span>
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-emerald-400 hover:bg-emerald-500/10">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAddContactOpen(false)} 
              className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-white"
            >
              ✕
            </Button>
            <UserSearch />
          </div>
        </div>
      )}

      {/* Phone Contacts Modal */}
      {isPhoneContactsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[85vh] relative overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsPhoneContactsOpen(false)} 
              className="absolute right-3 top-3 z-20 text-zinc-400 hover:text-white"
            >
              ✕
            </Button>
            <PhoneContactsView onClose={() => setIsPhoneContactsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
