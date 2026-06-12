import { useEffect, useState } from 'react';
import { ShoppingBag, ExternalLink, Star, Plus, Trash2, Link, Zap, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { MerchProduct, formatPrice, ViewName } from '../../types';
import { Modal } from '../ui/Modal';
import { ImageUpload } from '../ui/ImageUpload';

interface MerchRoomProps {
  onNavigate?: (view: ViewName) => void;
}

export function MerchRoom({ onNavigate }: MerchRoomProps) {
  const { profile, isCreator } = usePlace();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price_cents: '', image_url: '', button_label: 'Shop Now', button_url: '', is_visible: true, eligible_daily_drop: false });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => { if (!profile) return; load(); }, [profile?.id]);

  async function load() {
    setLoading(true);
    let query = supabase.from('merch_products').select('*').eq('creator_id', profile!.id);
    if (!isCreator) query = query.eq('is_visible', true);
    const { data } = await query.order('is_featured', { ascending: false }).order('sort_order');
    setProducts(data ?? []);
    setLoading(false);
  }

  async function addProduct() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    await supabase.from('merch_products').insert({
      creator_id: profile!.id, name: form.name.trim(), description: form.description.trim(),
      price_cents: Math.round(parseFloat(form.price_cents) * 100) || 0, image_url: form.image_url.trim(),
      button_label: form.button_label.trim() || 'Shop Now', button_url: form.button_url.trim(), sort_order: products.length,
      is_visible: true, eligible_daily_drop: false,
    });
    setSaving(false); setAddOpen(false); setForm({ name: '', description: '', price_cents: '', image_url: '', button_label: 'Shop Now', button_url: '', is_visible: true, eligible_daily_drop: false }); load();
  }

  async function toggleFeature(id: string, featured: boolean) {
    await supabase.from('merch_products').update({ is_featured: !featured }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !featured } : p));
  }

  async function toggleDailyDrop(id: string, eligible: boolean) {
    await supabase.from('merch_products').update({ eligible_daily_drop: !eligible }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, eligible_daily_drop: !eligible } : p));
  }

  async function toggleVisibility(id: string, visible: boolean) {
    await supabase.from('merch_products').update({ is_visible: !visible }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_visible: !visible } : p));
  }

  async function deleteProduct(id: string) {
    await supabase.from('merch_products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  const featured = products.filter(p => p.is_featured);
  const withLinks = products.filter(p => !p.is_featured && p.button_url);
  const withoutLinks = products.filter(p => !p.is_featured && !p.button_url);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;

  return (
    <div className="pb-28">
      {isCreator && (
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('creator:merch')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}><ShoppingBag size={11} /> Manage Merch</button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}><Plus size={11} /> Add Product</button>
        </div>
      )}

      {featured.length > 0 && (
        <Bin label="Featured Merch" icon={Star} accent={accent}>
          <div className="space-y-3">
            {featured.map(p => (
              <div key={p.id} className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${accent}30`, background: `${accent}08` }}>
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div><h3 className="text-white font-bold text-base">{p.name}</h3>{p.description && <p className="text-white/50 text-xs mt-0.5">{p.description}</p>}</div>
                    <span className="text-white font-bold text-lg">{formatPrice(p.price_cents)}</span>
                  </div>
                  {p.button_url && <a href={p.button_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 mt-3" style={{ background: accent, color: '#000' }}>{p.button_label}<ExternalLink size={14} /></a>}
                </div>
                {isCreator && <div className="absolute top-2 right-2 flex gap-1">{p.eligible_daily_drop && <button className="w-6 h-6 rounded-full flex items-center justify-center text-yellow-300" style={{ background: 'rgba(0,0,0,0.5)' }}><Zap size={10} /></button>}<button onClick={() => toggleFeature(p.id, p.is_featured)} className={`w-6 h-6 rounded-full flex items-center justify-center ${p.is_featured ? 'text-yellow-400' : 'text-white/30'}`} style={{ background: 'rgba(0,0,0,0.5)' }}><Star size={10} /></button><button onClick={() => toggleVisibility(p.id, p.is_visible)} className={`w-6 h-6 rounded-full flex items-center justify-center ${p.is_visible ? 'text-white/40' : 'text-white/20'}`} style={{ background: 'rgba(0,0,0,0.5)' }}>{p.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}</button><button onClick={() => deleteProduct(p.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400" style={{ background: 'rgba(0,0,0,0.5)' }}><Trash2 size={10} /></button></div>}
              </div>
            ))}
          </div>
        </Bin>
      )}

      {withLinks.length > 0 && (
        <Bin label="External Store Links" icon={Link} accent={accent}>
          <div className="grid grid-cols-2 gap-3">
            {withLinks.map(p => <ProductCard key={p.id} product={p} accent={accent} isCreator={isCreator} onFeature={() => toggleFeature(p.id, p.is_featured)} onDailyDrop={() => toggleDailyDrop(p.id, p.eligible_daily_drop)} onVisibility={() => toggleVisibility(p.id, p.is_visible)} onDelete={() => deleteProduct(p.id)} />)}
          </div>
        </Bin>
      )}

      {withoutLinks.length > 0 && (
        <Bin label="Products" icon={ShoppingBag} accent={accent}>
          <div className="grid grid-cols-2 gap-3">
            {withoutLinks.map(p => <ProductCard key={p.id} product={p} accent={accent} isCreator={isCreator} onFeature={() => toggleFeature(p.id, p.is_featured)} onDailyDrop={() => toggleDailyDrop(p.id, p.eligible_daily_drop)} onVisibility={() => toggleVisibility(p.id, p.is_visible)} onDelete={() => deleteProduct(p.id)} />)}
          </div>
        </Bin>
      )}

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}><ShoppingBag size={24} style={{ color: accent }} /></div>
          <h3 className="text-white font-semibold text-base mb-1">No Merch Yet</h3>
          <p className="text-white/30 text-sm text-center mb-4">Products and store links will appear here.</p>
          {isCreator && <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: accent, color: '#000' }}><Plus size={12} /> Add Product</button>}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Product">
        <div className="p-4 space-y-3">
          {[
            { key: 'name', label: 'Product Name *', placeholder: 'e.g. Logo Tee...' },
            { key: 'price_cents', label: 'Price (USD)', placeholder: '29.99', type: 'number' },
            { key: 'description', label: 'Description', placeholder: 'About this product...' },
            { key: 'button_label', label: 'Button Label', placeholder: 'Shop Now' },
            { key: 'button_url', label: 'Button URL', placeholder: 'https://...', type: 'url' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input type={f.type ?? 'text'} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
            </div>
          ))}
          <ImageUpload value={form.image_url} onChange={url => setForm(p => ({ ...p, image_url: url }))} label="Product Image" creatorId={profile!.id} />
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_visible} onChange={e => setForm(p => ({ ...p, is_visible: e.target.checked }))} className="rounded" />
              <span className="text-white/60 text-sm">Visible to Visitors</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.eligible_daily_drop} onChange={e => setForm(p => ({ ...p, eligible_daily_drop: e.target.checked }))} className="rounded" />
              <span className="text-white/60 text-sm">Eligible for Daily Drop</span>
            </label>
          </div>
          <button onClick={addProduct} disabled={!form.name.trim() || saving} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>{saving ? 'Adding...' : 'Add Product'}</button>
        </div>
      </Modal>
    </div>
  );
}

function Bin({ label, icon: Icon, accent, children }: { label: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (<div className="px-4 py-2"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}><Icon size={12} style={{ color: accent }} /></div><p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{label}</p></div>{children}</div>);
}

function ProductCard({ product, accent, isCreator, onFeature, onDailyDrop, onVisibility, onDelete }: { product: MerchProduct; accent: string; isCreator: boolean; onFeature: () => void; onDailyDrop: () => void; onVisibility: () => void; onDelete: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square flex items-center justify-center" style={{ background: `${accent}10` }}><ShoppingBag size={28} className="text-white/20" /></div>}
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate">{product.name}</p>
        <p className="text-white/60 text-sm font-bold mt-0.5">{formatPrice(product.price_cents)}</p>
        {product.button_url && <a href={product.button_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 w-full py-2 rounded-lg font-semibold text-xs mt-2 transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>{product.button_label}</a>}
      </div>
      {isCreator && <div className="absolute top-2 right-2 flex gap-1">{product.eligible_daily_drop && <button onClick={onDailyDrop} className="w-6 h-6 rounded-full flex items-center justify-center text-yellow-300" style={{ background: 'rgba(0,0,0,0.5)' }}><Zap size={10} /></button>}<button onClick={onFeature} className={`w-6 h-6 rounded-full flex items-center justify-center ${product.is_featured ? 'text-yellow-400' : 'text-white/30'}`} style={{ background: 'rgba(0,0,0,0.5)' }}><Star size={10} /></button><button onClick={onVisibility} className={`w-6 h-6 rounded-full flex items-center justify-center ${product.is_visible ? 'text-white/40' : 'text-white/20'}`} style={{ background: 'rgba(0,0,0,0.5)' }}>{product.is_visible ? <Eye size={10} /> : <EyeOff size={10} />}</button><button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400" style={{ background: 'rgba(0,0,0,0.5)' }}><Trash2 size={10} /></button></div>}
    </div>
  );
}
