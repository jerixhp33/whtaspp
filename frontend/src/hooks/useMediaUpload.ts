import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UploadResult {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  bucket: string;
}

export const useMediaUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File | Blob, customFileName?: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(10);
    setError(null);

    try {
      let bucket = 'message-media';
      const fileType = file.type || 'application/octet-stream';
      const fileName = customFileName || (file as File).name || `file_${Date.now()}`;

      if (fileType.startsWith('audio/')) {
        bucket = 'voice-messages';
      } else if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
        bucket = 'message-media';
      } else {
        bucket = 'documents';
      }

      // Generate unique file path
      const ext = fileName.split('.').pop() || 'bin';
      const path = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      setProgress(40);

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadErr || !data) {
        throw uploadErr || new Error('Upload failed');
      }

      setProgress(80);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      setIsUploading(false);

      return {
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: file.size,
        bucket,
      };
    } catch (err: any) {
      console.error('Media upload error:', err);
      setError(err.message || 'File upload failed');
      setIsUploading(false);
      return null;
    }
  };

  return { uploadFile, progress, isUploading, error };
};
