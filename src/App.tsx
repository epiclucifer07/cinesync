import React, { useState, useEffect, useMemo } from 'react';
import { Film, Users, Download, Sliders, Search, WifiOff, Plus, Play, Sparkles, Filter } from 'lucide-react';
import {
  MediaItem,
  Episode,
  UserProfile,
  WatchPartyRoom,
  DownloadedItem,
  WatchHistoryItem
} from './types/media';
import { INITIAL_CATALOG, GENRES_LIST } from './data/mockCatalog';
import { userService } from './services/userService';
import { offlineStorageService } from './services/offlineStorage';
import { apiConfigService } from './services/apiConfig';
import { partySyncService } from './services/partySync';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MediaRow } from './components/MediaRow';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MediaDetailModal } from './components/MediaDetailModal';
import { WatchPartyHubModal } from './components/WatchPartyHubModal';
import { DownloadsView } from './components/DownloadsView';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  // Profiles & User state
  const [profiles] = useState<UserProfile[]>(userService.getProfiles());
  const [activeProfile, setActiveProfile] = useState<UserProfile>(userService.getActiveProfile());
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'home' | 'series' | 'movies' | 'parties' | 'downloads'>('home');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Catalog
  const [catalog, setCatalog] = useState<MediaItem[]>(INITIAL_CATALOG);

  // Offline Mode & Downloads
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(offlineStorageService.getIsOfflineMode());
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);

  // Modals & Active Player
  const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | undefined>();
  const [playingPartyRoom, setPlayingPartyRoom] = useState<WatchPartyRoom | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);

  const [isPartyHubOpen, setIsPartyHubOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isProfilesOpen, setIsProfilesOpen] = useState(false);

  // Sync profile data on mount or change
  useEffect(() => {
    setWatchlistIds(userService.getWatchlist(activeProfile.id));
    setWatchHistory(userService.getWatchHistory(activeProfile.id));
  }, [activeProfile.id]);

  // Load catalog including custom added titles
  const refreshCatalog = async () => {
    const custom = apiConfigService.getCustomMedia();
    const config = apiConfigService.getConfig();
    let merged = [...custom, ...INITIAL_CATALOG];

    if (config.tmdbApiKey) {
      const tmdbItems = await apiConfigService.fetchTmdbTrending(config.tmdbApiKey);
      if (tmdbItems.length > 0) {
        merged = [...custom, ...tmdbItems, ...INITIAL_CATALOG];
      }
    }

    setCatalog(merged);
    setDownloadedItems(offlineStorageService.getDownloadedItems());
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Listen to party room query param on page load (e.g. ?party=NEO-2099)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const partyCode = params.get('party');
      if (partyCode) {
        const foundMedia = catalog[0];
        const room = partySyncService.getOrCreateRoom(partyCode, foundMedia.id, activeProfile);
        setPlayingPartyRoom(room);
        setPlayingItem(foundMedia);
      }
    }
  }, [catalog, activeProfile]);

  // Toggle watchlist
  const handleToggleWatchlist = (item: MediaItem) => {
    const isAdded = userService.toggleWatchlist(activeProfile.id, item.id);
    setWatchlistIds(userService.getWatchlist(activeProfile.id));
  };

  // Downloads trigger
  const handleDownload = (
    item: MediaItem,
    quality: '4K Ultra HD' | '1080p' | '720p' = '1080p',
    episode?: Episode
  ) => {
    offlineStorageService.startDownload(item, quality, episode);
    // Switch to downloads tab to see progress
    setActiveTab('downloads');
  };

  const handleToggleOfflineMode = () => {
    const next = !isOfflineMode;
    setIsOfflineMode(next);
    offlineStorageService.setOfflineMode(next);
  };

  // Play downloaded item
  const handlePlayDownloaded = (downloaded: DownloadedItem) => {
    const matchedMedia = catalog.find((c) => c.id === downloaded.mediaId) || {
      id: downloaded.mediaId,
      title: downloaded.title,
      type: downloaded.type,
      overview: 'Downloaded for offline playback.',
      backdrop: downloaded.thumbnail,
      poster: downloaded.thumbnail,
      rating: 9.0,
      matchPercentage: 99,
      releaseYear: 2026,
      duration: 'Offline File',
      durationSeconds: 3600,
      ageRating: '16+',
      genres: ['Offline'],
      cast: [],
      quality: downloaded.quality,
      audioTracks: ['Original Audio'],
      subtitleTracks: ['English [CC]'],
      videoUrl: downloaded.videoUrl
    };

    setPlayingEpisode(undefined);
    setPlayingPartyRoom(null);
    setPlayingItem(matchedMedia as MediaItem);
  };

  // Filtered Catalog by Tab & Search
  const filteredCatalog = useMemo(() => {
    let list = catalog;

    // In simulated offline mode, show only items that are downloaded
    if (isOfflineMode) {
      const downloadedMediaIds = new Set(downloadedItems.map((d) => d.mediaId));
      list = list.filter((m) => downloadedMediaIds.has(m.id));
    }

    if (activeTab === 'series') {
      list = list.filter((m) => m.type === 'series');
    } else if (activeTab === 'movies') {
      list = list.filter((m) => m.type === 'movie');
    }

    if (selectedGenre !== 'All') {
      list = list.filter((m) => m.genres.includes(selectedGenre));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.cast.some((c) => c.toLowerCase().includes(q)) ||
          m.overview.toLowerCase().includes(q)
      );
    }

    return list;
  }, [catalog, activeTab, selectedGenre, searchQuery, isOfflineMode, downloadedItems]);

  // Featured billboard item
  const featuredItem = catalog.find((m) => m.isFeatured) || catalog[0];

  // Continue watching map
  const continueWatchingItems = useMemo(() => {
    const list: MediaItem[] = [];
    watchHistory.forEach((wh) => {
      const found = catalog.find((c) => c.id === wh.mediaId);
      if (found && !list.includes(found)) {
        list.push(found);
      }
    });
    return list;
  }, [watchHistory, catalog]);

  const progressPercentMap = useMemo(() => {
    const map: Record<string, number> = {};
    watchHistory.forEach((wh) => {
      if (wh.durationSeconds > 0) {
        map[wh.mediaId] = Math.round((wh.progressSeconds / wh.durationSeconds) * 100);
      }
    });
    return map;
  }, [watchHistory]);

  const downloadedIds = useMemo(() => {
    return downloadedItems.map((d) => d.mediaId);
  }, [downloadedItems]);

  // Segmented Rows
  const trendingItems = useMemo(() => filteredCatalog.filter((m) => m.isTrending), [filteredCatalog]);
  const top10Items = useMemo(() => filteredCatalog.filter((m) => m.isTop10), [filteredCatalog]);
  const watchlistItems = useMemo(
    () => filteredCatalog.filter((m) => watchlistIds.includes(m.id)),
    [filteredCatalog, watchlistIds]
  );
  const sciFiItems = useMemo(
    () => filteredCatalog.filter((m) => m.genres.includes('Sci-Fi')),
    [filteredCatalog]
  );
  const documentaryItems = useMemo(
    () => filteredCatalog.filter((m) => m.genres.includes('Documentary')),
    [filteredCatalog]
  );

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'parties') {
            setIsPartyHubOpen(true);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeProfile={activeProfile}
        onOpenProfiles={() => setIsProfilesOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        onOpenPartyHub={() => setIsPartyHubOpen(true)}
        downloadCount={downloadedItems.length}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={handleToggleOfflineMode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If in Downloads Tab, render Downloads View */}
        {activeTab === 'downloads' ? (
          <DownloadsView
            onPlayDownloaded={handlePlayDownloaded}
            isOfflineMode={isOfflineMode}
            onToggleOfflineMode={handleToggleOfflineMode}
            onExploreCatalog={() => setActiveTab('home')}
          />
        ) : (
          <>
            {/* Hero Billboard (Rendered when no search query and on Home/Series/Movies) */}
            {!searchQuery && selectedGenre === 'All' && featuredItem && (
              <HeroBanner
                item={featuredItem}
                onPlay={(item) => {
                  setPlayingPartyRoom(null);
                  setPlayingEpisode(undefined);
                  setPlayingItem(item);
                }}
                onStartWatchParty={(item) => {
                  const room = partySyncService.getOrCreateRoom(
                    'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                    item.id,
                    activeProfile
                  );
                  setPlayingPartyRoom(room);
                  setPlayingItem(item);
                }}
                onMoreInfo={(item) => setDetailItem(item)}
                isInWatchlist={watchlistIds.includes(featuredItem.id)}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {/* Filter Bar: Genre tabs with clean styling (Interactive segmented button tabs) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-xl shrink-0">
                {GENRES_LIST.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      selectedGenre === genre
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Quick Watch Party Hub launch pill */}
              <button
                onClick={() => setIsPartyHubOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>Host / Join Watch Party</span>
              </button>
            </div>

            {/* Search Results Grid (if search active) */}
            {searchQuery ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Search Results for "{searchQuery}"
                  </h2>
                  <span className="text-xs text-neutral-400">{filteredCatalog.length} titles found</span>
                </div>

                {filteredCatalog.length === 0 ? (
                  <div className="p-16 text-center rounded-2xl bg-neutral-900/40 border border-white/5 space-y-3">
                    <Search className="w-8 h-8 text-neutral-500 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-300">No matching titles found</p>
                    <p className="text-xs text-neutral-500">
                      Try searching by genre, cast, or add custom titles in Settings.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setDetailItem(item)}
                        className="rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="aspect-[16/9] bg-neutral-950 overflow-hidden">
                          <img
                            src={item.backdrop || item.poster}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-1">
                            <span className="text-emerald-400 font-semibold">{item.matchPercentage}%</span>
                            <span>·</span>
                            <span>{item.releaseYear}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Content Rows */
              <div className="space-y-6 pb-20">
                {/* Continue Watching for Active Profile */}
                {continueWatchingItems.length > 0 && selectedGenre === 'All' && (
                  <MediaRow
                    title={`Continue Watching for ${activeProfile.name}`}
                    items={continueWatchingItems}
                    watchlistIds={watchlistIds}
                    downloadedIds={downloadedIds}
                    progressMap={progressPercentMap}
                    onPlay={(item) => {
                      setPlayingPartyRoom(null);
                      setPlayingEpisode(undefined);
                      setPlayingItem(item);
                    }}
                    onWatchParty={(item) => {
                      const room = partySyncService.getOrCreateRoom(
                        'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                        item.id,
                        activeProfile
                      );
                      setPlayingPartyRoom(room);
                      setPlayingItem(item);
                    }}
                    onToggleWatchlist={handleToggleWatchlist}
                    onMoreInfo={(item) => setDetailItem(item)}
                    onDownload={(item) => handleDownload(item)}
                  />
                )}

                {/* Trending Now */}
                <MediaRow
                  title="Trending Blockbusters & Series"
                  items={trendingItems.length > 0 ? trendingItems : filteredCatalog}
                  watchlistIds={watchlistIds}
                  downloadedIds={downloadedIds}
                  progressMap={progressPercentMap}
                  onPlay={(item) => {
                    setPlayingPartyRoom(null);
                    setPlayingEpisode(undefined);
                    setPlayingItem(item);
                  }}
                  onWatchParty={(item) => {
                    const room = partySyncService.getOrCreateRoom(
                      'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                      item.id,
                      activeProfile
                    );
                    setPlayingPartyRoom(room);
                    setPlayingItem(item);
                  }}
                  onToggleWatchlist={handleToggleWatchlist}
                  onMoreInfo={(item) => setDetailItem(item)}
                  onDownload={(item) => handleDownload(item)}
                />

                {/* Top 10 Ranked */}
                {top10Items.length > 0 && (
                  <MediaRow
                    title="Top 10 Today"
                    items={top10Items}
                    watchlistIds={watchlistIds}
                    downloadedIds={downloadedIds}
                    progressMap={progressPercentMap}
                    isRanked={true}
                    onPlay={(item) => {
                      setPlayingPartyRoom(null);
                      setPlayingEpisode(undefined);
                      setPlayingItem(item);
                    }}
                    onWatchParty={(item) => {
                      const room = partySyncService.getOrCreateRoom(
                        'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                        item.id,
                        activeProfile
                      );
                      setPlayingPartyRoom(room);
                      setPlayingItem(item);
                    }}
                    onToggleWatchlist={handleToggleWatchlist}
                    onMoreInfo={(item) => setDetailItem(item)}
                    onDownload={(item) => handleDownload(item)}
                  />
                )}

                {/* My List / Bookmarks */}
                {watchlistItems.length > 0 && (
                  <MediaRow
                    title="My Watchlist"
                    items={watchlistItems}
                    watchlistIds={watchlistIds}
                    downloadedIds={downloadedIds}
                    progressMap={progressPercentMap}
                    onPlay={(item) => {
                      setPlayingPartyRoom(null);
                      setPlayingEpisode(undefined);
                      setPlayingItem(item);
                    }}
                    onWatchParty={(item) => {
                      const room = partySyncService.getOrCreateRoom(
                        'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                        item.id,
                        activeProfile
                      );
                      setPlayingPartyRoom(room);
                      setPlayingItem(item);
                    }}
                    onToggleWatchlist={handleToggleWatchlist}
                    onMoreInfo={(item) => setDetailItem(item)}
                    onDownload={(item) => handleDownload(item)}
                  />
                )}

                {/* Sci-Fi & Cyberpunk Adventures */}
                {sciFiItems.length > 0 && (
                  <MediaRow
                    title="Sci-Fi & Cyberpunk Sagas"
                    items={sciFiItems}
                    watchlistIds={watchlistIds}
                    downloadedIds={downloadedIds}
                    progressMap={progressPercentMap}
                    onPlay={(item) => {
                      setPlayingPartyRoom(null);
                      setPlayingEpisode(undefined);
                      setPlayingItem(item);
                    }}
                    onWatchParty={(item) => {
                      const room = partySyncService.getOrCreateRoom(
                        'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                        item.id,
                        activeProfile
                      );
                      setPlayingPartyRoom(room);
                      setPlayingItem(item);
                    }}
                    onToggleWatchlist={handleToggleWatchlist}
                    onMoreInfo={(item) => setDetailItem(item)}
                    onDownload={(item) => handleDownload(item)}
                  />
                )}

                {/* Documentaries & Nature */}
                {documentaryItems.length > 0 && (
                  <MediaRow
                    title="Documentaries & Nature Explorations"
                    items={documentaryItems}
                    watchlistIds={watchlistIds}
                    downloadedIds={downloadedIds}
                    progressMap={progressPercentMap}
                    onPlay={(item) => {
                      setPlayingPartyRoom(null);
                      setPlayingEpisode(undefined);
                      setPlayingItem(item);
                    }}
                    onWatchParty={(item) => {
                      const room = partySyncService.getOrCreateRoom(
                        'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                        item.id,
                        activeProfile
                      );
                      setPlayingPartyRoom(room);
                      setPlayingItem(item);
                    }}
                    onToggleWatchlist={handleToggleWatchlist}
                    onMoreInfo={(item) => setDetailItem(item)}
                    onDownload={(item) => handleDownload(item)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#060609] py-10 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wider text-sm">
              CINE<span className="text-red-500">SYNC</span>
            </span>
            <span>· High-Definition Streaming & Group Watch Parties</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsApiSettingsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              API Key Setup & Catalog Manager
            </button>
            <button
              onClick={() => setIsPartyHubOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Watch Party Hub
            </button>
            <button
              onClick={handleToggleOfflineMode}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Offline Downloads Mode
            </button>
          </div>
        </div>
      </footer>

      {/* Video Player Modal */}
      {playingItem && (
        <VideoPlayerModal
          item={playingItem}
          episode={playingEpisode}
          initialPartyRoom={playingPartyRoom}
          activeProfile={activeProfile}
          onClose={() => {
            setPlayingItem(null);
            setPlayingEpisode(undefined);
            setPlayingPartyRoom(null);
            // Refresh history
            setWatchHistory(userService.getWatchHistory(activeProfile.id));
          }}
          onSelectEpisode={(ep) => setPlayingEpisode(ep)}
        />
      )}

      {/* Media Detail Modal */}
      {detailItem && (
        <MediaDetailModal
          item={detailItem}
          isInWatchlist={watchlistIds.includes(detailItem.id)}
          isDownloaded={downloadedIds.includes(detailItem.id)}
          catalog={catalog}
          onClose={() => setDetailItem(null)}
          onPlay={(item, ep) => {
            setDetailItem(null);
            setPlayingEpisode(ep);
            setPlayingPartyRoom(null);
            setPlayingItem(item);
          }}
          onStartWatchParty={(item, ep) => {
            setDetailItem(null);
            const room = partySyncService.getOrCreateRoom(
              'PARTY-' + Math.floor(1000 + Math.random() * 9000),
              item.id,
              activeProfile
            );
            setPlayingEpisode(ep);
            setPlayingPartyRoom(room);
            setPlayingItem(item);
          }}
          onToggleWatchlist={handleToggleWatchlist}
          onDownload={(item, quality, ep) => {
            handleDownload(item, quality, ep);
            setDetailItem(null);
          }}
          onSelectSimilar={(sim) => setDetailItem(sim)}
        />
      )}

      {/* Watch Party Hub Modal */}
      {isPartyHubOpen && (
        <WatchPartyHubModal
          catalog={catalog}
          activeProfile={activeProfile}
          onClose={() => setIsPartyHubOpen(false)}
          onJoinRoom={(room, media) => {
            setIsPartyHubOpen(false);
            setPlayingPartyRoom(room);
            setPlayingEpisode(undefined);
            setPlayingItem(media);
          }}
        />
      )}

      {/* API Settings & Content Manager Modal */}
      {isApiSettingsOpen && (
        <ApiSettingsModal
          onClose={() => setIsApiSettingsOpen(false)}
          onRefreshCatalog={refreshCatalog}
          onAddCustomItem={(item) => {
            setCatalog((prev) => [item, ...prev]);
          }}
        />
      )}

      {/* User Profiles Switcher Modal */}
      {isProfilesOpen && (
        <ProfileModal
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={(p) => {
            setActiveProfile(p);
            userService.setActiveProfile(p.id);
          }}
          onClose={() => setIsProfilesOpen(false)}
        />
      )}
    </div>
  );
}
