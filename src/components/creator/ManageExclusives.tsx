import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { Exclusive } from '../../types';
import { Modal } from '../ui/Modal';

const FILE_TYPES = ['download', 'vip', 'behind_scenes', 'fan_reward', 'other'] as const;
const TYPE_LABELS: Record<string, string> = {
  download: 'Download', vip: 'VIP', behind_scenes: 'Behind the Scenes',
  fan_reward: 'Fan Reward', other: 'Exclusive',
};

export function ManageExclusives() {
  const { profile } = usePlace();
  const [items, setItems] = useState<Exclusive[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover_url: '', file_url: '', file_type: 'download' });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('exclusives').select('*').eq('creator_id', profile!.id).order('sort_order');
    setItems(data ?? []);
    setLoading(false);
  }

  async function addItem() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('exclusives').insert({
      creator_id: profile!.id,
      title: form.title.trim(),
      description: form.description.trim(),
      cover_url: form.cover_url.trim(),
      file_url: form.file_url.trim(),
      file_type: form.file_type,
      sort_order: items.length,
    });
    setSaving(false);
    setAddOpen(false);
    setForm({ title: '', description: '', cover_url: '', file_url: '', file_type: 'download' });
    load();
  }

  async function deleteItem(id: string) {
    await supabase.from('exclusives').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function toggleFeature(id: string, featured: boolean) {
    await supabase.from('exclusives').update({ is_featured: !featured }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_featured: !featured } : i));
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-white/40 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          <Plus size={12} /> Add Exclusive
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>
      ) : (
        <div className="px-4 space-y-2">
          {items.length === 0 && <p className="text-white/30 text-sm text-center py-8">No exclusives yet</p>}
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${accent}15` }}>
                {item.cover_url ? <img src={item.cover_url} className="w-full h-full object-cover" alt={item.title} /> : <div className="w-full h-full flex items-center justify-center"><Lock size={14} style={{ color: accent }} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
                <p className="text-white/40 text-xs">{TYPE_LABELS[item.file_type]}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleFeature(item.id, item.is_featured)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${item.is_featured ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>
                  <Star size={12} />
                </button>
                <button onClick={() => deleteItem(item.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Exclusive">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'e.g. VIP Download Pack...' },
            { key: 'description', label: 'Description', placeholder: 'What is this?...' },
            { key: 'cover_url', label: 'Cover Image URL', placeholder: 'https://...', type: 'url' },
            { key: 'file_url', label: 'File / Access URL', placeholder: 'https://...', type: 'url' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25"
              />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</label>
            <select
              value={form.file_type}
              onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/25"
            >
              {FILE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <button
            onClick={addItem}
            disabled={!form.title.trim() || saving}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: accent, color: '#000' }}
          >
            {saving ? 'Adding...' : 'Add Exclusive'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
