import { DownloadedItem, MediaItem, Episode } from '../types/media';

const DOWNLOADS_KEY = 'cinesync_downloaded_items';
const OFFLINE_MODE_KEY = 'cinesync_offline_mode_simulation';

export interface ActiveDownloadProgress {
  downloadId: string;
  mediaId: string;
  episodeId?: string;
  title: string;
  quality: '4K Ultra HD' | '1080p' | '720p';
  progress: number; // 0 - 100
  speedMbps: number;
  totalSizeMB: number;
  downloadedMB: number;
  status: 'downloading' | 'completed' | 'paused' | 'failed';
}

class OfflineStorageService {
  private activeDownloads: Map<string, ActiveDownloadProgress> = new Map();
  private progressListeners: ((active: ActiveDownloadProgress[]) => void)[] = [];

  constructor() {
    // Initial check
  }

  public getDownloadedItems(): DownloadedItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(DOWNLOADS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  public isDownloaded(mediaId: string, episodeId?: string): boolean {
    const list = this.getDownloadedItems();
    return list.some(
      (item) => item.mediaId === mediaId && (!episodeId || item.episodeId === episodeId)
    );
  }

  public getDownloadedItem(mediaId: string, episodeId?: string): DownloadedItem | undefined {
    const list = this.getDownloadedItems();
    return list.find(
      (item) => item.mediaId === mediaId && (!episodeId || item.episodeId === episodeId)
    );
  }

  public getIsOfflineMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
  }

  public setOfflineMode(enabled: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
  }

  public getStorageMetrics(): {
    usedMB: number;
    availableMB: number;
    totalDeviceMB: number;
    downloadCount: number;
  } {
    const items = this.getDownloadedItems();
    const usedMB = items.reduce((acc, curr) => acc + curr.fileSizeMB, 0);
    const totalDeviceMB = 64 * 1024; // 64 GB simulated
    const availableMB = Math.max(0, totalDeviceMB - usedMB - 18 * 1024); // OS reserved
    return {
      usedMB,
      availableMB,
      totalDeviceMB,
      downloadCount: items.length
    };
  }

  public onProgressUpdate(listener: (active: ActiveDownloadProgress[]) => void): () => void {
    this.progressListeners.push(listener);
    listener(Array.from(this.activeDownloads.values()));
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== listener);
    };
  }

  private notifyProgress() {
    const list = Array.from(this.activeDownloads.values());
    this.progressListeners.forEach((l) => l(list));
  }

  public startDownload(
    media: MediaItem,
    quality: '4K Ultra HD' | '1080p' | '720p' = '1080p',
    episode?: Episode
  ): string {
    const downloadId = `${media.id}_${episode ? episode.id : 'full'}_${Date.now()}`;

    // Calculate approximate size
    let sizeMB = 1850;
    if (quality === '4K Ultra HD') sizeMB = 4320;
    if (quality === '720p') sizeMB = 890;
    if (episode) sizeMB = Math.round(sizeMB * 0.4); // Episodes are ~40% size of feature films

    const initialProgress: ActiveDownloadProgress = {
      downloadId,
      mediaId: media.id,
      episodeId: episode?.id,
      title: episode ? `${media.title}: S${episode.seasonNumber}E${episode.episodeNumber}` : media.title,
      quality,
      progress: 5,
      speedMbps: Math.floor(Math.random() * 25) + 35, // ~35-60 Mbps
      totalSizeMB: sizeMB,
      downloadedMB: Math.round(sizeMB * 0.05),
      status: 'downloading'
    };

    this.activeDownloads.set(downloadId, initialProgress);
    this.notifyProgress();

    // Simulate fast streaming chunk download
    const interval = setInterval(() => {
      const current = this.activeDownloads.get(downloadId);
      if (!current || current.status !== 'downloading') {
        clearInterval(interval);
        return;
      }

      const nextProgress = Math.min(100, current.progress + Math.floor(Math.random() * 12) + 8);
      const downloadedMB = Math.round((current.totalSizeMB * nextProgress) / 100);

      if (nextProgress >= 100) {
        clearInterval(interval);
        this.activeDownloads.delete(downloadId);
        this.notifyProgress();

        // Save completed item
        const newItem: DownloadedItem = {
          id: downloadId,
          mediaId: media.id,
          episodeId: episode?.id,
          title: media.title,
          subtitle: episode ? `Season ${episode.seasonNumber}, Ep ${episode.episodeNumber}: ${episode.title}` : undefined,
          thumbnail: episode ? episode.thumbnail : media.backdrop || media.poster,
          fileSizeMB: current.totalSizeMB,
          quality,
          downloadedAt: Date.now(),
          videoUrl: episode ? episode.videoUrl : media.videoUrl,
          type: media.type
        };

        const existing = this.getDownloadedItems();
        existing.unshift(newItem);
        localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(existing));
      } else {
        current.progress = nextProgress;
        current.downloadedMB = downloadedMB;
        current.speedMbps = Math.floor(Math.random() * 20) + 40;
        this.activeDownloads.set(downloadId, current);
        this.notifyProgress();
      }
    }, 400);

    return downloadId;
  }

  public deleteDownloadedItem(id: string) {
    const list = this.getDownloadedItems().filter((item) => item.id !== id);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
  }

  public clearAllDownloads() {
    localStorage.removeItem(DOWNLOADS_KEY);
  }
}

export const offlineStorageService = new OfflineStorageService();
