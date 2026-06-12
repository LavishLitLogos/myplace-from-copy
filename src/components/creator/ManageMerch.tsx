import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { MerchProduct, formatPrice } from '../../types';
import { Modal } from '../ui/Modal';

export function ManageMerch() {
  const { profile } = usePlace();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price_cents: '', image_url: '',
    button_label: 'Shop Now', button_url: '',
  });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('merch_products').select('*').eq('creator_id', profile!.id).order('sort_order');
    setProducts(data ?? []);
    setLoading(false);
  }

  async function addProduct() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    await supabase.from('merch_products').insert({
      creator_id: profile!.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price_cents: Math.round(parseFloat(form.price_cents) * 100) || 0,
      image_url: form.image_url.trim(),
      button_label: form.button_label.trim() || 'Shop Now',
      button_url: form.button_url.trim(),
      sort_order: products.length,
    });
    setSaving(false);
    setAddOpen(false);
    setForm({ name: '', description: '', price_cents: '', image_url: '', button_label: 'Shop Now', button_url: '' });
    load();
  }

  async function deleteProduct(id: string) {
    await supabase.from('merch_products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function toggleFeature(id: string, featured: boolean) {
    await supabase.from('merch_products').update({ is_featured: !featured }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !featured } : p));
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-white/40 text-xs">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          <Plus size={12} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>
      ) : (
        <div className="px-4 space-y-2">
          {products.length === 0 && <p className="text-white/30 text-sm text-center py-8">No products yet</p>}
          {products.map(product => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${accent}15` }}>
                {product.image_url
                  ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                  : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={16} className="text-white/30" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                <p className="font-bold text-xs" style={{ color: accent }}>{formatPrice(product.price_cents)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleFeature(product.id, product.is_featured)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${product.is_featured ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>
                  <Star size={12} />
                </button>
                <button onClick={() => deleteProduct(product.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Product">
        <div className="p-4 space-y-3">
          {[
            { key: 'name', label: 'Product Name *', placeholder: 'e.g. Logo Tee...' },
            { key: 'price_cents', label: 'Price (USD)', placeholder: '29.99', type: 'number' },
            { key: 'image_url', label: 'Product Image URL', placeholder: 'https://...', type: 'url' },
            { key: 'description', label: 'Description', placeholder: 'About this product...' },
            { key: 'button_label', label: 'Button Label', placeholder: 'Shop Now' },
            { key: 'button_url', label: 'Button URL', placeholder: 'https://...', type: 'url' },
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
          <button
            onClick={addProduct}
            disabled={!form.name.trim() || saving}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: accent, color: '#000' }}
          >
            {saving ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
