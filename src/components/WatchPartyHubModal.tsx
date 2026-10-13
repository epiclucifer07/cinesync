import React, { useState } from 'react';
import { Users, X, Play, Plus, Film, Sparkles, MessageCircle, LogIn, ArrowRight } from 'lucide-react';
import { MediaItem, UserProfile, WatchPartyRoom } from '../types/media';
import { partySyncService } from '../services/partySync';

interface WatchPartyHubModalProps {
  catalog: MediaItem[];
  activeProfile: UserProfile;
  onClose: () => void;
  onJoinRoom: (room: WatchPartyRoom, media: MediaItem) => void;
}

export const WatchPartyHubModal: React.FC<WatchPartyHubModalProps> = ({
  catalog,
  activeProfile,
  onClose,
  onJoinRoom
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState(catalog[0]?.id || '');
  const [customRoomName, setCustomRoomName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const featuredParties = partySyncService.getFeaturedParties();

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    const code = roomCodeInput.trim().toUpperCase();
    const media = catalog.find((m) => m.id === selectedMediaId) || catalog[0];
    const room = partySyncService.getOrCreateRoom(code, media.id, activeProfile);
    onJoinRoom(room, media);
  };

  const handleCreateRoom = () => {
    const media = catalog.find((m) => m.id === selectedMediaId) || catalog[0];
    const randomCode = 'PARTY-' + Math.floor(1000 + Math.random() * 9000);
    const room = partySyncService.getOrCreateRoom(
      randomCode,
      media.id,
      activeProfile,
      customRoomName.trim() || undefined
    );
    onJoinRoom(room, media);
  };

  const handleJoinFeatured = (fp: { roomId: string; mediaId: string; roomName: string }) => {
    const media = catalog.find((m) => m.id === fp.mediaId) || catalog[0];
    const room = partySyncService.getOrCreateRoom(fp.roomId, media.id, activeProfile, fp.roomName);
    onJoinRoom(room, media);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 text-neutral-100">
        <button
          onClick={onClose}
          aria-label="Close party hub"
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Watch Party Hub
            </h2>
            <p className="text-xs text-neutral-400">
              Synchronize playback in real time with friends, chat live and share reactions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Join with Room Code */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <LogIn className="w-4 h-4 text-red-500" />
                <span>Join with Room Code</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Enter an invite code from a friend to immediately sync to their video session.
              </p>

              <form onSubmit={handleJoinByCode} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="e.g. PARTY-4819 or NEO-2099"
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs uppercase font-mono tracking-wider text-white placeholder-neutral-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!roomCodeInput.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Join Room
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Multi-tab real-time sync active via BroadcastChannel</span>
            </div>
          </div>

          {/* Box 2: Create a New Room */}
          <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Start New Watch Party</span>
            </div>
            <p className="text-xs text-neutral-400">
              Pick a title from the catalog and host a live watch party room as the director.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  Select Movie or Series
                </label>
                <select
                  value={selectedMediaId}
                  onChange={(e) => setSelectedMediaId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  {catalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.type === 'series' ? 'Series' : 'Movie'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                  Custom Party Name (Optional)
                </label>
                <input
                  type="text"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="e.g. Friday Night Binge"
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full bg-white hover:bg-neutral-200 text-neutral-900 font-bold py-2 rounded-lg text-xs shadow-lg transition-colors cursor-pointer"
              >
                Launch Room as Host
              </button>
            </div>
          </div>
        </div>

        {/* Featured Live Parties */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">
              Active Public Watch Parties
            </h4>
            <span className="text-xs text-neutral-400">Real-time sessions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredParties.map((fp) => {
              const matchedMedia = catalog.find((m) => m.id === fp.mediaId);
              return (
                <div
                  key={fp.roomId}
                  onClick={() => handleJoinFeatured(fp)}
                  className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span className="font-mono text-red-400">#{fp.roomId}</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {fp.memberCount} viewers
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {fp.roomName}
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                      Host: {fp.hostName}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="truncate max-w-[120px]">{matchedMedia?.title}</span>
                    <span className="text-red-500 group-hover:translate-x-0.5 transition-transform">
                      Jump In →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
