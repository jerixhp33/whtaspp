import { supabase } from '../lib/supabase';

export const mediaService = {
  uploadFile: async (bucket: string, path: string, file: File, onProgress?: (progress: number) => void) => {
    // simplified implementation
    return supabase.storage.from(bucket).upload(path, file);
  },
  uploadAvatar: async (file: File) => supabase.storage.from('avatars').upload(`${Date.now()}_${file.name}`, file),
  getSignedUrl: async (bucket: string, path: string) => supabase.storage.from(bucket).createSignedUrl(path, 60 * 60),
  deleteFile: async (bucket: string, path: string) => supabase.storage.from(bucket).remove([path]),
  validateFile: (file: File, type: string, size: number) => {
    if (file.size > size) return false;
    if (!file.type.includes(type)) return false;
    return true;
  }
};
