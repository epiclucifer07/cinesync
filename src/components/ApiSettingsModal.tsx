import React, { useState } from 'react';
import {
  Sliders,
  X,
  Key,
  Plus,
  Check,
  AlertCircle,
  Film,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { MediaItem, ApiConfiguration } from '../types/media';
import { apiConfigService } from '../services/apiConfig';

interface ApiSettingsModalProps {
  onClose: () => void;
  onRefreshCatalog: () => void;
  onAddCustomItem: (item: MediaItem) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  onClose,
  onRefreshCatalog,
  onAddCustomItem
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'add' | 'sync'>('api');
  const [config, setConfig] = useState<ApiConfiguration>(apiConfigService.getConfig());
  const [apiKeyInput, setApiKeyInput] = useState(config.tmdbApiKey);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });

  // Custom Media Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [overview, setOverview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [genres, setGenres] = useState('Action, Sci-Fi');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [duration, setDuration] = useState('2h 10m');
  const [customAddedSuccess, setCustomAddedSuccess] = useState(false);

  const customItems = apiConfigService.getCustomMedia();

  const handleSaveApiKey = async () => {
    setTestStatus({ loading: true });
    const trimmed = apiKeyInput.trim();
    const updated = { ...config, tmdbApiKey: trimmed };
    apiConfigService.saveConfig(updated);
    setConfig(updated);

    if (trimmed) {
      const res = await apiConfigService.testTmdbKey(trimmed);
      setTestStatus({
        loading: false,
        success: res.success,
        message: res.message
      });
      if (res.success) {
        onRefreshCatalog();
      }
    } else {
      setTestStatus({
        loading: false,
        success: true,
        message: 'Saved using default high-definition catalog template.'
      });
      onRefreshCatalog();
    }
  };

  const handleCreateCustomMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    const parsedGenres = genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const newItem: MediaItem = {
      id: 'custom-' + Date.now(),
      title: title.trim(),
      type,
      tagline: 'Custom stream addition',
      overview: overview.trim() || 'Custom added title.',
      backdrop:
        backdrop.trim() ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop',
      poster:
        backdrop.trim() ||
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
      rating: 9.0,
      matchPercentage: 96,
      releaseYear: parseInt(releaseYear, 10) || 2026,
      duration: duration.trim() || '2h 00m',
      durationSeconds: 7200,
      ageRating: '16+',
      genres: parsedGenres.length > 0 ? parsedGenres : ['Action'],
      cast: ['Custom Cast'],
      quality: '4K Ultra HD',
      audioTracks: ['English (5.1)', 'Original Stereo'],
      subtitleTracks: ['English [CC]'],
      videoUrl: videoUrl.trim(),
      isTrending: true
    };

    apiConfigService.addCustomMedia(newItem);
    onAddCustomItem(newItem);
    setCustomAddedSuccess(true);
    setTitle('');
    setOverview('');
    setVideoUrl('');
    setBackdrop('');
    setTimeout(() => setCustomAddedSuccess(false), 3000);
  };

  const handleDeleteCustom = (id: string) => {
    apiConfigService.deleteCustomMedia(id);
    onRefreshCatalog();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 text-neutral-100">
        <button
          onClick={onClose}
          aria-label="Close API settings"
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/10">
            <Sliders className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Data Sources & Content Management
            </h2>
            <p className="text-xs text-neutral-400">
              Configure your API keys or add custom streaming media to expand your catalog.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-white/10 mb-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'api'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            TMDB API Key
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'add'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Add Movies & Series ({customItems.length})
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'sync'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Cross-Platform Sync
          </button>
        </div>

        {/* Tab 1: TMDB API Key */}
        {activeTab === 'api' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-red-500" />
                <span>The Movie Database (TMDB) API Key</span>
              </label>
              <p className="text-xs text-neutral-400">
                You can add your TMDB v3 API Key at any time to automatically fetch trending posters, cast, synopsis, and metadata into your streaming template.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your TMDB v3 API Key here..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={testStatus.loading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  {testStatus.loading ? 'Verifying...' : 'Save & Sync'}
                </button>
              </div>

              {testStatus.message && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testStatus.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-950/60 text-red-300 border border-red-500/30'
                  }`}
                >
                  {testStatus.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/30 border border-white/5 space-y-2 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300 block">How to get your API Key:</span>
              <p>
                1. Create a free account at <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-red-400 underline">themoviedb.org</a>.
              </p>
              <p>2. Go to Settings → API and request a Developer API Key.</p>
              <p>3. Paste it here to expand your streaming library with thousands of titles.</p>
            </div>
          </div>
        )}

        {/* Tab 2: Add Custom Movies & Series */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateCustomMedia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Interstellar Drift"
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="movie">Movie</option>
                    <option value="series">TV Series</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  Video Stream URL (MP4 / WebM / HLS) *
                </label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/... or your CDN link"
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  Backdrop / Poster Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={backdrop}
                  onChange={(e) => setBackdrop(e.target.value)}
                  placeholder="https://images.unsplash.com/... or custom image URL"
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Genres</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Sci-Fi, Action"
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2h 15m"
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Synopsis</label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={2}
                  placeholder="Enter synopsis description..."
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Title to Catalog</span>
                </button>

                {customAddedSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-4 h-4" />
                    Added successfully!
                  </span>
                )}
              </div>
            </form>

            {/* Custom Titles List */}
            {customItems.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-neutral-300">Custom Added Titles</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {customItems.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{c.title}</span>
                        <span className="text-neutral-400 ml-2 font-mono">({c.type})</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCustom(c.id)}
                        className="text-neutral-400 hover:text-red-400 p-1 cursor-pointer"
                        title="Delete custom title"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cross-Platform Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-4 text-xs text-neutral-300">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Multi-Device Cloud Sync Status</span>
              </div>
              <p className="text-neutral-400">
                Your watch history, continue watching positions, watchlist bookmarks, and profile preferences are stored locally and ready to sync seamlessly with your backend cloud.
              </p>

              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-white">Device Status: Ready</span>
                </div>
                <span className="text-neutral-400 font-mono text-[11px]">Synced: Just now</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
