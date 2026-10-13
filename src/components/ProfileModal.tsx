import React from 'react';
import { X, Check, User, Plus } from 'lucide-react';
import { UserProfile } from '../types/media';

interface ProfileModalProps {
  profiles: UserProfile[];
  activeProfile: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0e1017] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 text-center text-neutral-100">
        <button
          onClick={onClose}
          aria-label="Close profile switcher"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">Who's Watching?</h3>
        <p className="text-xs text-neutral-400 mb-6">
          Select a profile to access your personalized watchlist and watch history.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {profiles.map((profile) => {
            const isCurrent = profile.id === activeProfile.id;
            return (
              <button
                key={profile.id}
                onClick={() => {
                  onSelectProfile(profile);
                  onClose();
                }}
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-transform duration-200 group-hover:scale-105 ${
                    isCurrent ? 'border-red-500 ring-4 ring-red-500/20' : 'border-transparent group-hover:border-white/50'
                  }`}
                >
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isCurrent && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  {profile.isKids && (
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[9px] font-bold py-0.5">
                      KIDS
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold truncate max-w-[90px] ${
                    isCurrent ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  {profile.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
