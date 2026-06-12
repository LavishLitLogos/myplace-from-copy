import { Shield, Users, Database, AlertTriangle, Trash2, Globe, Settings, Eye, Ban } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export function AdminPanel() {
  const { profile, refreshProfile } = usePlace();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');

  const accent = profile?.accent_color ?? '#EC4899';

  async function resetRoomData() {
    if (!profile) return;
    const tables = ['music_tracks', 'music_albums', 'videos', 'news_posts', 'merch_products', 'exclusives', 'chat_messages'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('creator_id', profile.id);
    }
    setMessage('All room data cleared.');
    setConfirmReset(false);
  }

  async function deleteProfile() {
    if (!profile) return;
    const tables = ['music_tracks', 'music_albums', 'videos', 'news_posts', 'merch_products', 'exclusives', 'chat_messages', 'rooms'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('creator_id', profile.id);
    }
    await supabase.from('creator_profile').delete().eq('id', profile.id);
    setMessage('Profile and all data deleted.');
    setConfirmReset(false);
    refreshProfile();
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: `${accent}15`, border: `1.5px solid ${accent}40` }}
        >
          <Shield size={22} style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>Platform Admin</p>
          <h2 className="text-white font-bold text-lg">Admin Controls</h2>
        </div>
      </div>

      {message && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
          {message}
        </div>
      )}

      <div className="px-4 space-y-3">
        {/* Profile info */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-white/40" />
            <p className="text-white font-semibold text-sm">Profile Info</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">Profile ID</span>
              <span className="text-white/70 font-mono truncate ml-4">{profile?.id ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">User ID</span>
              <span className="text-white/70 font-mono truncate ml-4">{profile?.user_id ?? 'Unclaimed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Name</span>
              <span className="text-white/70">{profile?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Created</span>
              <span className="text-white/70">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* Platform overview */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-white/40" />
            <p className="text-white font-semibold text-sm">Platform Overview</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-white/40">Active Place</span><span className="text-white/70">{profile?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Accent Color</span><span className="text-white/70 font-mono">{profile?.accent_color ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Rooms</span><span className="text-white/70">6 default</span></div>
          </div>
        </div>

        {/* Admin tools */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-white/40" />
            <p className="text-white font-semibold text-sm">Admin Tools</p>
          </div>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-98" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Eye size={14} /> View All Places
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-98" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Users size={14} /> Manage Users
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-98" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Shield size={14} /> Moderate Content
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white/50 transition-all active:scale-98" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Ban size={14} /> Platform Settings
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400/60" />
            <p className="text-red-400/80 font-semibold text-sm">Danger Zone</p>
          </div>
          <p className="text-white/30 text-xs mb-4">These actions are irreversible. Use with caution.</p>

          <div className="space-y-2">
            <button
              onClick={() => setConfirmReset('rooms')}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-98"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.7)' }}
            >
              <Database size={14} />
              Clear All Room Data
            </button>
            <button
              onClick={() => setConfirmReset('profile')}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-98"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.7)' }}
            >
              <Trash2 size={14} />
              Delete Profile & All Data
            </button>
          </div>
        </div>

        {/* Confirmation dialog */}
        {confirmReset && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-white text-sm font-semibold mb-1">Are you sure?</p>
            <p className="text-white/40 text-xs mb-3">
              {confirmReset === 'rooms'
                ? 'This will delete all music, videos, news, merch, exclusives, and chat messages.'
                : 'This will delete the profile and ALL associated data permanently.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReset === 'rooms' ? resetRoomData : deleteProfile}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'rgba(239,68,68,0.8)' }}
              >
                {confirmReset === 'rooms' ? 'Clear Data' : 'Delete All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
