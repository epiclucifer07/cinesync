import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types/media';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  watchlistIds: string[];
  downloadedIds: string[];
  progressMap?: Record<string, number>;
  onPlay: (item: MediaItem) => void;
  onWatchParty: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  isRanked?: boolean;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  watchlistIds,
  downloadedIds,
  progressMap = {},
  onPlay,
  onWatchParty,
  onToggleWatchlist,
  onMoreInfo,
  onDownload,
  isRanked = false
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative py-4 group/row">
      {/* Editorial Row Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs text-neutral-500 font-normal">({items.length})</span>
        </h3>
      </div>

      {/* Row Container with Scroll Chevrons */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll row left"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center rounded-r-md backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer border-y border-r border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {items.map((item, idx) => (
            <MediaCard
              key={item.id}
              item={item}
              rank={isRanked ? idx + 1 : undefined}
              progressPercent={progressMap[item.id]}
              isDownloaded={downloadedIds.includes(item.id)}
              isInWatchlist={watchlistIds.includes(item.id)}
              onPlay={onPlay}
              onWatchParty={onWatchParty}
              onToggleWatchlist={onToggleWatchlist}
              onMoreInfo={onMoreInfo}
              onDownload={onDownload}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && items.length > 3 && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll row right"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center rounded-l-md backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer border-y border-l border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
