// User & Profile
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio: string;
  status: string;
  is_online: boolean;
  last_seen: string;
  is_admin: boolean;
  is_disabled: boolean;
  created_at: string;
  updated_at: string;
}

// Contact
export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  nickname?: string;
  contact: Profile;
  created_at: string;
}

export interface ContactRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  from_user: Profile;
  to_user: Profile;
  created_at: string;
  updated_at: string;
}

// Conversations
export type ConversationType = 'private' | 'group';
export type MemberRole = 'member' | 'admin' | 'owner';

export interface Conversation {
  id: string;
  type: ConversationType;
  created_by?: string;
  last_message?: Message;
  last_message_at?: string;
  unread_count: number;
  members: ConversationMember[];
  group?: Group;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  profile?: Profile;
}

// Messages
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'location' | 'contact' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: MessageType;
  reply_to_id?: string;
  reply_to?: Message;
  forwarded_from_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  reads: MessageRead[];
  metadata: Record<string, any>;
  sender?: Profile;
  status?: MessageStatus;
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  profile?: Profile;
  created_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

// Groups
export interface Group {
  id: string;
  conversation_id: string;
  name: string;
  description: string;
  avatar_url?: string;
  created_by: string;
  max_members: number;
  is_public: boolean;
  invite_link?: string;
  created_at: string;
  updated_at: string;
}

// Calls
export type CallType = 'voice' | 'video';
export type CallStatus = 'initiating' | 'ringing' | 'active' | 'ended' | 'missed' | 'rejected' | 'busy';

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  participants: CallParticipant[];
  caller?: Profile;
  created_at: string;
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  joined_at?: string;
  left_at?: string;
  is_muted: boolean;
  is_camera_off: boolean;
  status: 'invited' | 'ringing' | 'joined' | 'left' | 'rejected';
  profile?: Profile;
}

// Notifications
export type NotificationType = 'message' | 'mention' | 'call' | 'missed_call' | 'contact_request' | 'group_invite' | 'group_activity' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// Settings
export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  language: string;
  notifications_enabled: boolean;
  notification_sound: boolean;
  message_preview: boolean;
  enter_to_send: boolean;
  media_auto_download: boolean;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  last_seen: 'everyone' | 'contacts' | 'nobody';
  profile_photo: 'everyone' | 'contacts' | 'nobody';
  about: 'everyone' | 'contacts' | 'nobody';
  read_receipts: boolean;
  online_status: boolean;
}

// Admin
export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  reported_message_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  resolution_note?: string;
  reporter?: Profile;
  reported_user?: Profile;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata: Record<string, any>;
  actor?: Profile;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  description: string;
  key_prefix: string;
  permissions: string[];
  status: 'active' | 'disabled' | 'revoked' | 'expired';
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  request_count: number;
}

export interface ApiUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_messages: number;
  total_conversations: number;
  total_groups: number;
  total_calls: number;
  pending_reports: number;
  storage_usage: number;
  api_requests: number;
}
