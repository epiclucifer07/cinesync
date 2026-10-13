import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Users,
  Send,
  X,
  Copy,
  Check,
  FastForward,
  SkipForward,
  Share2,
  Smile,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { MediaItem, Episode, UserProfile, WatchPartyRoom, PartyMessage, PartyReaction } from '../types/media';
import { partySyncService, PartyEvent } from '../services/partySync';
import { userService } from '../services/userService';

interface VideoPlayerModalProps {
  item: MediaItem;
  episode?: Episode;
  initialPartyRoom?: WatchPartyRoom | null;
  activeProfile: UserProfile;
  initialTime?: number;
  onClose: () => void;
  onSelectEpisode?: (episode: Episode) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  item,
  episode,
  initialPartyRoom = null,
  activeProfile,
  initialTime = 0,
  onClose,
  onSelectEpisode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(item.durationSeconds || 120);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<'4K' | '1080p' | '720p' | 'Auto'>('1080p');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Settings dropdowns
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAudioSubtitlesMenu, setShowAudioSubtitlesMenu] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(item.audioTracks[0] || 'English');
  const [selectedSubtitle, setSelectedSubtitle] = useState('English [CC]');

  // Watch Party state
  const [partyRoom, setPartyRoom] = useState<WatchPartyRoom | null>(initialPartyRoom);
  const [isPartySidebarOpen, setIsPartySidebarOpen] = useState(Boolean(initialPartyRoom));
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<PartyMessage[]>(initialPartyRoom?.messages || []);
  const [floatingReactions, setFloatingReactions] = useState<PartyReaction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hostSyncDrift, setHostSyncDrift] = useState(0);

  const isHost = partyRoom ? partyRoom.hostId === activeProfile.id : true;
  const currentVideoUrl = episode ? episode.videoUrl : item.videoUrl;

  // Active episodes for series
  const currentEpisodeIndex = item.episodes?.findIndex((e) => e.id === episode?.id) ?? -1;
  const nextEpisode =
    item.episodes && currentEpisodeIndex >= 0 && currentEpisodeIndex < item.episodes.length - 1
      ? item.episodes[currentEpisodeIndex + 1]
      : null;

  // Setup initial party room if requested but not passed
  useEffect(() => {
    if (initialPartyRoom) {
      setPartyRoom(initialPartyRoom);
      setMessages(initialPartyRoom.messages);
      setIsPartySidebarOpen(true);
    }
  }, [initialPartyRoom]);

  // Subscribe to BroadcastChannel party events
  useEffect(() => {
    if (!partyRoom) return;

    const unsubscribe = partySyncService.subscribe((event: PartyEvent) => {
      if (event.roomId !== partyRoom.roomId) return;
      if (event.senderId === activeProfile.id) return; // Ignore own echoes

      switch (event.type) {
        case 'PLAY':
          if (videoRef.current) {
            videoRef.current.currentTime = event.payload.time;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
          break;
        case 'PAUSE':
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          break;
        case 'SEEK':
          if (videoRef.current) {
            videoRef.current.currentTime = event.payload.time;
            setCurrentTime(event.payload.time);
          }
          break;
        case 'CHAT':
          setMessages((prev) => [...prev, event.payload]);
          break;
        case 'REACTION':
          addFloatingReaction(event.payload.emoji, event.payload.userName);
          break;
        case 'USER_JOIN':
          setMessages((prev) => [
            ...prev,
            {
              id: 'join-' + Date.now(),
              userId: 'system',
              userName: 'System',
              userAvatar: '',
              text: `${event.senderName} joined the watch party!`,
              videoTimestamp: videoRef.current?.currentTime || 0,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true
            }
          ]);
          break;
      }
    });

    return () => unsubscribe();
  }, [partyRoom, activeProfile.id]);

  // Handle Controls Timeout (auto-hide controls on mouse idle)
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowAudioSubtitlesMenu(false);
      }
    }, 3500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isPartySidebarOpen]);

  // Video Time Update & Progress Save
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Save user progress in background
      userService.updateWatchProgress(
        activeProfile.id,
        item.id,
        Math.floor(cur),
        Math.floor(videoRef.current.duration || item.durationSeconds),
        episode?.id
      );

      // Check buffered range
      if (videoRef.current.buffered.length > 0) {
        const buffEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered(buffEnd);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || item.durationSeconds || 120);
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (partyRoom) {
        partySyncService.broadcast({
          type: 'PAUSE',
          roomId: partyRoom.roomId,
          senderId: activeProfile.id,
          senderName: activeProfile.name,
          payload: { time: videoRef.current.currentTime },
          timestamp: Date.now()
        });
      }
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (partyRoom && videoRef.current) {
          partySyncService.broadcast({
            type: 'PLAY',
            roomId: partyRoom.roomId,
            senderId: activeProfile.id,
            senderName: activeProfile.name,
            payload: { time: videoRef.current.currentTime },
            timestamp: Date.now()
          });
        }
      }).catch(() => {});
    }
  };

  // Seek time
  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(newTime, duration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);

    if (partyRoom) {
      partySyncService.broadcast({
        type: 'SEEK',
        roomId: partyRoom.roomId,
        senderId: activeProfile.id,
        senderName: activeProfile.name,
        payload: { time: clamped },
        timestamp: Date.now()
      });
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      handleSeek(videoRef.current.currentTime + seconds);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Reactions
  const addFloatingReaction = (emoji: string, userName: string) => {
    const reaction: PartyReaction = {
      id: 'reaction-' + Math.random(),
      emoji,
      userName,
      xPercent: 15 + Math.random() * 70,
      createdAt: Date.now()
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 1600);
  };

  const sendReaction = (emoji: string) => {
    addFloatingReaction(emoji, activeProfile.name);
    if (partyRoom) {
      partySyncService.broadcast({
        type: 'REACTION',
        roomId: partyRoom.roomId,
        senderId: activeProfile.id,
        senderName: activeProfile.name,
        payload: { emoji, userName: activeProfile.name },
        timestamp: Date.now()
      });
    }
  };

  // Chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !partyRoom) return;

    const newMsg: PartyMessage = {
      id: 'msg-' + Date.now(),
      userId: activeProfile.id,
      userName: activeProfile.name,
      userAvatar: activeProfile.avatar,
      text: chatInput.trim(),
      videoTimestamp: Math.floor(currentTime),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    partySyncService.broadcast({
      type: 'CHAT',
      roomId: partyRoom.roomId,
      senderId: activeProfile.id,
      senderName: activeProfile.name,
      payload: newMsg,
      timestamp: Date.now()
    });
  };

  const copyRoomInvite = () => {
    if (!partyRoom) return;
    const inviteUrl = `${window.location.origin}?party=${partyRoom.roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Time format helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      className="fixed inset-0 z-50 bg-black flex overflow-hidden select-none"
    >
      {/* Floating Animated Reaction Sprites over Video */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 animate-reaction flex flex-col items-center drop-shadow-2xl"
            style={{ left: `${r.xPercent}%` }}
          >
            <span className="text-4xl">{r.emoji}</span>
            <span className="text-[10px] text-white/80 bg-black/50 px-1 rounded mt-0.5">
              {r.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Main Video Viewport Area */}
      <div className="relative flex-1 h-full bg-black flex items-center justify-center overflow-hidden">
        {/* Actual Video Tag */}
        <video
          ref={videoRef}
          src={currentVideoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (nextEpisode && onSelectEpisode) onSelectEpisode(nextEpisode);
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
        />

        {/* Video Scrim & Top Bar Overlay */}
        <div
          className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              aria-label="Exit player"
              className="p-2 text-white/80 hover:text-white rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {item.title}
              </h2>
              {episode && (
                <p className="text-xs text-neutral-300">
                  Season {episode.seasonNumber}, Episode {episode.episodeNumber}: {episode.title}
                </p>
              )}
            </div>
          </div>

          {/* Top Right Party Controls / Badges */}
          <div className="flex items-center gap-3">
            {partyRoom ? (
              <div className="flex items-center gap-2 bg-neutral-900/80 border border-red-500/30 rounded-lg px-3 py-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  Room: {partyRoom.roomId}
                </span>
                <button
                  onClick={copyRoomInvite}
                  className="p-1 hover:text-red-400 text-neutral-400 cursor-pointer transition-colors"
                  title="Copy Invite Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsPartySidebarOpen(!isPartySidebarOpen)}
                  className={`text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                    isPartySidebarOpen ? 'bg-red-600 text-white' : 'bg-white/10 text-neutral-200'
                  }`}
                >
                  {isPartySidebarOpen ? 'Hide Party' : 'Show Party'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const room = partySyncService.getOrCreateRoom(
                    'PARTY-' + Math.floor(1000 + Math.random() * 9000),
                    item.id,
                    activeProfile
                  );
                  setPartyRoom(room);
                  setMessages(room.messages);
                  setIsPartySidebarOpen(true);
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Start Watch Party</span>
              </button>
            )}
          </div>
        </div>

        {/* Skip Intro Floating Overlay Button */}
        {currentTime > 3 && currentTime < 35 && (
          <button
            onClick={() => handleSeek(36)}
            className="absolute bottom-28 right-8 z-30 bg-neutral-900/90 hover:bg-white hover:text-black text-white text-xs font-bold px-4 py-2 rounded-md border border-white/20 shadow-xl backdrop-blur-md transition-all cursor-pointer"
          >
            Skip Intro
          </button>
        )}

        {/* Next Episode overlay if available */}
        {nextEpisode && currentTime > duration - 20 && (
          <button
            onClick={() => onSelectEpisode && onSelectEpisode(nextEpisode)}
            className="absolute bottom-28 right-8 z-30 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>Next Episode: {nextEpisode.title}</span>
          </button>
        )}

        {/* Bottom Cinema Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Interactive Scrub Bar with hover preview */}
          <div className="relative mb-4 group/scrub cursor-pointer">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                handleSeek(pos * duration);
              }}
              className="relative h-2 w-full bg-neutral-700/60 rounded-full overflow-hidden hover:h-3 transition-all"
            >
              {/* Buffer Bar */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-neutral-500/40 rounded-full"
                style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
              />
              {/* Played Progress Bar */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-red-600 rounded-full"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls Lower Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls: Play/Pause, Skips, Volume, Timestamp */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="p-2 text-white hover:text-red-400 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button
                onClick={() => skipSeconds(-10)}
                aria-label="Skip backward 10s"
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => skipSeconds(10)}
                aria-label="Skip forward 10s"
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Fast forward 10 seconds"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 group/vol ml-1">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="p-1 text-neutral-300 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(false);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="w-16 h-1 accent-red-600 bg-neutral-600 rounded cursor-pointer"
                />
              </div>

              {/* Time display */}
              <div className="text-xs font-mono text-neutral-300 ml-2">
                <span>{formatTime(currentTime)}</span>
                <span className="text-neutral-500 mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Quality, Audio/Subtitles, Speed, Fullscreen */}
            <div className="flex items-center gap-3">
              {/* Floating Reaction Trigger Buttons on Player Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                {['🔥', '😱', '😂', '🍿', '❤️'].map((em) => (
                  <button
                    key={em}
                    onClick={() => sendReaction(em)}
                    className="hover:scale-125 transition-transform text-sm cursor-pointer p-0.5"
                    title={`Send ${em} reaction`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-neutral-200 border border-white/10 flex items-center gap-1 cursor-pointer"
                  title="Stream Quality"
                >
                  <span>{quality}</span>
                </button>
                {showSettingsMenu && (
                  <div className="absolute bottom-10 right-0 bg-neutral-900 border border-neutral-700 rounded-lg p-2 shadow-2xl text-xs space-y-1 min-w-[120px] z-30">
                    <div className="text-[10px] text-neutral-400 font-bold px-2 py-0.5 uppercase tracking-wider">
                      Video Quality
                    </div>
                    {(['4K', '1080p', '720p', 'Auto'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer ${
                          quality === q ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{q}</span>
                        {quality === q && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                    <div className="border-t border-neutral-800 pt-1 mt-1 text-[10px] text-neutral-400 font-bold px-2 py-0.5 uppercase tracking-wider">
                      Speed
                    </div>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          setPlaybackSpeed(spd);
                          if (videoRef.current) videoRef.current.playbackRate = spd;
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer ${
                          playbackSpeed === spd ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{spd}x</span>
                        {playbackSpeed === spd && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio & Subtitles */}
              <div className="relative">
                <button
                  onClick={() => setShowAudioSubtitlesMenu(!showAudioSubtitlesMenu)}
                  className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Audio & Subtitles"
                >
                  <Subtitles className="w-5 h-5" />
                </button>
                {showAudioSubtitlesMenu && (
                  <div className="absolute bottom-10 right-0 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-2xl text-xs space-y-2 min-w-[200px] z-30">
                    <div>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                        Audio Track
                      </div>
                      {item.audioTracks.map((track) => (
                        <button
                          key={track}
                          onClick={() => {
                            setSelectedAudio(track);
                            setShowAudioSubtitlesMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer ${
                            selectedAudio === track ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <span className="truncate">{track}</span>
                          {selectedAudio === track && <Check className="w-3 h-3 shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-neutral-800 pt-2">
                      <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                        Subtitles
                      </div>
                      {['Off', ...item.subtitleTracks].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setSelectedSubtitle(sub);
                            setShowAudioSubtitlesMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded flex items-center justify-between cursor-pointer ${
                            selectedSubtitle === sub ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <span>{sub}</span>
                          {selectedSubtitle === sub && <Check className="w-3 h-3 shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Watch Party & Social Chat Sidebar */}
      {partyRoom && isPartySidebarOpen && (
        <div className="w-80 md:w-96 h-full bg-[#0c0d14] border-l border-white/10 flex flex-col z-40 shadow-2xl">
          {/* Party Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Watch Party Live
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Room #{partyRoom.roomId} · {partyRoom.members.length} watching
              </p>
            </div>
            <button
              onClick={() => setIsPartySidebarOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Members Bar */}
          <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {partyRoom.members.map((member) => (
              <div key={member.id} className="relative group shrink-0" title={`${member.name} (${member.isHost ? 'Host' : 'Member'})`}>
                <img
                  src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop'}
                  alt={member.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                />
                {member.isHost && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-black">
                    ★
                  </span>
                )}
              </div>
            ))}
            <button
              onClick={copyRoomInvite}
              className="h-7 px-2 rounded-full border border-dashed border-neutral-600 text-[11px] text-neutral-300 hover:text-white hover:border-neutral-400 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Share2 className="w-3 h-3" />
              <span>Invite</span>
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => {
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="text-center py-1.5 px-2 bg-white/5 rounded text-[11px] text-neutral-400 italic">
                    {msg.text}
                  </div>
                );
              }

              const isMe = msg.userId === activeProfile.id;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={msg.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop'}
                    alt={msg.userName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                  />
                  <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5">
                      <span className="font-semibold text-neutral-300">{msg.userName}</span>
                      <span className="text-neutral-500 font-mono">{formatTime(msg.videoTimestamp)}</span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-white/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Reaction Tray */}
          <div className="px-4 py-2 border-t border-white/5 bg-neutral-900/30 flex items-center justify-between">
            {['🔥', '😱', '😂', '🍿', '❤️', '👏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-lg hover:scale-130 transition-transform active:scale-95 cursor-pointer p-1"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#0c0d14] flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Chat with party..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
