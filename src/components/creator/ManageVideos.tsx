import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Pin, Film } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { Video } from '../../types';
import { Modal } from '../ui/Modal';

const VIDEO_TYPES = ['music_video', 'short', 'interview', 'behind_scenes', 'livestream_replay'] as const;
const TYPE_LABELS: Record<string, string> = {
  music_video: 'Music Video', short: 'Short', interview: 'Interview',
  behind_scenes: 'Behind the Scenes', livestream_replay: 'Livestream Replay',
};

export function ManageVideos() {
  const { profile } = usePlace();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', type: 'music_video' });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('videos').select('*').eq('creator_id', profile!.id).order('sort_order');
    setVideos(data ?? []);
    setLoading(false);
  }

  async function addVideo() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('videos').insert({
      creator_id: profile!.id,
      title: form.title.trim(),
      description: form.description.trim(),
      video_url: form.video_url.trim(),
      thumbnail_url: form.thumbnail_url.trim(),
      type: form.type,
      sort_order: videos.length,
    });
    setSaving(false);
    setAddOpen(false);
    setForm({ title: '', description: '', video_url: '', thumbnail_url: '', type: 'music_video' });
    load();
  }

  async function deleteVideo(id: string) {
    await supabase.from('videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  async function toggle(id: string, field: 'is_pinned' | 'is_featured', val: boolean) {
    await supabase.from('videos').update({ [field]: !val }).eq('id', id);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: !val } : v));
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-white/40 text-xs">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          <Plus size={12} /> Add Video
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>
      ) : (
        <div className="px-4 space-y-2">
          {videos.length === 0 && <p className="text-white/30 text-sm text-center py-8">No videos yet</p>}
          {videos.map(video => (
            <div
              key={video.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${accent}15` }}>
                {video.thumbnail_url
                  ? <img src={video.thumbnail_url} className="w-full h-full object-cover" alt={video.title} />
                  : <div className="w-full h-full flex items-center justify-center"><Film size={14} className="text-white/30" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{video.title}</p>
                <p className="text-white/40 text-xs">{TYPE_LABELS[video.type]}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(video.id, 'is_pinned', video.is_pinned)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${video.is_pinned ? 'text-white' : 'text-white/20'}`} style={video.is_pinned ? { background: `${accent}25` } : {}}>
                  <Pin size={12} />
                </button>
                <button onClick={() => toggle(video.id, 'is_featured', video.is_featured)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${video.is_featured ? 'text-yellow-400' : 'text-white/20'}`}>
                  <Star size={12} />
                </button>
                <button onClick={() => deleteVideo(video.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Video">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Video title...' },
            { key: 'video_url', label: 'Video URL', placeholder: 'https://...', type: 'url' },
            { key: 'thumbnail_url', label: 'Thumbnail URL', placeholder: 'https://...', type: 'url' },
            { key: 'description', label: 'Description', placeholder: 'About this video...' },
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
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/25"
            >
              {VIDEO_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <button
            onClick={addVideo}
            disabled={!form.title.trim() || saving}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: accent, color: '#000' }}
          >
            {saving ? 'Adding...' : 'Add Video'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
