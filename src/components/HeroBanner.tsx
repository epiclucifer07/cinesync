import React, { useState } from 'react';
import { Play, Users, Plus, Check, Info, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { MediaItem } from '../types/media';

interface HeroBannerProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onStartWatchParty: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  item,
  onPlay,
  onStartWatchParty,
  onMoreInfo,
  isInWatchlist,
  onToggleWatchlist
}) => {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative w-full h-[75vh] min-h-[520px] max-h-[780px] overflow-hidden select-none">
      {/* Background Cinematic Backdrop with Resilient Image & Scrims */}
      <div className="absolute inset-0">
        <img
          src={item.backdrop}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 transform motion-safe:transition-transform motion-safe:duration-10000 motion-safe:hover:scale-100"
        />
        {/* Measured Contrast Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080c]/90 via-[#08080c]/40 to-transparent w-full lg:w-3/4" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#08080c]/80 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 pt-24 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Natural Editorial Kicker (Zero-Pill discipline) */}
          <div className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-red-500">
            <span className="font-bold">Original Series</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="text-neutral-300">Season 2 Streaming</span>
          </div>

          {/* Marquee Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance drop-shadow-md">
            {item.title}
          </h1>

          {/* Unboxed Metadata with Typographic Separators */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-neutral-300">
            <span className="text-emerald-400 font-semibold">{item.matchPercentage}% Match</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{item.releaseYear}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="border border-white/20 rounded px-1.5 py-0.2 text-neutral-200 text-xs">
              {item.ageRating}
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{item.duration}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-xs uppercase tracking-wide text-neutral-400 border border-neutral-700 rounded px-1 py-0.2">
              {item.quality}
            </span>
          </div>

          {/* Tagline & Overview */}
          {item.tagline && (
            <p className="text-sm font-semibold italic text-neutral-300">
              "{item.tagline}"
            </p>
          )}
          <p className="text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {item.overview}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Play Button */}
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-neutral-900 font-bold px-6 py-2.5 rounded-lg text-sm shadow-xl hover:shadow-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Watch Now</span>
            </button>

            {/* Watch Party Button */}
            <button
              onClick={() => onStartWatchParty(item)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow-xl shadow-red-600/20 hover:shadow-red-600/40 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Start Watch Party</span>
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => onToggleWatchlist(item)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2.5 rounded-lg text-sm backdrop-blur-md border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isInWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>My List</span>
                </>
              )}
            </button>

            {/* More Info */}
            <button
              onClick={() => onMoreInfo(item)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="More Details & Episodes"
              aria-label="More Details & Episodes"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ambient Mute Toggle & Age Rating on right */}
        <div className="absolute right-4 sm:right-8 bottom-16 flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio Preview' : 'Mute Audio Preview'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="hidden sm:inline border-l-2 border-red-600 pl-3 py-0.5 text-xs font-semibold text-neutral-300 bg-black/40 px-2 rounded-r">
            {item.ageRating}
          </span>
        </div>
      </div>
    </div>
  );
};
