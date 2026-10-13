import React, { useState } from 'react';
import { Play, Users, Plus, Check, Download, Info } from 'lucide-react';
import { MediaItem } from '../types/media';

interface MediaCardProps {
  item: MediaItem;
  rank?: number;
  progressPercent?: number;
  isDownloaded?: boolean;
  isInWatchlist: boolean;
  onPlay: (item: MediaItem) => void;
  onWatchParty: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  rank,
  progressPercent,
  isDownloaded,
  isInWatchlist,
  onPlay,
  onWatchParty,
  onToggleWatchlist,
  onMoreInfo,
  onDownload
}) => {
  const [imageLoaded, setImageLoaded] = useState(true);

  return (
    <div className="group relative flex-none w-[200px] sm:w-[240px] md:w-[280px] select-none rounded-lg overflow-hidden bg-neutral-900 border border-white/5 transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-black hover:border-white/20">
      {/* Top 10 Rank Watermark if present */}
      {rank !== undefined && (
        <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded bg-red-600/90 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
          #{rank}
        </div>
      )}

      {/* Card Thumbnail */}
      <div className="relative aspect-[16/9] w-full bg-neutral-950 overflow-hidden cursor-pointer" onClick={() => onMoreInfo(item)}>
        {imageLoaded ? (
          <img
            src={item.backdrop || item.poster}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImageLoaded(false)}
            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 p-4 text-center">
            <span className="text-sm font-bold text-white line-clamp-2">{item.title}</span>
            <span className="text-xs text-neutral-400 mt-1">{item.releaseYear}</span>
          </div>
        )}

        {/* Bottom gradient on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

        {/* Continue Watching Progress Bar */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}

        {/* Downloaded tag */}
        {isDownloaded && (
          <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
            Downloaded
          </div>
        )}
      </div>

      {/* Card Info and Quick Actions */}
      <div className="p-3 bg-neutral-900 flex flex-col justify-between">
        <div>
          <h4
            onClick={() => onMoreInfo(item)}
            className="text-sm font-bold text-white truncate cursor-pointer hover:text-red-400 transition-colors"
          >
            {item.title}
          </h4>

          {/* Clean Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
            <span className="text-emerald-400 font-semibold">{item.matchPercentage}%</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{item.ageRating}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="truncate">{item.duration}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-500 font-mono text-[10px]">{item.quality.replace(' Ultra HD', '').replace(' Full HD', '')}</span>
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            {/* Play Button */}
            <button
              onClick={() => onPlay(item)}
              aria-label="Play title"
              className="w-7 h-7 rounded-full bg-white hover:bg-neutral-200 text-neutral-900 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>

            {/* Watch Party Button */}
            <button
              onClick={() => onWatchParty(item)}
              aria-label="Start watch party"
              title="Start Watch Party"
              className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow"
            >
              <Users className="w-3.5 h-3.5" />
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => onToggleWatchlist(item)}
              aria-label="Toggle watchlist"
              title={isInWatchlist ? 'Remove from List' : 'Add to List'}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isInWatchlist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            {/* Download Button */}
            <button
              onClick={() => onDownload(item)}
              aria-label="Download for offline viewing"
              title="Download for Offline"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDownloaded
                  ? 'bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/40'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* More Info */}
          <button
            onClick={() => onMoreInfo(item)}
            aria-label="Details"
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
