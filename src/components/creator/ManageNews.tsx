import { useEffect, useState } from 'react';
import { Plus, Trash2, Pin, Star, CreditCard as Edit3, Check, X, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { NewsPost } from '../../types';
import { ImageUpload } from '../ui/ImageUpload';

export function ManageNews() {
  const { profile } = usePlace();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', cover_url: '', allow_comments: true, is_visible: true });
  const [editForm, setEditForm] = useState({ title: '', body: '', cover_url: '', allow_comments: true, is_visible: true });
  const [saving, setSaving] = useState(false);

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('news_posts')
      .select('*')
      .eq('creator_id', profile!.id)
      .order('created_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function addPost() {
    if (!form.title.trim() || !form.body.trim() || saving) return;
    setSaving(true);
    await supabase.from('news_posts').insert({
      creator_id: profile!.id,
      title: form.title.trim(),
      body: form.body.trim(),
      cover_url: form.cover_url.trim(),
      allow_comments: form.allow_comments,
      is_visible: form.is_visible,
      publish_at: new Date().toISOString(),
    });
    setSaving(false);
    setAddOpen(false);
    setForm({ title: '', body: '', cover_url: '', allow_comments: true, is_visible: true });
    load();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase.from('news_posts').update({
      title: editForm.title,
      body: editForm.body,
      cover_url: editForm.cover_url,
      allow_comments: editForm.allow_comments,
      is_visible: editForm.is_visible,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function deletePost(id: string) {
    await supabase.from('news_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function toggle(id: string, field: 'is_pinned' | 'is_featured' | 'allow_comments' | 'is_visible', val: boolean) {
    await supabase.from('news_posts').update({ [field]: !val }).eq('id', id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: !val } : p));
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-white/40 text-xs">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          <Plus size={12} /> New Post
        </button>
      </div>

      {addOpen && (
        <div className="mx-4 mb-4 p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white font-semibold text-sm">New Post</p>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Title..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25"
          />
          <textarea
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            placeholder="Write your post..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25 resize-none"
          />
          <ImageUpload value={form.cover_url} onChange={url => setForm(p => ({ ...p, cover_url: url }))} creatorId={profile!.id} type="news_covers" />
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setForm(p => ({ ...p, allow_comments: !p.allow_comments }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${form.allow_comments ? 'text-white' : 'text-white/50'}`}
              style={form.allow_comments ? { background: `${accent}25` } : { background: 'rgba(255,255,255,0.05)' }}
            >
              <MessageCircle size={14} /> Comments
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, is_visible: !p.is_visible }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${form.is_visible ? 'text-white' : 'text-white/50'}`}
              style={form.is_visible ? { background: `${accent}25` } : { background: 'rgba(255,255,255,0.05)' }}
            >
              {form.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              {form.is_visible ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={addPost} disabled={!form.title.trim() || saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>
              {saving ? 'Posting...' : 'Post'}
            </button>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl text-sm text-white/50">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>
      ) : (
        <div className="px-4 space-y-3">
          {posts.length === 0 && <p className="text-white/30 text-sm text-center py-8">No posts yet</p>}
          {posts.map(post => (
            <div
              key={post.id}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {editing === post.id ? (
                <div className="p-3 space-y-2">
                  <input
                    value={editForm.title}
                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                  <textarea
                    value={editForm.body}
                    onChange={e => setEditForm(p => ({ ...p, body: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
                  />
                  <ImageUpload value={editForm.cover_url} onChange={url => setEditForm(p => ({ ...p, cover_url: url }))} creatorId={profile!.id} type="news_covers" />
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setEditForm(p => ({ ...p, allow_comments: !p.allow_comments }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${editForm.allow_comments ? 'text-white' : 'text-white/50'}`}
                      style={editForm.allow_comments ? { background: `${accent}25` } : { background: 'rgba(255,255,255,0.05)' }}
                    >
                      <MessageCircle size={14} /> Comments
                    </button>
                    <button
                      onClick={() => setEditForm(p => ({ ...p, is_visible: !p.is_visible }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${editForm.is_visible ? 'text-white' : 'text-white/50'}`}
                      style={editForm.is_visible ? { background: `${accent}25` } : { background: 'rgba(255,255,255,0.05)' }}
                    >
                      {editForm.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {editForm.is_visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(post.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95" style={{ background: accent, color: '#000' }}>
                      <Check size={12} />
                    </button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs text-white/40"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{post.title}</p>
                      <p className="text-white/40 text-xs line-clamp-2 mt-0.5">{post.body}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(post.id); setEditForm({ title: post.title, body: post.body, cover_url: post.cover_url, allow_comments: post.allow_comments, is_visible: post.is_visible }); }} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-white/50 transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => toggle(post.id, 'allow_comments', post.allow_comments)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${post.allow_comments ? 'text-white' : 'text-white/20'}`} style={post.allow_comments ? { background: `${accent}25` } : {}}>
                        <MessageCircle size={12} />
                      </button>
                      <button onClick={() => toggle(post.id, 'is_visible', post.is_visible)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${post.is_visible ? 'text-white' : 'text-white/20'}`} style={post.is_visible ? { background: `${accent}25` } : {}}>
                        {post.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button onClick={() => toggle(post.id, 'is_pinned', post.is_pinned)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${post.is_pinned ? 'text-white' : 'text-white/20'}`} style={post.is_pinned ? { background: `${accent}25` } : {}}>
                        <Pin size={12} />
                      </button>
                      <button onClick={() => toggle(post.id, 'is_featured', post.is_featured)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${post.is_featured ? 'text-yellow-400' : 'text-white/20'}`}>
                        <Star size={12} />
                      </button>
                      <button onClick={() => deletePost(post.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
