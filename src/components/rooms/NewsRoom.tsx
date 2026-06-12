import { useEffect, useState } from 'react';
import { Newspaper, Pin, Star, ArrowLeft, Plus, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { NewsPost, ViewName } from '../../types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface NewsRoomProps {
  onNavigate?: (view: ViewName) => void;
}

export function NewsRoom({ onNavigate }: NewsRoomProps) {
  const { profile, isCreator } = usePlace();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [selected, setSelected] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', cover_url: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', cover_url: '' });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => { if (!profile) return; load(); }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('news_posts').select('*').eq('creator_id', profile!.id).order('is_pinned', { ascending: false }).order('publish_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function addPost() {
    if (!form.title.trim() || !form.body.trim() || saving) return;
    setSaving(true);
    await supabase.from('news_posts').insert({ creator_id: profile!.id, title: form.title.trim(), body: form.body.trim(), cover_url: form.cover_url.trim(), publish_at: new Date().toISOString() });
    setSaving(false); setAddOpen(false); setForm({ title: '', body: '', cover_url: '' }); load();
  }

  async function deletePost(id: string) {
    await supabase.from('news_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function toggle(id: string, field: 'is_pinned' | 'is_featured', val: boolean) {
    await supabase.from('news_posts').update({ [field]: !val }).eq('id', id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: !val } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, [field]: !val } : prev);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase.from('news_posts').update({ title: editForm.title, body: editForm.body, cover_url: editForm.cover_url, updated_at: new Date().toISOString() }).eq('id', id);
    setSaving(false); setEditing(null); load();
  }

  const pinned = posts.filter(p => p.is_pinned);
  const featured = posts.filter(p => p.is_featured && !p.is_pinned);
  const latest = posts.filter(p => !p.is_pinned && !p.is_featured);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;

  if (selected) {
    return (
      <div className="pb-28">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-white/40 text-sm"><ArrowLeft size={14} /> Back</button>
        {isCreator && editing === selected.id ? (
          <div className="px-4 space-y-3">
            <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none" />
            <textarea value={editForm.body} onChange={e => setEditForm(p => ({ ...p, body: e.target.value }))} rows={8} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none" />
            <input value={editForm.cover_url} onChange={e => setEditForm(p => ({ ...p, cover_url: e.target.value }))} placeholder="Cover URL..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none" />
            <div className="flex gap-2">
              <button onClick={() => saveEdit(selected.id)} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: accent, color: '#000' }}>{saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setEditing(null)} className="px-4 py-3 rounded-xl text-sm text-white/40">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {selected.cover_url && <img src={selected.cover_url} alt={selected.title} className="w-full h-48 object-cover" />}
            <div className="px-4 pt-4">
              {selected.is_pinned && <div className="flex items-center gap-1 mb-2"><Pin size={10} style={{ color: accent }} /><span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>Pinned</span></div>}
              {selected.is_featured && <div className="flex items-center gap-1 mb-2"><Star size={10} style={{ color: accent }} /><span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>Featured</span></div>}
              <h1 className="text-white font-bold text-2xl mb-2 leading-tight">{selected.title}</h1>
              <p className="text-white/40 text-xs mb-6">{formatDate(selected.publish_at ?? selected.created_at)}</p>
              <div className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap">{selected.body}</div>
              {isCreator && (
                <div className="flex gap-2 mt-6">
                  <button onClick={() => { setEditing(selected.id); setEditForm({ title: selected.title, body: selected.body, cover_url: selected.cover_url }); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: `${accent}20`, color: accent }}><Edit3 size={12} /> Edit</button>
                  <button onClick={() => toggle(selected.id, 'is_pinned', selected.is_pinned)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: selected.is_pinned ? `${accent}20` : 'rgba(255,255,255,0.05)', color: selected.is_pinned ? accent : 'rgba(255,255,255,0.4)' }}><Pin size={12} /> {selected.is_pinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={() => deletePost(selected.id)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400/60" style={{ background: 'rgba(239,68,68,0.08)' }}><Trash2 size={12} /> Delete</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28">
      {isCreator && (
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('creator:news')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}><Newspaper size={11} /> Manage News</button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}><Plus size={11} /> Create Post</button>
        </div>
      )}

      {pinned.length > 0 && (
        <Bin label="Pinned Updates" icon={Pin} accent={accent}>
          <div className="space-y-2">{pinned.map(post => <PostCard key={post.id} post={post} accent={accent} onClick={() => setSelected(post)} isCreator={isCreator} onPin={() => toggle(post.id, 'is_pinned', post.is_pinned)} onFeature={() => toggle(post.id, 'is_featured', post.is_featured)} onDelete={() => deletePost(post.id)} />)}</div>
        </Bin>
      )}

      {featured.length > 0 && (
        <Bin label="Featured" icon={Star} accent={accent}>
          <div className="space-y-2">{featured.map(post => <PostCard key={post.id} post={post} accent={accent} onClick={() => setSelected(post)} isCreator={isCreator} onPin={() => toggle(post.id, 'is_pinned', post.is_pinned)} onFeature={() => toggle(post.id, 'is_featured', post.is_featured)} onDelete={() => deletePost(post.id)} />)}</div>
        </Bin>
      )}

      {latest.length > 0 && (
        <Bin label="Latest Posts" icon={Newspaper} accent={accent}>
          <div className="space-y-2">{latest.map(post => <PostCard key={post.id} post={post} accent={accent} onClick={() => setSelected(post)} isCreator={isCreator} onPin={() => toggle(post.id, 'is_pinned', post.is_pinned)} onFeature={() => toggle(post.id, 'is_featured', post.is_featured)} onDelete={() => deletePost(post.id)} />)}</div>
        </Bin>
      )}

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}><Newspaper size={24} style={{ color: accent }} /></div>
          <h3 className="text-white font-semibold text-base mb-1">No Updates Yet</h3>
          <p className="text-white/30 text-sm text-center mb-4">Posts and announcements will appear here.</p>
          {isCreator && <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: accent, color: '#000' }}><Plus size={12} /> Create Post</button>}
        </div>
      )}

      {addOpen && (
        <div className="mx-4 mb-4 p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white font-semibold text-sm">New Post</p>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Title..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your post..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25 resize-none" />
          <input value={form.cover_url} onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))} placeholder="Cover image URL (optional)..." type="url" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
          <div className="flex gap-2">
            <button onClick={addPost} disabled={!form.title.trim() || saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>{saving ? 'Posting...' : 'Post'}</button>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl text-sm text-white/50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Bin({ label, icon: Icon, accent, children }: { label: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (<div className="px-4 py-2"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}><Icon size={12} style={{ color: accent }} /></div><p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{label}</p></div>{children}</div>);
}

function PostCard({ post, accent, onClick, isCreator, onPin, onFeature, onDelete }: { post: NewsPost; accent: string; onClick: () => void; isCreator: boolean; onPin: () => void; onFeature: () => void; onDelete: () => void }) {
  return (
    <div className="relative">
      <button onClick={onClick} className="w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all active:scale-98" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {post.cover_url && <img src={post.cover_url} alt={post.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">{post.is_pinned && <Pin size={9} className="text-white/30" />}{post.is_featured && <Star size={9} style={{ color: accent }} />}<span className="text-white/30 text-[10px]">{formatDate(post.publish_at ?? post.created_at)}</span></div>
          <p className="text-white font-semibold text-sm leading-snug truncate">{post.title}</p>
          <p className="text-white/40 text-xs line-clamp-2 mt-0.5">{post.body}</p>
        </div>
      </button>
      {isCreator && <div className="absolute top-1 right-1 flex gap-0.5"><button onClick={onPin} className="w-5 h-5 rounded-full flex items-center justify-center text-white/20 hover:text-white/50"><Pin size={8} /></button><button onClick={onFeature} className="w-5 h-5 rounded-full flex items-center justify-center text-white/20 hover:text-yellow-400"><Star size={8} /></button><button onClick={onDelete} className="w-5 h-5 rounded-full flex items-center justify-center text-white/20 hover:text-red-400"><Trash2 size={8} /></button></div>}
    </div>
  );
}
