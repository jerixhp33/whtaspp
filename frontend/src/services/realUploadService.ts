import { supabase } from '../lib/supabase';

export interface UploadItem {
  id: string;
  file: File | Blob;
  fileName: string;
  fileType: string;
  fileSize: number;
  bucket: 'message-media' | 'voice-messages' | 'documents';
  storagePath?: string;
  thumbnailBlob?: Blob;
  duration?: number;
  progress: number;
  status: 'queued' | 'preparing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  xhr?: XMLHttpRequest;
  onProgress?: (pct: number) => void;
  onComplete?: (result: UploadCompleteResult) => void;
  onError?: (err: Error) => void;
}

export interface UploadCompleteResult {
  id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  duration?: number;
  thumbnail_path?: string;
  bucket: string;
}

class RealUploadService {
  private queue: UploadItem[] = [];
  private activeUploadsCount = 0;
  private maxConcurrent = 2;

  /**
   * Determine the appropriate private bucket
   */
  resolveBucket(fileType: string): 'message-media' | 'voice-messages' | 'documents' {
    const cleanType = fileType.toLowerCase().split(';')[0];
    if (cleanType.startsWith('audio/') || cleanType.includes('webm')) {
      return 'voice-messages';
    }
    if (cleanType.startsWith('image/') || cleanType.startsWith('video/')) {
      return 'message-media';
    }
    return 'documents';
  }

  /**
   * Sanitize file name for safe storage
   */
  sanitizeFileName(originalName: string): string {
    return originalName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 80);
  }

  /**
   * Generate video thumbnail & duration locally
   */
  async generateVideoMeta(file: File | Blob): Promise<{ thumbnailBlob?: Blob; duration?: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1.0;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve({});
      }, 4000);

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 320, 480);
          canvas.height = Math.min(video.videoHeight || 240, 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                cleanup();
                resolve({
                  thumbnailBlob: blob || undefined,
                  duration: Math.round(video.duration || 0),
                });
              },
              'image/jpeg',
              0.8
            );
            return;
          }
        } catch {
          // Ignored
        }
        cleanup();
        resolve({ duration: Math.round(video.duration || 0) });
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve({});
      };
    });
  }

  /**
   * Compress image & create thumbnail locally before upload
   */
  async optimizeImage(file: File): Promise<{ optimizedBlob: Blob; thumbnailBlob?: Blob }> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
        resolve({ optimizedBlob: file });
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ optimizedBlob: file });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (optimizedBlob) => {
            // Generate small thumbnail (240px)
            const thumbCanvas = document.createElement('canvas');
            const thumbDim = 240;
            const thumbRatio = Math.min(thumbDim / width, thumbDim / height);
            thumbCanvas.width = Math.max(1, Math.round(width * thumbRatio));
            thumbCanvas.height = Math.max(1, Math.round(height * thumbRatio));
            const thumbCtx = thumbCanvas.getContext('2d');

            if (thumbCtx) {
              thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
              thumbCanvas.toBlob(
                (thumbBlob) => {
                  resolve({
                    optimizedBlob: optimizedBlob || file,
                    thumbnailBlob: thumbBlob || undefined,
                  });
                },
                'image/jpeg',
                0.75
              );
            } else {
              resolve({ optimizedBlob: optimizedBlob || file });
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ optimizedBlob: file });
      };
    });
  }

  /**
   * Upload an individual blob with real 0-100% XHR progress events
   */
  private uploadBlobWithRealProgress(
    blob: Blob,
    bucket: string,
    path: string,
    onProgress: (pct: number) => void,
    onXhrCreated?: (xhr: XMLHttpRequest) => void
  ): Promise<{ path: string }> {
    return new Promise(async (resolve, reject) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || supabaseAnonKey;

      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
      const xhr = new XMLHttpRequest();

      if (onXhrCreated) {
        onXhrCreated(xhr);
      }

      xhr.open('POST', uploadEndpoint, true);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'true');

      // Byte-accurate real upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve({ path });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload.'));
      };

      xhr.onabort = () => {
        reject(new Error('Upload cancelled by user.'));
      };

      xhr.send(blob);
    });
  }

  /**
   * Queue and execute upload
   */
  upload(item: Omit<UploadItem, 'progress' | 'status'>): string {
    const uploadItem: UploadItem = {
      ...item,
      progress: 0,
      status: 'queued',
    };

    this.queue.push(uploadItem);
    this.processQueue();
    return uploadItem.id;
  }

  /**
   * Cancel an ongoing or queued upload
   */
  cancelUpload(id: string): void {
    const itemIndex = this.queue.findIndex((i) => i.id === id);
    if (itemIndex >= 0) {
      const item = this.queue[itemIndex];
      if (item.xhr) {
        item.xhr.abort();
      }
      item.status = 'cancelled';
      this.queue.splice(itemIndex, 1);
      this.activeUploadsCount = Math.max(0, this.activeUploadsCount - 1);
      this.processQueue();
    }
  }

  /**
   * Process next items in the controlled upload concurrency queue
   */
  private async processQueue() {
    if (this.activeUploadsCount >= this.maxConcurrent) return;

    const nextItem = this.queue.find((i) => i.status === 'queued');
    if (!nextItem) return;

    this.activeUploadsCount++;
    nextItem.status = 'preparing';
    if (nextItem.onProgress) nextItem.onProgress(5);

    try {
      let finalBlob = nextItem.file;
      let duration = nextItem.duration;

      // 1. Process Video
      if (nextItem.fileType.startsWith('video/')) {
        const meta = await this.generateVideoMeta(nextItem.file);
        duration = meta.duration;
        nextItem.thumbnailBlob = meta.thumbnailBlob;
      }
      // 2. Process Image
      else if (nextItem.fileType.startsWith('image/') && nextItem.file instanceof File) {
        const optimized = await this.optimizeImage(nextItem.file);
        finalBlob = optimized.optimizedBlob;
        nextItem.thumbnailBlob = optimized.thumbnailBlob;
      }

      nextItem.status = 'uploading';
      const ext = nextItem.fileName.split('.').pop() || 'bin';
      const storagePath = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      nextItem.storagePath = storagePath;

      // Upload main blob with real progress
      await this.uploadBlobWithRealProgress(
        finalBlob,
        nextItem.bucket,
        storagePath,
        (pct) => {
          nextItem.progress = pct;
          if (nextItem.onProgress) nextItem.onProgress(pct);
        },
        (xhr) => {
          nextItem.xhr = xhr;
        }
      );

      // Upload thumbnail if exists
      let thumbPath: string | undefined = undefined;
      if (nextItem.thumbnailBlob) {
        try {
          thumbPath = `thumb_${storagePath.replace(/\.[^.]+$/, '.jpg')}`;
          await this.uploadBlobWithRealProgress(
            nextItem.thumbnailBlob,
            nextItem.bucket,
            thumbPath,
            () => {}
          );
        } catch (e) {
          console.warn('Thumbnail upload skipped:', e);
        }
      }

      nextItem.status = 'completed';
      nextItem.progress = 100;

      if (nextItem.onComplete) {
        nextItem.onComplete({
          id: nextItem.id,
          storage_path: storagePath,
          file_name: nextItem.fileName,
          file_type: nextItem.fileType,
          file_size: nextItem.fileSize,
          duration,
          thumbnail_path: thumbPath,
          bucket: nextItem.bucket,
        });
      }
    } catch (err: any) {
      if ((nextItem.status as string) !== 'cancelled') {
        nextItem.status = 'failed';
        nextItem.error = err.message || 'Upload failed';
        if (nextItem.onError) nextItem.onError(err);
      }
    } finally {
      this.activeUploadsCount = Math.max(0, this.activeUploadsCount - 1);
      this.queue = this.queue.filter((i) => i.id !== nextItem.id);
      this.processQueue();
    }
  }
}

export const realUploadService = new RealUploadService();
