import React, { useState } from 'react';
import {
  X,
  Play,
  Users,
  Plus,
  Check,
  Download,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { MediaItem, Episode } from '../types/media';

interface MediaDetailModalProps {
  item: MediaItem;
  isInWatchlist: boolean;
  isDownloaded: boolean;
  onClose: () => void;
  onPlay: (item: MediaItem, episode?: Episode) => void;
  onStartWatchParty: (item: MediaItem, episode?: Episode) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onDownload: (item: MediaItem, quality: '4K Ultra HD' | '1080p' | '720p', episode?: Episode) => void;
  onSelectSimilar: (item: MediaItem) => void;
  catalog: MediaItem[];
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  isInWatchlist,
  isDownloaded,
  onClose,
  onPlay,
  onStartWatchParty,
  onToggleWatchlist,
  onDownload,
  onSelectSimilar,
  catalog
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'details' | 'similar'>('overview');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showQualityDownloadModal, setShowQualityDownloadModal] = useState(false);
  const [targetEpisodeToDownload, setTargetEpisodeToDownload] = useState<Episode | undefined>();

  const isSeries = item.type === 'series';
  const episodesForSeason = item.episodes?.filter((e) => e.seasonNumber === selectedSeason) || [];
  const similarItems = catalog.filter(
    (c) => c.id !== item.id && c.genres.some((g) => item.genres.includes(g))
  ).slice(0, 4);

  const handleDownloadClick = (ep?: Episode) => {
    setTargetEpisodeToDownload(ep);
    setShowQualityDownloadModal(true);
  };

  const confirmDownload = (quality: '4K Ultra HD' | '1080p' | '720p') => {
    onDownload(item, quality, targetEpisodeToDownload);
    setShowQualityDownloadModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8 text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] min-h-[260px] bg-neutral-950 overflow-hidden">
          <img
            src={item.backdrop || item.poster}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017] via-[#0e1017]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1017]/80 via-transparent to-transparent" />

          {/* Title & Quick Action bar placed on hero */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-wider mb-1.5">
                <span>{item.type === 'series' ? 'TV Series' : 'Feature Film'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-neutral-400">{item.releaseYear}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {item.title}
              </h2>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onPlay(item, episodesForSeason[0])}
                className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-900 font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm shadow-xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </button>
              <button
                onClick={() => onStartWatchParty(item, episodesForSeason[0])}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Watch Party</span>
              </button>
              <button
                onClick={() => onToggleWatchlist(item)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                title={isInWatchlist ? 'Remove from List' : 'Add to List'}
              >
                {isInWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDownloadClick()}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Download Offline"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-white/10 flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          {isSeries && item.episodes && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`py-3.5 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'episodes'
                  ? 'border-red-500 text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Episodes ({item.episodes.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'details'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Audio & Tech Specs
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            className={`py-3.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'similar'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            More Like This
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-300">
                  <span className="text-emerald-400 font-bold">{item.matchPercentage}% Match</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span>{item.releaseYear}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="border border-white/20 rounded px-1.5 py-0.5 text-neutral-200">
                    {item.ageRating}
                  </span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span>{item.duration}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="border border-neutral-700 rounded px-1.5 py-0.5 text-neutral-300 font-mono">
                    {item.quality}
                  </span>
                </div>

                {/* Synopsis */}
                <p className="text-sm leading-relaxed text-neutral-300">
                  {item.overview}
                </p>

                {/* Genres */}
                <div className="pt-2">
                  <span className="text-xs text-neutral-500 block mb-1">Genres</span>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                    {item.genres.map((g, i) => (
                      <span key={g} className="text-neutral-300">
                        {g}{i < item.genres.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cast & Director sidebar */}
              <div className="space-y-4 text-xs bg-neutral-900/40 p-4 rounded-xl border border-white/5">
                {item.director && (
                  <div>
                    <span className="text-neutral-500 block mb-1">Director</span>
                    <span className="text-white font-medium">{item.director}</span>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500 block mb-1">Cast</span>
                  <div className="space-y-1">
                    {item.cast.map((actor) => (
                      <div key={actor} className="text-neutral-300">
                        {actor}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'episodes' && isSeries && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h4 className="text-sm font-bold text-white">Season 1</h4>
                <span className="text-xs text-neutral-400">{episodesForSeason.length} Episodes</span>
              </div>

              <div className="space-y-3">
                {episodesForSeason.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-28 sm:w-36 aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0">
                        <img
                          src={ep.thumbnail || item.backdrop}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={() => onPlay(item, ep)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Play className="w-6 h-6 text-white fill-current opacity-90" />
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-400">
                            {ep.episodeNumber}.
                          </span>
                          <h5 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                            {ep.title}
                          </h5>
                        </div>
                        <span className="text-xs text-neutral-400">{ep.duration}</span>
                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 max-w-md">
                          {ep.overview}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => onStartWatchParty(item, ep)}
                        title="Watch Party this episode"
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadClick(ep)}
                        title="Download this episode"
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6 text-xs text-neutral-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900/60 rounded-xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-sm text-white">Audio Formats</h4>
                  <ul className="space-y-1 text-neutral-400">
                    {item.audioTracks.map((tr) => (
                      <li key={tr} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>{tr}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-neutral-900/60 rounded-xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-sm text-white">Subtitles & Closed Captions</h4>
                  <ul className="space-y-1 text-neutral-400">
                    {item.subtitleTracks.map((sub) => (
                      <li key={sub} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-neutral-900/40 rounded-xl border border-white/5">
                <h4 className="font-bold text-sm text-white mb-2">Video Encoding & Playback Specs</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-neutral-400">
                  <div>
                    <span className="text-neutral-500 block">Resolution</span>
                    <span className="font-semibold text-white">{item.quality}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Color Space</span>
                    <span className="font-semibold text-white">BT.2020 / HDR10</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Frame Rate</span>
                    <span className="font-semibold text-white">24.000 fps (Cinema)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Audio Codec</span>
                    <span className="font-semibold text-white">Dolby Digital Plus 7.1</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarItems.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onSelectSimilar(sim)}
                  className="rounded-lg overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                >
                  <div className="aspect-[16/9] bg-neutral-950 overflow-hidden">
                    <img
                      src={sim.backdrop || sim.poster}
                      alt={sim.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2.5">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-red-400">
                      {sim.title}
                    </h5>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-1">
                      <span className="text-emerald-400">{sim.matchPercentage}%</span>
                      <span>·</span>
                      <span>{sim.releaseYear}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Download Selection Modal Overlay */}
        {showQualityDownloadModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="bg-[#12141e] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white">Select Download Quality</h4>
                <button
                  onClick={() => setShowQualityDownloadModal(false)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Downloaded titles are cached locally for offline playback without network access.
              </p>

              <div className="space-y-2">
                {[
                  { q: '4K Ultra HD', desc: 'Best clarity for 4K screens', size: '4.2 GB' },
                  { q: '1080p', desc: 'Balanced high-definition quality', size: '1.8 GB' },
                  { q: '720p', desc: 'Standard definition, saves device storage', size: '840 MB' }
                ].map((tier) => (
                  <button
                    key={tier.q}
                    onClick={() => confirmDownload(tier.q as any)}
                    className="w-full p-3 rounded-lg bg-neutral-900 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-red-400">
                        {tier.q}
                      </div>
                      <div className="text-[10px] text-neutral-400">{tier.desc}</div>
                    </div>
                    <span className="text-xs font-mono text-neutral-400 group-hover:text-white">
                      ~{tier.size}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
