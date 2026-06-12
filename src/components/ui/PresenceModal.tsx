import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';

interface PresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PresenceModal({ isOpen, onClose }: PresenceModalProps) {
  const { profile, updateProfile } = usePlace();
  const [status, setStatus] = useState(profile?.presence_status ?? '');
  const [saving, setSaving] = useState(false);
  const accent = profile?.accent_color ?? '#EC4899';

  if (!isOpen) return null;

  async function activate() {
    if (saving) return;
    setSaving(true);
    await updateProfile({ is_active: true, presence_status: status.trim(), presence_updated_at: new Date().toISOString() });
    setSaving(false);
    onClose();
  }

  async function deactivate() {
    if (saving) return;
    setSaving(true);
    await updateProfile({ is_active: false, presence_status: '', presence_updated_at: new Date().toISOString() });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${accent}20`, border: `1.5px solid ${accent}` }}>
              <Zap size={14} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Come kick it at MyPlace...</p>
              <p className="text-white/40 text-xs">I'm here.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>
        <input value={status} onChange={e => setStatus(e.target.value.slice(0, 60))} placeholder="Cooking up. Making beats. Pull up..." maxLength={60}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-white/30 transition-colors mb-1" />
        <p className="text-white/20 text-[10px] text-right mb-4">{status.length}/60</p>
        <div className="flex gap-2">
          {profile?.is_active ? (
            <button onClick={deactivate} disabled={saving}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {saving ? 'Saving...' : 'Go Offline'}
            </button>
          ) : null}
          <button onClick={activate} disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: accent, color: '#000' }}>
            {saving ? 'Saving...' : profile?.is_active ? 'Update Status' : "I'm Here"}
          </button>
        </div>
      </div>
    </div>
  );
}
