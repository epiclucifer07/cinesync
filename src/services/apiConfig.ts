import { MediaItem, ApiConfiguration } from '../types/media';

const API_CONFIG_KEY = 'cinesync_api_configuration';
const CUSTOM_MEDIA_KEY = 'cinesync_custom_media_catalog';

const DEFAULT_CONFIG: ApiConfiguration = {
  tmdbApiKey: '',
  customEndpoint: '',
  autoSyncMetadata: true,
  preferredQuality: '4K'
};

class ApiConfigService {
  public getConfig(): ApiConfiguration {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(API_CONFIG_KEY);
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  public saveConfig(config: ApiConfiguration) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  }

  public getCustomMedia(): MediaItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CUSTOM_MEDIA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public addCustomMedia(media: MediaItem) {
    const current = this.getCustomMedia();
    const updated = [media, ...current];
    localStorage.setItem(CUSTOM_MEDIA_KEY, JSON.stringify(updated));
    return updated;
  }

  public deleteCustomMedia(id: string) {
    const current = this.getCustomMedia();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(CUSTOM_MEDIA_KEY, JSON.stringify(updated));
    return updated;
  }

  // Test TMDB API Key validation
  public async testTmdbKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 10) {
      return { success: false, message: 'Please enter a valid TMDB v3 API Key.' };
    }

    try {
      const res = await fetch(`https://api.themoviedb.org/3/authentication?api_key=${apiKey.trim()}`);
      if (res.ok) {
        return { success: true, message: 'TMDB API Key verified successfully! Live sync ready.' };
      }
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.status_message || 'Invalid TMDB API Key. Please verify your credentials.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Could not connect to TMDB servers. Check network or key format.'
      };
    }
  }

  // Fetch trending movies if TMDB key is set
  public async fetchTmdbTrending(apiKey: string): Promise<MediaItem[]> {
    if (!apiKey) return [];
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey.trim()}&language=en-US`
      );
      if (!res.ok) return [];
      const data = await res.json();
      const results: any[] = data.results || [];

      return results.map((item, idx) => {
        const isMovie = item.media_type === 'movie' || Boolean(item.title);
        const title = item.title || item.name || 'Untitled';
        const backdropPath = item.backdrop_path
          ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
          : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop';
        const posterPath = item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : backdropPath;

        return {
          id: `tmdb-${item.id}`,
          title,
          type: isMovie ? 'movie' : 'series',
          tagline: item.tagline || 'Streaming on CineSync',
          overview: item.overview || 'No synopsis provided.',
          backdrop: backdropPath,
          poster: posterPath,
          rating: Number((item.vote_average || 7.5).toFixed(1)),
          matchPercentage: Math.min(99, Math.max(80, Math.round((item.vote_average || 8) * 10) + 5)),
          releaseYear: parseInt((item.release_date || item.first_air_date || '2025').slice(0, 4), 10),
          duration: isMovie ? '2h 05m' : '1 Season',
          durationSeconds: 7500,
          ageRating: item.adult ? '18+' : '16+',
          genres: ['Trending', isMovie ? 'Feature Film' : 'Series'],
          director: 'Executive Studio',
          cast: ['Featured Ensemble Cast'],
          quality: '4K Ultra HD',
          audioTracks: ['English (Dolby Atmos)', 'Spanish (5.1)'],
          subtitleTracks: ['English [CC]', 'Spanish'],
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          isTrending: true,
          topRank: idx < 10 ? idx + 1 : undefined
        };
      });
    } catch {
      return [];
    }
  }
}

export const apiConfigService = new ApiConfigService();
