import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { usePlace } from '../../contexts/PlaceContext';

const ACCENT_COLORS = [
  '#EC4899', '#06B6D4', '#22C55E', '#A855F7',
  '#F97316', '#EAB308', '#3B82F6', '#EF4444',
  '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6',
];

export function ManageProfile() {
  const { profile, updateProfile } = usePlace();
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    profile_image_url: profile?.profile_image_url ?? '',
    cover_image_url: profile?.cover_image_url ?? '',
    accent_color: profile?.accent_color ?? '#EC4899',
    welcome_message: profile?.welcome_message ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    const { error: err } = await updateProfile(form);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const accent = form.accent_color;

  return (
    <div className="px-4 py-4 pb-12 space-y-5">
      <Field label="Place Name" required>
        <input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Your Place name..."
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
      </Field>

      <Field label="Welcome Message">
        <input
          value={form.welcome_message}
          onChange={e => setForm(p => ({ ...p, welcome_message: e.target.value }))}
          placeholder="e.g. Welcome to my world..."
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell your FAMZ about yourself..."
          rows={3}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors resize-none"
        />
      </Field>

      <Field label="Profile Image URL">
        <input
          value={form.profile_image_url}
          onChange={e => setForm(p => ({ ...p, profile_image_url: e.target.value }))}
          placeholder="https://..."
          type="url"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
        {form.profile_image_url && (
          <img src={form.profile_image_url} alt="Preview" className="mt-2 w-16 h-16 rounded-full object-cover" />
        )}
      </Field>

      <Field label="Cover Image URL">
        <input
          value={form.cover_image_url}
          onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
          placeholder="https://..."
          type="url"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/30 transition-colors"
        />
        {form.cover_image_url && (
          <img src={form.cover_image_url} alt="Preview" className="mt-2 w-full h-20 rounded-xl object-cover" />
        )}
      </Field>

      <Field label="Accent Color">
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setForm(p => ({ ...p, accent_color: color }))}
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
            value={form.accent_color}
            onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <span className="text-white/40 text-xs font-mono">{form.accent_color}</span>
        </div>
      </Field>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: accent, color: '#000' }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
        ) : saved ? (
          <><Check size={16} /> Saved!</>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
