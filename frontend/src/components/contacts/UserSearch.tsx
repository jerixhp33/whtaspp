import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, Loader2, Phone, Contact } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function UserSearch() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [osContactsSupported] = useState(() => 'contacts' in navigator && 'ContactsManager' in window);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUser?.id || '')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(15);

        if (!error && data) {
          setResults(data as Profile[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, currentUser?.id]);

  const handleAddContact = async (targetUser: Profile) => {
    if (!currentUser) return;
    setAddingId(targetUser.id);
    try {
      await supabase
        .from('contacts')
        .upsert({ user_id: currentUser.id, contact_id: targetUser.id });
      
      setAddedIds(prev => [...prev, targetUser.id]);
    } catch (err) {
      console.error('Failed to add contact:', err);
    } finally {
      setAddingId(null);
    }
  };

  const handleImportOSContacts = async () => {
    try {
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        const contacts = await (navigator as any).contacts.select(['name', 'tel', 'email'], { multiple: true });
        if (contacts && contacts.length > 0) {
          // Extract phone numbers and search in database
          const numbers = contacts.flatMap((c: any) => c.tel || []).map((t: string) => t.replace(/[^0-9+]/g, '')).filter(Boolean);
          if (numbers.length > 0) {
            setQuery(numbers[0]);
          }
        }
      } else {
        alert("Native Contacts Picker is available on mobile Chrome & supported browsers.");
      }
    } catch (err) {
      console.error('OS Contact Picker cancelled or failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Add Contact</h2>
        {osContactsSupported && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleImportOSContacts}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs gap-1.5"
          >
            <Contact className="h-4 w-4 text-emerald-400" />
            <span>Import OS Contacts</span>
          </Button>
        )}
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <Input 
          placeholder="Search by name, phone (+123...), username, or email..." 
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-sm text-zinc-500 py-4">Searching...</div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map(user => {
              const isAdded = addedIds.includes(user.id);
              const isAdding = addingId === user.id;

              return (
                <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-sm">{(user.display_name || user.username || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-zinc-100">{user.display_name || user.username}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>@{user.username}</span>
                        {user.phone && (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={isAdded ? "outline" : "secondary"}
                    disabled={isAdded || isAdding}
                    onClick={() => handleAddContact(user)}
                    className={isAdded ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center text-sm text-zinc-500 py-4">No users found matching "{query}"</div>
        ) : (
          <div className="text-center text-sm text-zinc-500 py-4">Type a name, phone number (+1...), or username to search</div>
        )}
      </div>
    </div>
  );
}
