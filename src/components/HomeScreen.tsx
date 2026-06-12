import { useEffect, useRef, useState } from 'react';
import { Music, MessageCircle, ShoppingBag, Play, Newspaper, Star, Settings, User, Circle, Grid2x2 as Grid, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlace } from '../contexts/PlaceContext';
import { useAuth } from '../contexts/AuthContext';
import { ViewName, DEFAULT_ROOMS } from '../types';
import { useAudio } from '../contexts/AudioContext';
import { PresenceModal } from './ui/PresenceModal';

const ICON_MAP: Record<string, React.ElementType> = {
  Music, MessageCircle, ShoppingBag, Play, Newspaper,
  Star, Settings, User, Circle, Grid, Zap,
};

interface HomeScreenProps {
  onNavigate: (view: ViewName) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { profile, rooms, isCreator } = usePlace();
  const { user } = useAuth();
  const { currentTrack } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 390, h: 700 });
  const [animated, setAnimated] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [famzCount, setFamzCount] = useState(0);

  // Track FAMZ count (tapped-in users)
  useEffect(() => {
    if (!profile) return;
    supabase.from('famz_relationships').select('id', { count: 'exact', head: true }).eq('creator_id', profile.id)
      .then(({ count }) => setFamzCount(count ?? 0));
  }, [profile?.id]);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDims({ w: r.width || 390, h: r.height || 700 });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimated(true), 80);
    const t2 = setTimeout(() => setPulse(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Use DB rooms when available, fall back to DEFAULT_ROOMS for display
  const dbRooms = rooms.filter(r => r.enabled);
  const displayRooms: Array<{ slug: string; name: string; icon: string; color: string; id: string }> =
    dbRooms.length > 0
      ? dbRooms.slice(0, 8)
      : DEFAULT_ROOMS.map((r, i) => ({ ...r, id: `default-${i}` }));

  const cx = dims.w / 2;
  const cy = dims.h * 0.43;
  const radius = Math.min(dims.w * 0.37, dims.h * 0.31, 155);
  const angleStep = 360 / displayRooms.length;
  const accent = profile?.accent_color ?? '#EC4899';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: '#000' }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 43%, ${accent}18 0%, transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 12 }}
      >
        <img src="/myplacelogo.png" alt="MyPlace" className="h-7 w-7 object-contain opacity-80" />

        {isCreator ? (
          <button
            onClick={() => onNavigate('creator:panel')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95"
            style={{
              background: `${accent}20`,
              color: accent,
              border: `1px solid ${accent}50`,
            }}
          >
            <Settings size={12} />
            Manage
          </button>
        ) : user ? (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            FAMZ
          </span>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Sign In
          </button>
        )}
      </div>

      {/* SVG: orbit ring + connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={dims.w}
        height={dims.h}
      >
        {/* Dashed orbit ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
          strokeDasharray="3 9"
          style={{
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.8s ease 0.2s',
          }}
        />
        {/* Connection lines */}
        {displayRooms.map((room, i) => {
          const angle = -90 + i * angleStep;
          const rad = (angle * Math.PI) / 180;
          const nx = cx + radius * Math.cos(rad);
          const ny = cy + radius * Math.sin(rad);
          return (
            <line
              key={room.id}
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke={room.color}
              strokeWidth="1.5"
              opacity={animated ? 0.3 : 0}
              style={{ transition: `opacity 0.5s ease ${i * 0.07}s` }}
            />
          );
        })}
      </svg>

      {/* Room nodes — positioned via absolute */}
      {displayRooms.map((room, i) => {
        const angle = -90 + i * angleStep;
        const rad = (angle * Math.PI) / 180;
        const nx = cx + radius * Math.cos(rad);
        const ny = cy + radius * Math.sin(rad);
        const IconComp = ICON_MAP[room.icon] ?? Circle;
        const isDbRoom = !room.id.startsWith('default-');

        return (
          <button
            key={room.id}
            onClick={() => isDbRoom
              ? onNavigate(`room:${room.slug}` as ViewName)
              : onNavigate(`room:${room.slug}` as ViewName)
            }
            className="absolute flex flex-col items-center gap-1.5 group"
            style={{
              left: nx,
              top: ny,
              transform: 'translate(-50%, -50%)',
              opacity: animated ? 1 : 0,
              transition: `opacity 0.45s ease ${i * 0.07 + 0.15}s`,
            }}
          >
            {/* Node circle */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 group-hover:scale-110"
              style={{
                background: `${room.color}18`,
                border: `2px solid ${room.color}70`,
                boxShadow: `0 0 18px ${room.color}28, inset 0 0 8px ${room.color}10`,
              }}
            >
              <IconComp size={22} style={{ color: room.color }} />
            </div>
            {/* Label */}
            <span
              className="text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
              style={{
                color: room.color,
                textShadow: `0 0 10px ${room.color}70`,
              }}
            >
              {room.name}
            </span>
          </button>
        );
      })}

      {/* Creator center node */}
      <div
        className="absolute flex flex-col items-center gap-2.5"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
      >
        {/* Pulse rings — enhanced when creator is active */}
        {pulse && (
          <>
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: profile?.is_active ? 100 : 88,
                height: profile?.is_active ? 100 : 88,
                border: `1px solid ${accent}`,
                opacity: profile?.is_active ? 0.2 : 0.1,
                animationDuration: profile?.is_active ? '1.5s' : '2.5s',
              }}
            />
            <div
              className="absolute rounded-full animate-ping"
              style={{
                width: profile?.is_active ? 88 : 72,
                height: profile?.is_active ? 88 : 72,
                border: `1px solid ${accent}`,
                opacity: profile?.is_active ? 0.25 : 0.15,
                animationDuration: profile?.is_active ? '1.5s' : '2.5s',
                animationDelay: '0.8s',
              }}
            />
            {profile?.is_active && (
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: 116,
                  height: 116,
                  border: `1px solid ${accent}`,
                  opacity: 0.12,
                  animationDuration: '2s',
                  animationDelay: '1.2s',
                }}
              />
            )}
          </>
        )}

        {/* Profile image / logo */}
        <button
          onClick={() => {
            if (isCreator) setPresenceOpen(true);
            else if (user) onNavigate('auth');
            else onNavigate('auth');
          }}
          className="relative z-10 transition-transform active:scale-95"
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              border: `2.5px solid ${accent}`,
              boxShadow: profile?.is_active
                ? `0 0 32px ${accent}70, 0 0 64px ${accent}30, 0 0 96px ${accent}10`
                : `0 0 24px ${accent}50, 0 0 48px ${accent}18`,
              overflow: 'hidden',
            }}
          >
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <img src="/myplacelogo.png" alt="MyPlace" className="w-full h-full object-contain p-2.5" />
            )}
          </div>
          {isCreator && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: profile?.is_active ? accent : 'rgba(255,255,255,0.15)', border: '2px solid #000' }}
            >
              <Zap size={10} className="text-black" />
            </div>
          )}
        </button>

        {/* Creator name + tagline */}
        <div
          className="text-center z-10"
          style={{
            opacity: animated ? 1 : 0,
            transition: 'opacity 0.7s ease 0.5s',
          }}
        >
          <p className="text-white font-bold text-sm leading-tight tracking-tight">
            {profile?.name ?? 'MyPlace™'}
          </p>
          {profile?.welcome_message && (
            <p className="text-white/35 text-[10px] mt-0.5 max-w-[130px] truncate">
              {profile.welcome_message}
            </p>
          )}
          {profile?.is_active && (
            <p className="text-[9px] font-bold tracking-wider" style={{ color: accent, textShadow: `0 0 8px ${accent}60` }}>
              {profile.presence_status || "I'm Here"}
            </p>
          )}
          {famzCount > 0 && (
            <p className="text-white/25 text-[9px] mt-0.5">
              {famzCount} FAMZ tapped in
            </p>
          )}
        </div>
      </div>

      {/* Now Playing pill */}
      {currentTrack && (
        <button
          className="absolute left-4 right-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl active:scale-98 transition-all"
          style={{
            bottom: 80,
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${accent}30`,
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => onNavigate('room:music')}
        >
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {[0, 1, 2].map(j => (
              <div
                key={j}
                className="w-0.5 rounded-full animate-bounce"
                style={{
                  height: 10 + j * 3,
                  background: accent,
                  animationDelay: `${j * 0.15}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-xs font-semibold truncate">{currentTrack.title}</p>
            <p className="text-white/40 text-[10px] truncate">{currentTrack.artist}</p>
          </div>
          <span className="text-white/30 text-[10px] flex-shrink-0 font-medium">Now Playing</span>
        </button>
      )}

      {/* Bottom wordmark */}
      <p
        className="absolute bottom-4 left-0 right-0 text-center text-[9px] tracking-[0.25em] uppercase text-white/15 font-medium"
        style={{
          opacity: animated ? 1 : 0,
          transition: 'opacity 1s ease 0.9s',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        Your Place. Your FAMZ.
      </p>

      {/* Presence Modal */}
      <PresenceModal isOpen={presenceOpen} onClose={() => setPresenceOpen(false)} />
    </div>
  );
}
