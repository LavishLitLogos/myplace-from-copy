import { useEffect, useState } from 'react';
import { Star, Download, Lock, Crown, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { Exclusive, ViewName } from '../../types';
import { Modal } from '../ui/Modal';

const TYPE_ICONS: Record<string, React.ElementType> = { download: Download, vip: Crown, behind_scenes: Star, fan_reward: Star, other: Lock };
const TYPE_LABELS: Record<string, string> = { download: 'Downloads', vip: 'VIP Content', behind_scenes: 'Behind the Scenes', fan_reward: 'Fan Rewards', other: 'Exclusives' };
const TYPE_SINGULAR: Record<string, string> = { download: 'Download', vip: 'VIP', behind_scenes: 'Behind the Scenes', fan_reward: 'Fan Reward', other: 'Exclusive' };

interface ExclusivesRoomProps {
  onNavigate?: (view: ViewName) => void;
}

export function ExclusivesRoom({ onNavigate }: ExclusivesRoomProps) {
  const { profile, isCreator } = usePlace();
  const [items, setItems] = useState<Exclusive[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover_url: '', file_url: '', file_type: 'download' });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => { if (!profile) return; load(); }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('exclusives').select('*').eq('creator_id', profile!.id).order('is_featured', { ascending: false }).order('sort_order');
    setItems(data ?? []);
    setLoading(false);
  }

  async function addItem() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('exclusives').insert({
      creator_id: profile!.id, title: form.title.trim(), description: form.description.trim(),
      cover_url: form.cover_url.trim(), file_url: form.file_url.trim(), file_type: form.file_type, sort_order: items.length,
    });
    setSaving(false); setAddOpen(false); setForm({ title: '', description: '', cover_url: '', file_url: '', file_type: 'download' }); load();
  }

  async function toggleFeature(id: string, featured: boolean) {
    await supabase.from('exclusives').update({ is_featured: !featured }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_featured: !featured } : i));
  }

  async function deleteItem(id: string) {
    await supabase.from('exclusives').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const featured = items.filter(i => i.is_featured);
  const byType = Object.entries(TYPE_LABELS).map(([type, label]) => ({
    type, label, items: items.filter(i => i.file_type === type && !i.is_featured),
  })).filter(g => g.items.length > 0);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;

  return (
    <div className="pb-28 px-4">
      {isCreator && (
        <div className="pt-3 pb-2 flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('creator:exclusives')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}><Star size={11} /> Manage Exclusives</button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}><Plus size={11} /> Upload Exclusive</button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${accent}20` }}><Star size={14} style={{ color: accent }} fill={accent} /></div>
        <div><p className="text-white font-semibold text-sm">FAMZ Exclusives</p><p className="text-white/30 text-[10px]">{items.length} item{items.length !== 1 ? 's' : ''}</p></div>
      </div>

      {featured.length > 0 && (
        <Bin label="Featured" icon={Star} accent={accent}>
          <div className="space-y-3">{featured.map(item => <ExclusiveFeaturedCard key={item.id} item={item} accent={accent} isCreator={isCreator} onFeature={() => toggleFeature(item.id, item.is_featured)} onDelete={() => deleteItem(item.id)} />)}</div>
        </Bin>
      )}

      {byType.map(({ type, label, items: typeItems }) => (
        <Bin key={type} label={label} icon={TYPE_ICONS[type] ?? Lock} accent={accent}>
          <div className="grid grid-cols-2 gap-3">{typeItems.map(item => <ExclusiveCard key={item.id} item={item} accent={accent} isCreator={isCreator} onFeature={() => toggleFeature(item.id, item.is_featured)} onDelete={() => deleteItem(item.id)} />)}</div>
        </Bin>
      ))}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}><Star size={24} style={{ color: accent }} /></div>
          <h3 className="text-white font-semibold text-base mb-1">Nothing Here Yet</h3>
          <p className="text-white/30 text-sm text-center mb-4">Exclusive content coming soon.</p>
          {isCreator && <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: accent, color: '#000' }}><Plus size={12} /> Upload Exclusive</button>}
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
              <input type={f.type ?? 'text'} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</label>
            <select value={form.file_type} onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              {Object.entries(TYPE_SINGULAR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button onClick={addItem} disabled={!form.title.trim() || saving} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>{saving ? 'Adding...' : 'Add Exclusive'}</button>
        </div>
      </Modal>
    </div>
  );
}

function Bin({ label, icon: Icon, accent, children }: { label: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (<div className="py-2"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}><Icon size={12} style={{ color: accent }} /></div><p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{label}</p></div>{children}</div>);
}

function ExclusiveFeaturedCard({ item, accent, isCreator, onFeature, onDelete }: { item: Exclusive; accent: string; isCreator: boolean; onFeature: () => void; onDelete: () => void }) {
  const IconComp = TYPE_ICONS[item.file_type] ?? Lock;
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${accent}40`, background: `${accent}0c` }}>
      {item.cover_url && <img src={item.cover_url} alt={item.title} className="w-full h-40 object-cover" />}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2"><IconComp size={12} style={{ color: accent }} /><span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>{TYPE_SINGULAR[item.file_type]}</span><Star size={10} style={{ color: accent }} fill={accent} className="ml-auto" /></div>
        <h3 className="text-white font-bold text-base mb-1">{item.title}</h3>
        {item.description && <p className="text-white/50 text-sm mb-3">{item.description}</p>}
        {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95" style={{ background: accent, color: '#000' }}><IconComp size={14} /> Access Now</a>}
      </div>
      {isCreator && <div className="absolute top-2 right-2 flex gap-1"><button onClick={onFeature} className="w-6 h-6 rounded-full flex items-center justify-center text-yellow-400" style={{ background: 'rgba(0,0,0,0.5)' }}><Star size={10} /></button><button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400" style={{ background: 'rgba(0,0,0,0.5)' }}><Trash2 size={10} /></button></div>}
    </div>
  );
}

function ExclusiveCard({ item, accent, isCreator, onFeature, onDelete }: { item: Exclusive; accent: string; isCreator: boolean; onFeature: () => void; onDelete: () => void }) {
  const IconComp = TYPE_ICONS[item.file_type] ?? Lock;
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square flex items-center justify-center" style={{ background: `${accent}10` }}><IconComp size={28} style={{ color: accent, opacity: 0.5 }} /></div>}
      <div className="p-3">
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: accent }}>{TYPE_SINGULAR[item.file_type]}</p>
        <p className="text-white text-xs font-semibold truncate">{item.title}</p>
        {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-[10px] font-bold mt-2 transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>Access <IconComp size={9} /></a>}
      </div>
      {isCreator && <div className="absolute top-1 right-1 flex gap-0.5"><button onClick={onFeature} className="w-5 h-5 rounded-full flex items-center justify-center text-white/20 hover:text-yellow-400"><Star size={8} /></button><button onClick={onDelete} className="w-5 h-5 rounded-full flex items-center justify-center text-white/20 hover:text-red-400"><Trash2 size={8} /></button></div>}
    </div>
  );
}
