import { useEffect, useState } from 'react';
import { Settings, Gift, User, Grid2x2 as Grid, ArrowLeft } from 'lucide-react';
import { useFamz } from '../../contexts/FamzContext';
import { useAuth } from '../../contexts/AuthContext';
import { ViewName } from '../../types';

interface FamzHomeScreenProps {
  onNavigate: (view: ViewName) => void;
}

export function FamzHomeScreen({ onNavigate }: FamzHomeScreenProps) {
  const { famzProfile, dailyDrop, todayClaim, loading } = useFamz();
  const { user } = useAuth();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const accent = famzProfile?.display_color ?? '#EC4899';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 43%, ${accent}12 0%, transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 12 }}
      >
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${accent}20`, color: accent }}
          >
            FAMZ
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* MyPlace logo */}
        <button
          onClick={() => onNavigate('famz:grid')}
          className="relative mb-8"
          style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `${accent}15`,
              border: `3px solid ${accent}50`,
              boxShadow: `0 0 30px ${accent}30`,
            }}
          >
            <img src="/myplacelogo.png" alt="MyPlace" className="w-16 h-16 object-contain" />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: accent }}
          >
            <Grid size={14} className="text-black" />
          </div>
        </button>

        <p
          className="text-white/30 text-[10px] tracking-widest uppercase mb-8"
          style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}
        >
          Tap to enter a Place
        </p>

        {/* Action buttons */}
        <div
          className="w-full max-w-xs space-y-3"
          style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}
        >
          {/* Daily Drop */}
          <button
            onClick={() => onNavigate('famz:dailydrop')}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95"
            style={{
              background: todayClaim
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(236, 72, 153, 0.1)',
              border: todayClaim
                ? '1px solid rgba(34, 197, 94, 0.3)'
                : `1px solid ${accent}30`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: todayClaim ? 'rgba(34, 197, 94, 0.2)' : `${accent}20`,
              }}
            >
              <Gift
                size={22}
                style={{ color: todayClaim ? '#22C55E' : accent }}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-sm">Daily Drop</p>
              <p className="text-white/40 text-xs">
                {todayClaim
                  ? 'Claimed for today'
                  : dailyDrop
                  ? 'New drop available'
                  : 'Check back soon'}
              </p>
            </div>
            {!todayClaim && dailyDrop && (
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>

          {/* Settings / Profile */}
          <button
            onClick={() => onNavigate('famz:settings')}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: famzProfile?.display_color ? `${famzProfile.display_color}20` : 'rgba(255,255,255,0.05)' }}
            >
              {famzProfile?.avatar_url ? (
                <img src={famzProfile.avatar_url} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <User
                  size={22}
                  style={{ color: famzProfile?.display_color ?? '#fff' }}
                />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-sm">
                {famzProfile?.display_name ?? 'FAMZ Profile'}
              </p>
              <p className="text-white/40 text-xs">Edit display name & color</p>
            </div>
            <Settings size={18} className="text-white/30" />
          </button>
        </div>
      </div>

      {/* Bottom wordmark */}
      <p
        className="pb-4 text-center text-[9px] tracking-[0.25em] uppercase text-white/15 font-medium"
        style={{
          opacity: animated ? 1 : 0,
          transition: 'opacity 0.5s ease 0.3s',
        }}
      >
        Your Place. Your FAMZ.
      </p>
    </div>
  );
}
