import { useEffect, useState } from 'react';
import { Check, AlertTriangle, Mail, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PlatformSettings } from '../../types';

export function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    require_creator_verification: false,
    allow_creator_signups: true,
    allow_famz_signups: true,
    platform_announcement: '',
    daily_drop_minimum: 1,
    upload_limit_mb: 50,
    maintenance_mode: false,
    support_email: 'support@myplace.app',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from('platform_settings')
      .select('*')
      .maybeSingle();
    if (data) {
      setSettings(data);
      setForm({
        require_creator_verification: data.require_creator_verification,
        allow_creator_signups: data.allow_creator_signups,
        allow_famz_signups: data.allow_famz_signups,
        platform_announcement: data.platform_announcement,
        daily_drop_minimum: data.daily_drop_minimum,
        upload_limit_mb: data.upload_limit_mb,
        maintenance_mode: data.maintenance_mode,
        support_email: data.support_email,
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('platform_settings')
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq('id', '11111111-1111-1111-1111-111111111111');

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="pb-10">
      {/* Maintenance mode warning */}
      {form.maintenance_mode && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">
              Maintenance Mode Active
            </span>
          </div>
          <p className="text-yellow-400/60 text-xs mt-1">
            Only admins can access the platform.
          </p>
        </div>
      )}

      <div className="px-4 space-y-4">
        {/* Signups */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white font-semibold text-sm mb-3">Signups</p>

          <Toggle
            label="Allow Creator Signups"
            value={form.allow_creator_signups}
            onChange={v => setForm(p => ({ ...p, allow_creator_signups: v }))}
          />
          <Toggle
            label="Allow FAMZ Signups"
            value={form.allow_famz_signups}
            onChange={v => setForm(p => ({ ...p, allow_famz_signups: v }))}
          />
          <Toggle
            label="Require Creator Verification"
            value={form.require_creator_verification}
            onChange={v => setForm(p => ({ ...p, require_creator_verification: v }))}
          />
        </div>

        {/* Daily Drop */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white font-semibold text-sm mb-3">Daily Drop</p>

          <div>
            <label className="text-white/50 text-xs mb-1 block">Minimum Requirements</label>
            <input
              type="number"
              value={form.daily_drop_minimum}
              onChange={e => setForm(p => ({ ...p, daily_drop_minimum: parseInt(e.target.value) || 1 }))}
              min={1}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Upload Limits */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white font-semibold text-sm mb-3">Upload Limits</p>

          <div>
            <label className="text-white/50 text-xs mb-1 block">Max Upload Size (MB)</label>
            <input
              type="number"
              value={form.upload_limit_mb}
              onChange={e => setForm(p => ({ ...p, upload_limit_mb: parseInt(e.target.value) || 50 }))}
              min={1}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Platform Settings */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white font-semibold text-sm mb-3">Platform</p>

          <div className="mb-3">
            <label className="text-white/50 text-xs mb-1 block">Platform Announcement</label>
            <textarea
              value={form.platform_announcement}
              onChange={e => setForm(p => ({ ...p, platform_announcement: e.target.value }))}
              placeholder="Announcement message (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 resize-none"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs mb-1 block">Support Email</label>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-white/40" />
              <input
                type="email"
                value={form.support_email}
                onChange={e => setForm(p => ({ ...p, support_email: e.target.value }))}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
              />
            </div>
          </div>

          <Toggle
            label="Maintenance Mode"
            value={form.maintenance_mode}
            onChange={v => setForm(p => ({ ...p, maintenance_mode: v }))}
            danger
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-white text-black"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : saved ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            <>
              <Save size={16} /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  danger,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className={`text-sm ${danger ? (value ? 'text-red-400' : 'text-white/50') : 'text-white/70'}`}
      >
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-7 rounded-full relative"
        style={{
          background: value
            ? danger
              ? '#EF4444'
              : '#EC4899'
            : 'rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all"
          style={{ left: value ? 'calc(100% - 26px)' : 2 }}
        />
      </button>
    </div>
  );
}
