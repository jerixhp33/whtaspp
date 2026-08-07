import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, FileText, Link as LinkIcon, Bell, Ban, UserPlus, Search, ShieldAlert, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ImageViewer } from '@/components/media/ImageViewer';

interface SharedFileItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  created_at: string;
}

export function ChatDetails({ onClose }: { onClose?: () => void }) {
  const { activeConversation, onlineUserIds } = useChat();
  const { user } = useAuth();

  const [mediaList, setMediaList] = useState<SharedFileItem[]>([]);
  const [fileList, setFileList] = useState<SharedFileItem[]>([]);
  const [linkList, setLinkList] = useState<{ url: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const members = activeConversation.members || (activeConversation as any).conversation_members || [];
  const otherMemberObj = members.find((m: any) => m.user_id !== user?.id);
  const otherMember = otherMemberObj?.profiles || otherMemberObj?.profile;

  const name = isGroup
    ? (activeConversation.group?.name || 'Group Chat')
    : (otherMember?.display_name || otherMember?.username || 'Private Chat');
  const avatarUrl = isGroup
    ? activeConversation.group?.avatar_url
    : otherMember?.avatar_url;
  const isOnline = isGroup ? false : (otherMember?.id ? onlineUserIds.has(otherMember.id) : false);

  useEffect(() => {
    if (!activeConversation.id) return;
    loadConversationDetailsData();
  }, [activeConversation.id]);

  const loadConversationDetailsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch media attachments (images/videos)
      const { data: mediaData } = await supabase
        .from('message_attachments')
        .select('*, messages!inner(conversation_id)')
        .eq('messages.conversation_id', activeConversation.id)
        .or('file_type.ilike.image/%,file_type.ilike.video/%')
        .order('created_at', { ascending: false })
        .limit(12);

      if (mediaData) setMediaList(mediaData as any);

      // 2. Fetch document attachments (PDF, DOC, ZIP, etc.)
      const { data: filesData } = await supabase
        .from('message_attachments')
        .select('*, messages!inner(conversation_id)')
        .eq('messages.conversation_id', activeConversation.id)
        .not('file_type', 'ilike', 'image/%')
        .not('file_type', 'ilike', 'video/%')
        .not('file_type', 'ilike', 'audio/%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (filesData) setFileList(filesData as any);

      // 3. Fetch shared links in message content
      const { data: textMessages } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', activeConversation.id)
        .ilike('content', '%http%')
        .order('created_at', { ascending: false })
        .limit(15);

      if (textMessages) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links: { url: string; text: string }[] = [];
        textMessages.forEach(m => {
          const matches = m.content.match(urlRegex);
          if (matches) {
            matches.forEach((url: string) => {
              links.push({ url, text: url.replace(/^https?:\/\//, '') });
            });
          }
        });
        setLinkList(links);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!otherMember || !user) return;
    if (!confirm(`Block ${name}? You will no longer receive messages or calls from them.`)) return;
    try {
      await supabase
        .from('blocked_users')
        .insert({ user_id: user.id, blocked_user_id: otherMember.id });
      alert(`${name} has been blocked.`);
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const handleReportUser = async () => {
    if (!otherMember || !user) return;
    const reason = prompt(`Report ${name} for inappropriate behavior:`, 'Spam or harassment');
    if (!reason) return;
    try {
      await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: otherMember.id,
          conversation_id: activeConversation.id,
          reason,
          description: `User reported via details panel: ${reason}`
        });
      alert('Report submitted successfully. Thank you for keeping ChatFlow safe.');
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to report user:', err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'File';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 text-zinc-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <h3 className="font-semibold text-lg">Details</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User / Group Info Banner */}
      <div className="p-6 flex flex-col items-center border-b border-zinc-800">
        <div className="w-24 h-24 rounded-full bg-zinc-800 mb-4 overflow-hidden border-2 border-zinc-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold mb-1">{name}</h2>
        <p className="text-sm text-zinc-400 mb-4">
          {isGroup ? `Group • ${members.length} members` : (isOnline ? 'Online' : 'Offline')}
        </p>

        {otherMember?.bio && (
          <p className="text-xs text-zinc-400 text-center max-w-xs mb-4 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
            "{otherMember.bio}"
          </p>
        )}
      </div>

      {/* Media & Files Sections */}
      <div className="p-4 space-y-6">
        {/* Shared Media */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Shared Media ({mediaList.length})
          </h4>
          {mediaList.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mediaList.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveMediaUrl(item.file_url)}
                  className="aspect-square bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-emerald-500/50 transition-colors"
                >
                  <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No media shared yet</p>
          )}
        </div>

        {/* Shared Files */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Shared Files ({fileList.length})
          </h4>
          {fileList.length > 0 ? (
            <div className="space-y-2">
              {fileList.map(item => (
                <a
                  key={item.id}
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl border border-zinc-800/60 transition-colors group"
                >
                  <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 group-hover:text-white truncate font-medium">{item.file_name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{formatFileSize(item.file_size)}</p>
                  </div>
                  <Download className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No files shared yet</p>
          )}
        </div>

        {/* Shared Links */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Shared Links ({linkList.length})
          </h4>
          {linkList.length > 0 ? (
            <div className="space-y-2">
              {linkList.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl border border-zinc-800/60 transition-colors group"
                >
                  <LinkIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-zinc-300 group-hover:text-white truncate flex-1 font-mono">
                    {item.text}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No links shared yet</p>
          )}
        </div>

        {/* Block & Report Actions */}
        {!isGroup && otherMember && (
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <Button
              variant="ghost"
              onClick={handleBlockUser}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
            >
              <Ban className="h-4 w-4" /> Block {name}
            </Button>
            <Button
              variant="ghost"
              onClick={handleReportUser}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
            >
              <ShieldAlert className="h-4 w-4" /> Report {name}
            </Button>
          </div>
        )}
      </div>

      {/* Fullscreen Image Preview */}
      {activeMediaUrl && (
        <ImageViewer src={activeMediaUrl} onClose={() => setActiveMediaUrl(null)} />
      )}
    </div>
  );
}
