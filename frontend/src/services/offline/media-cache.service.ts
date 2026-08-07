import { offlineDBService, CachedMedia } from './offline-db.service';

export const mediaCacheService = {
  async cacheMedia(id: string, blob: Blob, mimeType: string, fileName: string): Promise<void> {
    if (!id || !blob) return;
    await offlineDBService.saveMediaBlob(id, blob, mimeType, fileName);
  },

  async getCachedMedia(id: string): Promise<CachedMedia | undefined> {
    if (!id) return undefined;
    return await offlineDBService.getMediaBlob(id);
  },

  async getCachedMediaUrl(id: string): Promise<string | null> {
    const item = await this.getCachedMedia(id);
    if (!item || !item.blob) return null;
    return URL.createObjectURL(item.blob);
  },

  async isMediaCached(id: string): Promise<boolean> {
    const item = await this.getCachedMedia(id);
    return !!item;
  },

  async getStorageStats() {
    return await offlineDBService.getStorageStats();
  },

  async clearAllCache() {
    await offlineDBService.clearLocalCache();
  }
};
