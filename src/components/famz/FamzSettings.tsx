import { useState } from 'react';
import { ArrowLeft, Check, Palette } from 'lucide-react';
import { useFamz } from '../../contexts/FamzContext';
import { useAuth } from '../../contexts/AuthContext';
import { FAMZ_COLORS, ViewName } from '../../types';

interface FamzSettingsProps {
  onNavigate: (view: ViewName) => void;
}

export function FamzSettings({ onNavigate }: FamzSettingsProps) {
  const { famzProfile, createFamzProfile, updateFamzProfile } = useFamz();
  const { signOut } = useAuth();
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    display_name: famzProfile?.display_name ?? '',
    display_color: famzProfile?.display_color ?? '#EC4899',
    avatar_url: famzProfile?.avatar_url ?? '',
  });

  async function handleSave() {
    setSaving(true);
    setError('');

    if (!famzProfile) {
      const { error: err } = await createFamzProfile(
        form.display_name.trim() || 'FAMZ',
        form.display_color
      );
      setSaving(false);
      if (err) setError(err);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
      return;
    }

    const { error: err } = await updateFamzProfile({
      display_name: form.display_name.trim() || 'FAMZ',
      display_color: form.display_color,
      avatar_url: form.avatar_url.trim(),
    });

    setSaving(false);
    if (err) setError(err);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const accent = form.display_color;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        <button
          onClick={() => onNavigate('home')}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">FAMZ Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-5">
        {/* Avatar preview */}
        <div className="flex flex-col items-center py-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
            style={{ background: `${accent}20`, border: `2px solid ${accent}` }}
          >
            {form.avatar_url ? (
              <img src={form.avatar_url} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-2xl font-black" style={{ color: accent }}>
                {form.display_name?.[0]?.toUpperCase() ?? 'F'}
              </span>
            )}
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2">
            Display Name
          </label>
          <input
            value={form.display_name}
            onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
            placeholder="Your FAMZ name..."
            maxLength={24}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2">
            Avatar URL (optional)
          </label>
          <input
            value={form.avatar_url}
            onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
            placeholder="https://..."
            type="url"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30"
          />
        </div>

        {/* Color selector */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2">
            Accent Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {FAMZ_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setForm(p => ({ ...p, display_color: color }))}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:scale-110"
                style={{ background: color }}
              >
                {accent === color && <Check size={16} className="text-white" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Palette size={14} className="text-white/40" />
            <input
              type="color"
              value={form.display_color}
              onChange={e => setForm(p => ({ ...p, display_color: e.target.value }))}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-white/40 text-xs font-mono">{form.display_color}</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: accent, color: '#000' }}
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : saved ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        <button
          onClick={signOut}
          className="w-full py-3 rounded-xl text-white/40 text-sm font-medium border border-white/10"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
