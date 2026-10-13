import { UserProfile, WatchHistoryItem } from '../types/media';

const PROFILES_KEY = 'cinesync_user_profiles';
const ACTIVE_PROFILE_KEY = 'cinesync_active_profile_id';
const WATCHLIST_PREFIX = 'cinesync_watchlist_';
const HISTORY_PREFIX = 'cinesync_watch_history_';

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'profile_1',
    name: 'Alex Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
    isKids: false,
    accentColor: '#e50914'
  },
  {
    id: 'profile_2',
    name: 'Jordan Cinema',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    isKids: false,
    accentColor: '#3b82f6'
  },
  {
    id: 'profile_3',
    name: 'Kids Zone',
    avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=120&h=120&fit=crop&crop=face',
    isKids: true,
    accentColor: '#10b981'
  }
];

class UserService {
  public getProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return DEFAULT_PROFILES;
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  }

  public getActiveProfile(): UserProfile {
    const profiles = this.getProfiles();
    if (typeof window === 'undefined') return profiles[0];
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const found = profiles.find((p) => p.id === activeId);
    return found || profiles[0];
  }

  public setActiveProfile(profileId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  // Watchlist per profile
  public getWatchlist(profileId: string): string[] {
    if (typeof window === 'undefined') return ['cyberpunk-protocol-zero', 'citadel-of-aurora'];
    try {
      const stored = localStorage.getItem(WATCHLIST_PREFIX + profileId);
      return stored ? JSON.parse(stored) : ['cyberpunk-protocol-zero', 'citadel-of-aurora'];
    } catch {
      return [];
    }
  }

  public toggleWatchlist(profileId: string, mediaId: string): boolean {
    const list = this.getWatchlist(profileId);
    const index = list.indexOf(mediaId);
    let updated: string[];
    let isAdded = false;
    if (index >= 0) {
      updated = list.filter((id) => id !== mediaId);
    } else {
      updated = [mediaId, ...list];
      isAdded = true;
    }
    localStorage.setItem(WATCHLIST_PREFIX + profileId, JSON.stringify(updated));
    return isAdded;
  }

  public isInWatchlist(profileId: string, mediaId: string): boolean {
    return this.getWatchlist(profileId).includes(mediaId);
  }

  // Watch history
  public getWatchHistory(profileId: string): WatchHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_PREFIX + profileId);
      return stored
        ? JSON.parse(stored)
        : [
            {
              mediaId: 'cyberpunk-protocol-zero',
              progressSeconds: 1420,
              durationSeconds: 3120,
              lastWatchedAt: Date.now() - 3600000,
              episodeId: 'cp-s1-e1'
            },
            {
              mediaId: 'deep-sea-abyss-leviathan',
              progressSeconds: 4200,
              durationSeconds: 6480,
              lastWatchedAt: Date.now() - 86400000
            }
          ];
    } catch {
      return [];
    }
  }

  public updateWatchProgress(
    profileId: string,
    mediaId: string,
    progressSeconds: number,
    durationSeconds: number,
    episodeId?: string
  ) {
    const list = this.getWatchHistory(profileId).filter(
      (h) => !(h.mediaId === mediaId && h.episodeId === episodeId)
    );
    const item: WatchHistoryItem = {
      mediaId,
      progressSeconds,
      durationSeconds,
      lastWatchedAt: Date.now(),
      episodeId
    };
    list.unshift(item);
    localStorage.setItem(HISTORY_PREFIX + profileId, JSON.stringify(list.slice(0, 30)));
  }
}

export const userService = new UserService();
