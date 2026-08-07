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
      const rawType = file.type || 'application/octet-stream';
      const cleanContentType = rawType.split(';')[0];
      const fileName = customFileName || (file as File).name || `file_${Date.now()}`;

      if (cleanContentType.startsWith('audio/')) {
        bucket = 'voice-messages';
      } else if (cleanContentType.startsWith('image/') || cleanContentType.startsWith('video/')) {
        bucket = 'message-media';
      } else {
        bucket = 'documents';
      }

      // Generate clean file path
      const extParts = fileName.split('.');
      const ext = extParts.length > 1 ? extParts.pop() : 'webm';
      const path = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      setProgress(40);

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: cleanContentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr || !data) {
        console.error('Supabase storage upload error details:', uploadErr);
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
        file_type: cleanContentType,
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
