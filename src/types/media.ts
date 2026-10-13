export type MediaType = 'movie' | 'series';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  durationSeconds: number;
  overview: string;
  thumbnail: string;
  videoUrl: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  tagline?: string;
  overview: string;
  backdrop: string;
  poster: string;
  rating: number; // e.g. 8.8
  matchPercentage: number; // e.g. 98%
  releaseYear: number;
  duration: string; // e.g. "2h 14m" or "3 Seasons"
  durationSeconds: number;
  ageRating: string; // "PG-13", "16+", "TV-MA", "18+"
  genres: string[];
  director?: string;
  cast: string[];
  quality: '4K Ultra HD' | '1080p Full HD' | 'HD';
  audioTracks: string[];
  subtitleTracks: string[];
  videoUrl: string; // High-definition playable stream
  trailerUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isTop10?: boolean;
  topRank?: number;
  episodes?: Episode[];
}

export interface WatchHistoryItem {
  mediaId: string;
  progressSeconds: number;
  durationSeconds: number;
  lastWatchedAt: number;
  episodeId?: string;
}

export interface DownloadedItem {
  id: string;
  mediaId: string;
  episodeId?: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  fileSizeMB: number;
  quality: '4K Ultra HD' | '1080p' | '720p';
  downloadedAt: number;
  videoUrl: string;
  type: MediaType;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  accentColor: string;
}

export interface PartyMember {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isOnline: boolean;
  lastPing?: number;
}

export interface PartyMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  videoTimestamp: number;
  createdAt: string;
  isSystem?: boolean;
}

export interface PartyReaction {
  id: string;
  emoji: string;
  userName: string;
  xPercent: number;
  createdAt: number;
}

export interface WatchPartyRoom {
  roomId: string;
  roomName: string;
  hostId: string;
  hostName: string;
  mediaId: string;
  episodeId?: string;
  currentTime: number;
  isPlaying: boolean;
  createdAt: number;
  members: PartyMember[];
  messages: PartyMessage[];
}

export interface ApiConfiguration {
  tmdbApiKey: string;
  customEndpoint: string;
  autoSyncMetadata: boolean;
  preferredQuality: '4K' | '1080p' | '720p';
}
