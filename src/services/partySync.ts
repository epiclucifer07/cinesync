import { WatchPartyRoom, PartyMessage, PartyReaction, PartyMember } from '../types/media';

const CHANNEL_NAME = 'cinesync_watch_party_channel';
const STORAGE_PREFIX = 'cinesync_party_room_';

export type PartyEventType =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'CHAT'
  | 'REACTION'
  | 'USER_JOIN'
  | 'USER_LEAVE'
  | 'STATE_SYNC';

export interface PartyEvent {
  type: PartyEventType;
  roomId: string;
  senderId: string;
  senderName: string;
  payload: any;
  timestamp: number;
}

export class WatchPartyService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: PartyEvent) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (ev: MessageEvent<PartyEvent>) => {
          this.notifyListeners(ev.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(STORAGE_PREFIX) && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners({
              type: 'STATE_SYNC',
              roomId: data.roomId,
              senderId: 'storage',
              senderName: 'System',
              payload: data,
              timestamp: Date.now()
            });
          } catch (err) {
            // ignore
          }
        }
      });
    }
  }

  public subscribe(callback: (event: PartyEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(event: PartyEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in party listener', err);
      }
    });
  }

  public broadcast(event: PartyEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        // Fallback
      }
    }
    // Also notify local listeners in the same window/tab
    this.notifyListeners(event);
  }

  // Create or load a room
  public getOrCreateRoom(
    roomId: string,
    mediaId: string,
    hostUser: { id: string; name: string; avatar: string },
    roomTitle?: string
  ): WatchPartyRoom {
    const key = STORAGE_PREFIX + roomId;
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as WatchPartyRoom;
        // Ensure hostUser is in members
        const hasMember = parsed.members.some((m) => m.id === hostUser.id);
        if (!hasMember) {
          parsed.members.push({
            id: hostUser.id,
            name: hostUser.name,
            avatar: hostUser.avatar,
            isHost: false,
            isOnline: true
          });
          localStorage.setItem(key, JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        // Fall through to create fresh
      }
    }

    const newRoom: WatchPartyRoom = {
      roomId,
      roomName: roomTitle || `Cinema Party #${roomId.toUpperCase()}`,
      hostId: hostUser.id,
      hostName: hostUser.name,
      mediaId,
      currentTime: 0,
      isPlaying: false,
      createdAt: Date.now(),
      members: [
        {
          id: hostUser.id,
          name: hostUser.name,
          avatar: hostUser.avatar,
          isHost: true,
          isOnline: true
        },
        // Simulated social party members for rich watch-along experience
        {
          id: 'sim_sarah',
          name: 'Sarah Jenkins',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
          isHost: false,
          isOnline: true
        },
        {
          id: 'sim_marcus',
          name: 'Marcus K.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          isHost: false,
          isOnline: true
        }
      ],
      messages: [
        {
          id: 'msg-welcome',
          userId: 'system',
          userName: 'CineSync Bot',
          userAvatar: '',
          text: `Welcome to the Watch Party! Synced playback is enabled. Type comments or drop reactions.`,
          videoTimestamp: 0,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        },
        {
          id: 'msg-sarah-1',
          userId: 'sim_sarah',
          userName: 'Sarah Jenkins',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
          text: `Hey everyone! Got my popcorn ready 🍿`,
          videoTimestamp: 0,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    localStorage.setItem(key, JSON.stringify(newRoom));
    return newRoom;
  }

  public saveRoom(room: WatchPartyRoom) {
    const key = STORAGE_PREFIX + room.roomId;
    localStorage.setItem(key, JSON.stringify(room));
  }

  // Get public active demo party rooms for hub discovery
  public getFeaturedParties(): Array<{
    roomId: string;
    roomName: string;
    mediaId: string;
    hostName: string;
    memberCount: number;
  }> {
    return [
      {
        roomId: 'NEO-2099',
        roomName: 'Neo-Tokyo Season Finale Watch',
        mediaId: 'cyberpunk-protocol-zero',
        hostName: 'Elena Rostova',
        memberCount: 5
      },
      {
        roomId: 'CITADEL-88',
        roomName: 'Citadel Lore Deep Dive',
        mediaId: 'citadel-of-aurora',
        hostName: 'Thorin Stone',
        memberCount: 7
      },
      {
        roomId: 'OCEAN-4K',
        roomName: 'Deep Sea Abyss 4K Sunday Stream',
        mediaId: 'deep-sea-abyss-leviathan',
        hostName: 'David Explorer',
        memberCount: 9
      }
    ];
  }
}

export const partySyncService = new WatchPartyService();
