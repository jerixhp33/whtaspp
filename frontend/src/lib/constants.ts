export const APP_NAME = 'ChatFlow';
export const APP_VERSION = '1.0.0';

export const MESSAGE_TYPES = ['text', 'image', 'video', 'audio', 'document', 'voice', 'location', 'contact', 'system'] as const;

export const MAX_FILE_SIZES = {
  avatar: 2 * 1024 * 1024, // 2MB
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  audio: 10 * 1024 * 1024, // 10MB
  document: 100 * 1024 * 1024, // 100MB
  voice: 10 * 1024 * 1024, // 10MB
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export const API_PERMISSIONS = [
  'users:read',
  'contacts:read',
  'contacts:write',
  'conversations:read',
  'conversations:write',
  'messages:read',
  'messages:send',
  'notifications:send',
] as const;

export const MESSAGES_PER_PAGE = 50;
export const CONVERSATIONS_PER_PAGE = 30;
export const USERS_PER_PAGE = 20;
