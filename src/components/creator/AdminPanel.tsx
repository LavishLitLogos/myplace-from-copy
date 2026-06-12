import { Shield, Users, Database, AlertTriangle, Trash2, Globe, Settings, Eye, Ban, ChevronRight, AlertCircle } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { ViewName } from '../../types';

interface AdminPanelProps {
  onNavigate: (view: ViewName) => void;
}

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { profile, refreshProfile } = usePlace();
  const [confirmReset, setConfirmReset] = useState<string | false>(false);
  const [message, setMessage] = useState('');
  const [pendingReports, setPendingReports] = useState(0);

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    loadPendingReports();
  }, []);

  async function loadPendingReports() {
    const { count } = await supabase
      .from('content_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingReports(count ?? 0);
  }

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

  const ADMIN_TOOLS = [
    { icon: Eye, label: 'View All Places', sub: 'Browse and search all creator Places', view: 'admin:places' as ViewName },
    { icon: Users, label: 'Manage Users', sub: 'View, suspend, restore FAMZ and creators', view: 'admin:users' as ViewName },
    { icon: Shield, label: 'Moderate Content', sub: `${pendingReports} report${pendingReports !== 1 ? 's' : ''} pending review`, view: 'admin:moderation' as ViewName, badge: pendingReports > 0 ? pendingReports : undefined },
    { icon: Settings, label: 'Platform Settings', sub: 'Signups, limits, maintenance mode', view: 'admin:settings' as ViewName },
  ];

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

        {/* Pending reports alert */}
        {pendingReports > 0 && (
          <button
            onClick={() => onNavigate('admin:moderation')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20">
              <AlertCircle size={16} className="text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-red-400 font-semibold text-sm">{pendingReports} Pending Reports</p>
              <p className="text-white/40 text-xs">Click to review</p>
            </div>
            <ChevronRight size={16} className="text-red-400/50" />
          </button>
        )}

        {/* Admin tools */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-white/40" />
            <p className="text-white font-semibold text-sm">Admin Tools</p>
          </div>
          <div className="space-y-2">
            {ADMIN_TOOLS.map(tool => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.view}
                  onClick={() => onNavigate(tool.view)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 transition-all active:scale-98 group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <IconComp size={16} className="text-white/50" />
                  <div className="flex-1 text-left">
                    <p className="text-white/90">{tool.label}</p>
                    <p className="text-white/40 text-xs">{tool.sub}</p>
                  </div>
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                      {tool.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/40" />
                </button>
              );
            })}
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
