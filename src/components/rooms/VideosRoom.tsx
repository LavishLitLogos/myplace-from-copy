import { useEffect, useState } from 'react';
import { Play, X, Star, Film, Pin, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { Video, ViewName } from '../../types';
import { Modal } from '../ui/Modal';
import { ImageUpload } from '../ui/ImageUpload';

const TYPE_LABELS: Record<string, string> = {
  music_video: 'Music Videos', short: 'Shorts / Reels', interview: 'Interviews',
  behind_scenes: 'Behind the Scenes', livestream_replay: 'Livestream Replays',
};
const TYPE_SINGULAR: Record<string, string> = {
  music_video: 'Music Video', short: 'Short', interview: 'Interview',
  behind_scenes: 'Behind the Scenes', livestream_replay: 'Livestream Replay',
};

interface VideosRoomProps {
  onNavigate?: (view: ViewName) => void;
}

export function VideosRoom({ onNavigate }: VideosRoomProps) {
  const { profile, isCreator } = usePlace();
  const [videos, setVideos] = useState<Video[]>([]);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', type: 'music_video', is_visible: true });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => { if (!profile) return; load(); }, [profile?.id]);

  async function load() {
    setLoading(true);
    let query = supabase.from('videos').select('*').eq('creator_id', profile!.id);
    if (!isCreator) query = query.eq('is_visible', true);
    const { data } = await query.order('is_pinned', { ascending: false }).order('sort_order');
    setVideos(data ?? []);
    setLoading(false);
  }

  async function addVideo() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('videos').insert({
      creator_id: profile!.id, title: form.title.trim(), description: form.description.trim(),
      video_url: form.video_url.trim(), thumbnail_url: form.thumbnail_url.trim(), type: form.type, sort_order: videos.length, is_visible: true,
    });
    setSaving(false); setAddOpen(false); setForm({ title: '', description: '', video_url: '', thumbnail_url: '', type: 'music_video', is_visible: true }); load();
  }

  async function toggle(id: string, field: 'is_pinned' | 'is_featured' | 'is_visible', val: boolean) {
    await supabase.from('videos').update({ [field]: !val }).eq('id', id);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: !val } : v));
  }

  async function deleteVideo(id: string) {
    await supabase.from('videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  const featuredVideos = videos.filter(v => v.is_featured);
  const videosByType = Object.entries(TYPE_LABELS).map(([type, label]) => ({
    type, label, items: videos.filter(v => v.type === type && !v.is_featured),
  })).filter(g => g.items.length > 0);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;

  return (
    <>
      <div className="pb-28">
        {isCreator && (
          <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
            <button onClick={() => onNavigate?.('creator:videos')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}><Film size={11} /> Manage Videos</button>
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}><Plus size={11} /> Add Video</button>
          </div>
        )}

        {featuredVideos.length > 0 && (
          <Bin label="Featured Videos" icon={Star} accent={accent}>
            {featuredVideos.map(video => (
              <div key={video.id} className="relative mb-2">
                <button onClick={() => setPlaying(video)} className="w-full relative rounded-2xl overflow-hidden group active:scale-95 transition-transform" style={{ background: `${accent}10`, border: `1px solid ${accent}30` }}>
                  {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-48 object-cover" /> : <div className="w-full h-48" style={{ background: `${accent}18` }} />}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${accent}cc` }}><Play size={20} className="text-white" fill="white" style={{ marginLeft: 2 }} /></div></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                    <p className="text-white font-bold text-sm leading-tight">{video.title}</p>
                    <p className="text-white/50 text-xs">{TYPE_SINGULAR[video.type]}</p>
                  </div>
                </button>
                {isCreator && <CreatorInline accent={accent} onPin={() => toggle(video.id, 'is_pinned', video.is_pinned)} onFeature={() => toggle(video.id, 'is_featured', video.is_featured)} onVisibility={() => toggle(video.id, 'is_visible', video.is_visible)} onDelete={() => deleteVideo(video.id)} isPinned={video.is_pinned} isFeatured={video.is_featured} isVisible={video.is_visible} />}
              </div>
            ))}
          </Bin>
        )}

        {videosByType.map(({ type, label, items }) => (
          <Bin key={type} label={label} icon={Film} accent={accent}>
            <div className="space-y-2">
              {items.map(video => (
                <div key={video.id} className="relative">
                  <button onClick={() => setPlaying(video)} className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all active:scale-98 group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: `${accent}15` }}><Film size={18} className="text-white/30" /></div>}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}><Play size={14} className="text-white" fill="white" /></div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white text-sm font-medium truncate">{video.title}</p>
                      <p className="text-white/40 text-xs">{TYPE_SINGULAR[video.type]}</p>
                    </div>
                    {video.is_pinned && <Pin size={10} className="text-white/30 flex-shrink-0" />}
                  </button>
                  {isCreator && <CreatorInlineSmall accent={accent} onPin={() => toggle(video.id, 'is_pinned', video.is_pinned)} onFeature={() => toggle(video.id, 'is_featured', video.is_featured)} onVisibility={() => toggle(video.id, 'is_visible', video.is_visible)} onDelete={() => deleteVideo(video.id)} isPinned={video.is_pinned} isFeatured={video.is_featured} isVisible={video.is_visible} />}
                </div>
              ))}
            </div>
          </Bin>
        ))}

        {videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}><Film size={24} style={{ color: accent }} /></div>
            <h3 className="text-white font-semibold text-base mb-1">No Videos Yet</h3>
            <p className="text-white/30 text-sm text-center mb-4">Videos will appear here.</p>
            {isCreator && <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: accent, color: '#000' }}><Plus size={12} /> Add Video</button>}
          </div>
        )}
      </div>

      {playing && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0">
            <button onClick={() => setPlaying(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10"><X size={18} className="text-white" /></button>
            <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{playing.title}</p><p className="text-white/40 text-xs">{TYPE_SINGULAR[playing.type]}</p></div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-black">
            {playing.video_url ? <video src={playing.video_url} controls autoPlay className="w-full max-h-full" playsInline /> : <div className="text-white/30 text-sm">No video source</div>}
          </div>
          {playing.description && <div className="px-4 py-3 flex-shrink-0"><p className="text-white/50 text-sm">{playing.description}</p></div>}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Video">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Video title...' },
            { key: 'video_url', label: 'Video URL', placeholder: 'https://...', type: 'url' },
            { key: 'description', label: 'Description', placeholder: 'About this video...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input type={f.type ?? 'text'} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
            </div>
          ))}
          <ImageUpload value={form.thumbnail_url} onChange={url => setForm(p => ({ ...p, thumbnail_url: url }))} label="Thumbnail" creatorId={profile!.id} />
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              {Object.entries(TYPE_SINGULAR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5">
            <input type="checkbox" id="is_visible" checked={(form as any).is_visible ?? true} onChange={e => setForm(p => ({ ...p, is_visible: e.target.checked }))} className="rounded" />
            <label htmlFor="is_visible" className="text-white/60 text-sm flex-1">Make video visible to viewers</label>
          </div>
          <button onClick={addVideo} disabled={!form.title.trim() || saving} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>{saving ? 'Adding...' : 'Add Video'}</button>
        </div>
      </Modal>
    </>
  );
}

function Bin({ label, icon: Icon, accent, children }: { label: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (<div className="px-4 py-2"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}><Icon size={12} style={{ color: accent }} /></div><p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{label}</p></div>{children}</div>);
}

function CreatorInline({ accent, onPin, onFeature, onVisibility, onDelete, isPinned, isFeatured, isVisible }: { accent: string; onPin: () => void; onFeature: () => void; onVisibility: () => void; onDelete: () => void; isPinned: boolean; isFeatured: boolean; isVisible: boolean }) {
  return (<div className="absolute top-2 right-2 flex gap-1"><button onClick={onPin} className={`w-6 h-6 rounded-full flex items-center justify-center ${isPinned ? 'text-white' : 'text-white/30'}`} style={isPinned ? { background: `${accent}40` } : { background: 'rgba(0,0,0,0.5)' }}><Pin size={10} /></button><button onClick={onFeature} className={`w-6 h-6 rounded-full flex items-center justify-center ${isFeatured ? 'text-yellow-400' : 'text-white/30'}`} style={{ background: 'rgba(0,0,0,0.5)' }}><Star size={10} /></button><button onClick={onVisibility} className={`w-6 h-6 rounded-full flex items-center justify-center ${isVisible ? 'text-white' : 'text-white/30'}`} style={{ background: 'rgba(0,0,0,0.5)' }}>{isVisible ? <Eye size={10} /> : <EyeOff size={10} />}</button><button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400" style={{ background: 'rgba(0,0,0,0.5)' }}><Trash2 size={10} /></button></div>);
}

function CreatorInlineSmall({ accent, onPin, onFeature, onVisibility, onDelete, isPinned, isFeatured, isVisible }: { accent: string; onPin: () => void; onFeature: () => void; onVisibility: () => void; onDelete: () => void; isPinned: boolean; isFeatured: boolean; isVisible: boolean }) {
  return (<div className="absolute top-1 right-1 flex gap-0.5"><button onClick={onPin} className={`w-5 h-5 rounded-full flex items-center justify-center ${isPinned ? 'text-white' : 'text-white/20'}`} style={isPinned ? { background: `${accent}40` } : {}}><Pin size={8} /></button><button onClick={onFeature} className={`w-5 h-5 rounded-full flex items-center justify-center ${isFeatured ? 'text-yellow-400' : 'text-white/20'}`}><Star size={8} /></button><button onClick={onVisibility} className={`w-5 h-5 rounded-full flex items-center justify-center ${isVisible ? 'text-white' : 'text-white/20'}`}>{isVisible ? <Eye size={8} /> : <EyeOff size={8} />}</button><button onClick={onDelete} className="w-5 h-5 rounded-full flex items-center justify-center text-red-400/40 hover:text-red-400"><Trash2 size={8} /></button></div>);
}
