import { supabase } from '../lib/supabase';
import { mediaCacheService } from './offline/media-cache.service';

interface SignedUrlCacheEntry {
  url: string;
  expiresAt: number;
}

class MediaService {
  private signedUrlCache = new Map<string, SignedUrlCacheEntry>();

  /**
   * Check if online
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Parse bucket and file path from full Supabase URL or relative path
   */
  parseStoragePath(rawUrlOrPath: string, defaultBucket: string = 'documents'): { bucket: string; path: string } {
    if (!rawUrlOrPath) return { bucket: defaultBucket, path: '' };

    // If it's a full Supabase storage URL
    // e.g. https://xyz.supabase.co/storage/v1/object/public/documents/1786111282573_8kyr6c.pdf
    if (rawUrlOrPath.includes('/storage/v1/object/')) {
      const match = rawUrlOrPath.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/);
      if (match && match[1] && match[2]) {
        return { bucket: match[1], path: decodeURIComponent(match[2]) };
      }
    }

    return { bucket: defaultBucket, path: rawUrlOrPath };
  }

  /**
   * Download a blob using Supabase client with authenticated storage API
   */
  async getMediaBlob(rawUrlOrPath: string, bucket: string = 'documents'): Promise<{ blob: Blob; blobUrl: string } | null> {
    if (!rawUrlOrPath) return null;

    const { bucket: resolvedBucket, path } = this.parseStoragePath(rawUrlOrPath, bucket);
    const cacheKey = `${resolvedBucket}:${path}`;

    // 1. Check offline IndexedDB cache first
    try {
      const cached = await mediaCacheService.getCachedMedia(cacheKey);
      if (cached?.blob) {
        return {
          blob: cached.blob,
          blobUrl: URL.createObjectURL(cached.blob),
        };
      }
    } catch (e) {
      console.warn('Cache lookup warning:', e);
    }

    // 2. If offline and not in cache, return null
    if (!this.isOnline()) return null;

    // 3. Download directly via authenticated Supabase Storage client
    try {
      const { data: blob, error } = await supabase.storage
        .from(resolvedBucket)
        .download(path);

      if (!error && blob) {
        // Cache blob in IndexedDB for instant future loads
        await mediaCacheService.cacheMedia(cacheKey, blob, blob.type, path);
        return {
          blob,
          blobUrl: URL.createObjectURL(blob),
        };
      }
    } catch (err) {
      console.warn('Direct supabase download failed, trying signed URL fetch:', err);
    }

    // 4. Fallback to signed URL fetch
    try {
      const signedUrl = await this.getSignedUrl(rawUrlOrPath, resolvedBucket);
      if (signedUrl) {
        const res = await fetch(signedUrl);
        if (res.ok) {
          const blob = await res.blob();
          await mediaCacheService.cacheMedia(cacheKey, blob, blob.type, path);
          return {
            blob,
            blobUrl: URL.createObjectURL(blob),
          };
        }
      }
    } catch (err) {
      console.error('Failed to get media blob:', err);
    }

    return null;
  }

  /**
   * Get authorized signed URL for a storage object with local memory caching
   */
  async getSignedUrl(pathOrUrl: string, bucket: string = 'media', expiresIn: number = 3600): Promise<string | null> {
    if (!pathOrUrl) return null;

    if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
      return pathOrUrl;
    }

    const { bucket: resolvedBucket, path } = this.parseStoragePath(pathOrUrl, bucket);
    if (!path) return pathOrUrl;

    const cacheKey = `${resolvedBucket}:${path}`;
    const now = Date.now();
    const cached = this.signedUrlCache.get(cacheKey);

    if (cached && cached.expiresAt > now + 60 * 1000) {
      return cached.url;
    }

    if (!this.isOnline()) {
      const cachedBlobUrl = await mediaCacheService.getCachedMediaUrl(cacheKey);
      if (cachedBlobUrl) return cachedBlobUrl;
    }

    try {
      const { data, error } = await supabase.storage
        .from(resolvedBucket)
        .createSignedUrl(path, expiresIn);

      if (!error && data?.signedUrl) {
        this.signedUrlCache.set(cacheKey, {
          url: data.signedUrl,
          expiresAt: now + expiresIn * 1000,
        });
        return data.signedUrl;
      }

      // If signed URL creation fails, fallback to public URL
      const { data: pubData } = supabase.storage.from(resolvedBucket).getPublicUrl(path);
      return pubData?.publicUrl || null;
    } catch (err) {
      console.warn('Failed to get signed URL:', err);
      const cachedBlobUrl = await mediaCacheService.getCachedMediaUrl(cacheKey);
      return cachedBlobUrl || null;
    }
  }

  /**
   * Download media cleanly with authorized access and user-friendly filename
   */
  async downloadMedia(
    rawUrlOrPath: string,
    customFileName?: string,
    fileType: 'image' | 'video' | 'voice' | 'document' | 'file' = 'file',
    bucket: string = 'documents'
  ): Promise<boolean> {
    try {
      const result = await this.getMediaBlob(rawUrlOrPath, bucket);
      if (!result) {
        alert('Media file is currently unavailable. Please check your network connection.');
        return false;
      }

      const { blob, blobUrl } = result;

      // Clean filename generation
      let finalName = customFileName;
      if (!finalName || finalName.includes('supabase.co') || finalName.length > 80) {
        const dateStr = new Date().toISOString().split('T')[0];
        const ext = this.getExtensionFromMime(blob.type) || 'pdf';
        const typeLabel = fileType === 'voice' ? 'Voice' : fileType === 'video' ? 'Video' : fileType === 'image' ? 'Image' : 'Document';
        finalName = `ChatFlow_${typeLabel}_${dateStr}_${Date.now().toString().slice(-4)}.${ext}`;
      }

      // Trigger browser download via Blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return true;
    } catch (err: any) {
      console.error('Download media failed:', err);
      alert('Could not download file. Please check your connection.');
      return false;
    }
  }

  /**
   * Helper to format file sizes
   */
  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private getExtensionFromMime(mime: string): string {
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3';
    if (mime.includes('pdf')) return 'pdf';
    return 'bin';
  }
}

export const mediaService = new MediaService();
