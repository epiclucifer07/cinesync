import React, { useState, useEffect } from 'react';
import { Search, Film, Users, Download, Sliders, Check, User, WifiOff, X } from 'lucide-react';
import { UserProfile } from '../types/media';

interface NavbarProps {
  activeTab: 'home' | 'series' | 'movies' | 'parties' | 'downloads';
  onSelectTab: (tab: 'home' | 'series' | 'movies' | 'parties' | 'downloads') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeProfile: UserProfile;
  onOpenProfiles: () => void;
  onOpenApiSettings: () => void;
  onOpenPartyHub: () => void;
  downloadCount: number;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  activeProfile,
  onOpenProfiles,
  onOpenApiSettings,
  onOpenPartyHub,
  downloadCount,
  isOfflineMode,
  onToggleOfflineMode
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Offline Mode Warning Strip if enabled */}
      {isOfflineMode && (
        <aside aria-label="Offline Mode Notice" className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-1.5 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Offline Mode Active · Showing downloaded library items for offline playback</span>
            </div>
            <button
              onClick={onToggleOfflineMode}
              className="text-amber-300 hover:text-white underline text-xs font-medium cursor-pointer"
            >
              Resume Online
            </button>
          </div>
        </aside>
      )}

      {/* Top Bar following 3-Zone Contract */}
      <header
        className={`fixed ${isOfflineMode ? 'top-8' : 'top-0'} left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#08080c]/95 border-b border-white/5 backdrop-blur-md py-3 shadow-2xl'
            : 'bg-gradient-to-b from-[#08080c]/90 via-[#08080c]/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element wordmark in display face) */}
          <button
            onClick={() => {
              onSelectTab('home');
              onSearchChange('');
            }}
            className="flex items-center gap-2 text-left cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-wider text-white whitespace-nowrap">
              CINE<span className="text-red-500">SYNC</span>
            </span>
          </button>

          {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <button
              onClick={() => onSelectTab('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'home' ? 'text-white font-semibold' : 'text-neutral-400'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onSelectTab('series')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'series' ? 'text-white font-semibold' : 'text-neutral-400'
              }`}
            >
              TV Series
            </button>
            <button
              onClick={() => onSelectTab('movies')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'movies' ? 'text-white font-semibold' : 'text-neutral-400'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => onSelectTab('parties')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'parties' ? 'text-white font-semibold' : 'text-neutral-400'
              }`}
            >
              <Users className="w-4 h-4 text-red-500" />
              <span>Watch Party</span>
            </button>
            <button
              onClick={() => onSelectTab('downloads')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'downloads' ? 'text-white font-semibold' : 'text-neutral-400'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Downloads</span>
              {downloadCount > 0 && (
                <span className="text-xs text-neutral-400">({downloadCount})</span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Area & Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search Bar Input or Toggle */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-white/10 border border-white/20 rounded-full px-3 py-1.5 w-48 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Titles, genres, cast..."
                    autoFocus
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-400 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="text-neutral-400 hover:text-white ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSearchChange('');
                    }}
                    className="text-neutral-400 hover:text-white ml-2 text-xs cursor-pointer"
                  >
                    Esc
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search catalog"
                  className="p-2 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* API Settings & Catalog Extension Button */}
            <button
              onClick={onOpenApiSettings}
              title="API Keys & Add Media"
              className="p-2 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={onOpenProfiles}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer group"
            >
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-white/20"
              />
              <span className="text-xs font-medium text-neutral-200 hidden sm:inline max-w-[80px] truncate">
                {activeProfile.name}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center justify-around px-4 pt-3 pb-1 border-t border-white/5 text-xs text-neutral-400">
          <button
            onClick={() => onSelectTab('home')}
            className={`cursor-pointer ${activeTab === 'home' ? 'text-white font-medium' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('series')}
            className={`cursor-pointer ${activeTab === 'series' ? 'text-white font-medium' : ''}`}
          >
            Series
          </button>
          <button
            onClick={() => onSelectTab('movies')}
            className={`cursor-pointer ${activeTab === 'movies' ? 'text-white font-medium' : ''}`}
          >
            Movies
          </button>
          <button
            onClick={() => onSelectTab('parties')}
            className={`cursor-pointer flex items-center gap-1 ${activeTab === 'parties' ? 'text-white font-medium' : ''}`}
          >
            <Users className="w-3 h-3 text-red-500" />
            Party
          </button>
          <button
            onClick={() => onSelectTab('downloads')}
            className={`cursor-pointer flex items-center gap-1 ${activeTab === 'downloads' ? 'text-white font-medium' : ''}`}
          >
            <Download className="w-3 h-3 text-emerald-400" />
            Downloads
          </button>
        </div>
      </header>
    </>
  );
};
