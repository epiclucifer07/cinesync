import React, { useState, useEffect } from 'react';
import {
  Download,
  Play,
  Trash2,
  HardDrive,
  WifiOff,
  Wifi,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Film
} from 'lucide-react';
import { DownloadedItem, MediaItem } from '../types/media';
import { offlineStorageService, ActiveDownloadProgress } from '../services/offlineStorage';

interface DownloadsViewProps {
  onPlayDownloaded: (downloaded: DownloadedItem) => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onExploreCatalog: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  onPlayDownloaded,
  isOfflineMode,
  onToggleOfflineMode,
  onExploreCatalog
}) => {
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownloadProgress[]>([]);
  const [metrics, setMetrics] = useState({ usedMB: 0, availableMB: 0, totalDeviceMB: 64 * 1024, downloadCount: 0 });

  const loadData = () => {
    setDownloadedItems(offlineStorageService.getDownloadedItems());
    setMetrics(offlineStorageService.getStorageMetrics());
  };

  useEffect(() => {
    loadData();
    const unsub = offlineStorageService.onProgressUpdate((active) => {
      setActiveDownloads(active);
      loadData();
    });
    return () => unsub();
  }, []);

  const handleDelete = (id: string) => {
    offlineStorageService.deleteDownloadedItem(id);
    loadData();
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all downloaded offline titles?')) {
      offlineStorageService.clearAllDownloads();
      loadData();
    }
  };

  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const usedPercentage = Math.min(
    100,
    Math.round((metrics.usedMB / (metrics.totalDeviceMB || 1)) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            <span>Offline Entertainment Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Downloads & Offline Viewing</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Watch your downloaded movies and series without WiFi or cellular data.
          </p>
        </div>

        {/* Action Controls: Offline Mode Toggle & Clear All */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleOfflineMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4" />}
            <span>{isOfflineMode ? 'Offline Mode Active' : 'Test Offline Mode'}</span>
          </button>

          {downloadedItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
              title="Delete all downloads"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Storage Meter Bar */}
      <div className="my-6 p-4 rounded-xl bg-neutral-900/60 border border-white/10">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2 text-neutral-300">
            <HardDrive className="w-4 h-4 text-neutral-400" />
            <span className="font-semibold text-white">Device Storage</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono font-medium">
              {formatSize(metrics.usedMB)} Used by CineSync
            </span>
          </div>
          <span className="text-neutral-400 font-mono">
            {formatSize(metrics.availableMB)} Available
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(2, usedPercentage)}%` }}
          />
        </div>
      </div>

      {/* Active Downloads In Progress */}
      {activeDownloads.length > 0 && (
        <div className="mb-8 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Downloading ({activeDownloads.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDownloads.map((act) => (
              <div
                key={act.downloadId}
                className="p-3 rounded-xl bg-neutral-900 border border-emerald-500/30 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white truncate max-w-[200px]">
                    {act.title}
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {act.progress}% ({act.speedMbps} Mbps)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${act.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                  <span>{act.quality}</span>
                  <span className="font-mono">
                    {formatSize(act.downloadedMB)} / {formatSize(act.totalSizeMB)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Downloads List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">
            Downloaded Titles ({downloadedItems.length})
          </h3>
          <span className="text-xs text-neutral-400">Available offline</span>
        </div>

        {downloadedItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 text-neutral-400 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No Downloads Yet</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Download your favorite movies and series to watch anywhere, even when traveling or offline.
              </p>
            </div>
            <button
              onClick={onExploreCatalog}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>Browse Catalog</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {downloadedItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] w-full bg-neutral-950 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play Action Overlay */}
                  <button
                    onClick={() => onPlayDownloaded(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-2xl">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </button>

                  {/* Offline Tag */}
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    {item.quality}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs text-neutral-400 truncate">
                        {item.subtitle}
                      </p>
                    )}
                    <div className="text-[11px] text-neutral-400 font-mono mt-1 flex items-center gap-2">
                      <span>{formatSize(item.fileSizeMB)}</span>
                      <span>·</span>
                      <span>{new Date(item.downloadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onPlayDownloaded(item)}
                      className="p-2 rounded-lg bg-white hover:bg-neutral-200 text-neutral-900 transition-colors cursor-pointer"
                      title="Play Offline"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-red-600/30 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
