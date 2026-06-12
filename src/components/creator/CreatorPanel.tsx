import { User, Music, Play, ShoppingBag, Newspaper, Star, Grid, LogOut, ChevronRight, Shield, Palette, MessageCircle } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { ViewName } from '../../types';

interface CreatorPanelProps {
  onNavigate: (view: ViewName) => void;
}

const PLACE_ITEMS = [
  { icon: User, label: 'Profile & Branding', sub: 'Name, bio, avatar, cover, accent color', view: 'creator:profile' as ViewName },
  { icon: Grid, label: 'Room Management', sub: 'Add, remove, rename, reorder, customize rooms', view: 'creator:rooms' as ViewName },
];

const CONTENT_ITEMS = [
  { icon: Music, label: 'Music', sub: 'Tracks, albums, playlists — upload, pin, feature', view: 'creator:music' as ViewName },
  { icon: Play, label: 'Videos', sub: 'Uploads, thumbnails — pin, feature, delete', view: 'creator:videos' as ViewName },
  { icon: Newspaper, label: 'News', sub: 'Posts, announcements — create, pin, schedule', view: 'creator:news' as ViewName },
  { icon: ShoppingBag, label: 'Merch', sub: 'Products, prices, links — add, feature', view: 'creator:merch' as ViewName },
  { icon: Star, label: 'Exclusives', sub: 'VIP content, downloads, rewards', view: 'creator:exclusives' as ViewName },
];

export function CreatorPanel({ onNavigate }: CreatorPanelProps) {
  const { profile, isAdmin } = usePlace();
  const { signOut } = useAuth();
  const accent = profile?.accent_color ?? '#EC4899';

  return (
    <div className="pb-8">
      {/* Creator identity */}
      <div className="px-4 py-6 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
          style={{ border: `2px solid ${accent}` }}
        >
          {profile?.profile_image_url ? (
            <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `${accent}20` }}>
              <img src="/myplacelogo.png" alt="MyPlace" className="w-10 h-10 object-contain" />
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: accent }}>Your Place</p>
          <h2 className="text-white font-bold text-xl leading-tight">{profile?.name ?? 'My Place'}</h2>
          {profile?.welcome_message && (
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{profile.welcome_message}</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-4 mb-4" />

      {/* Place Settings */}
      <div className="px-4 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-white/25 font-bold">Place Settings</p>
      </div>
      <div className="px-4 space-y-2">
        {PLACE_ITEMS.map(item => {
          const IconComp = item.icon;
          return (
            <button key={item.view} onClick={() => onNavigate(item.view)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-98 group" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}><IconComp size={18} style={{ color: accent }} /></div>
              <div className="flex-1 text-left"><p className="text-white font-semibold text-sm">{item.label}</p><p className="text-white/35 text-xs">{item.sub}</p></div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Content Management */}
      <div className="h-px bg-white/5 mx-4 my-4" />
      <div className="px-4 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-white/25 font-bold">Content Management</p>
      </div>
      <div className="px-4 space-y-2">
        {CONTENT_ITEMS.map(item => {
          const IconComp = item.icon;
          return (
            <button key={item.view} onClick={() => onNavigate(item.view)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-98 group" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}><IconComp size={18} style={{ color: accent }} /></div>
              <div className="flex-1 text-left"><p className="text-white font-semibold text-sm">{item.label}</p><p className="text-white/35 text-xs">{item.sub}</p></div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="h-px bg-white/5 mx-4 my-4" />
          <div className="px-4 mb-2">
            <p className="text-[10px] uppercase tracking-widest text-white/25 font-bold">Platform Admin</p>
          </div>
          <div className="px-4">
            <button
              onClick={() => onNavigate('creator:admin')}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-98 group"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Shield size={18} className="text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-400 font-semibold text-sm">Admin Controls</p>
                <p className="text-white/35 text-xs">Profile info, data management</p>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </button>
          </div>
        </>
      )}

      {/* Sign out */}
      <div className="px-4 mt-6">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white/40 text-sm font-medium transition-all hover:text-white/60"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
