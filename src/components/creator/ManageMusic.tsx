import { useEffect, useState } from 'react';
import { Plus, Trash2, Music, Pin, Star, Disc } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { MusicTrack, MusicAlbum } from '../../types';
import { Modal } from '../ui/Modal';

export function ManageMusic() {
  const { profile } = usePlace();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);
  const [tab, setTab] = useState<'tracks' | 'albums'>('tracks');
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const accent = profile?.accent_color ?? '#EC4899';

  const [trackForm, setTrackForm] = useState({ title: '', artist: '', audio_url: '', cover_url: '', album_id: '', duration_secs: '' });
  const [albumForm, setAlbumForm] = useState({ title: '', type: 'album', cover_url: '', release_year: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from('music_tracks').select('*').eq('creator_id', profile!.id).order('sort_order'),
      supabase.from('music_albums').select('*').eq('creator_id', profile!.id).order('sort_order'),
    ]);
    setTracks(t ?? []);
    setAlbums(a ?? []);
    setLoading(false);
  }

  async function addTrack() {
    if (!trackForm.title.trim() || saving) return;
    setSaving(true);
    const { error } = await supabase.from('music_tracks').insert({
      creator_id: profile!.id,
      title: trackForm.title.trim(),
      artist: trackForm.artist.trim(),
      audio_url: trackForm.audio_url.trim(),
      cover_url: trackForm.cover_url.trim(),
      album_id: trackForm.album_id || null,
      duration_secs: parseInt(trackForm.duration_secs) || 0,
      sort_order: tracks.length,
    });
    setSaving(false);
    if (!error) {
      setAddTrackOpen(false);
      setTrackForm({ title: '', artist: '', audio_url: '', cover_url: '', album_id: '', duration_secs: '' });
      load();
    }
  }

  async function addAlbum() {
    if (!albumForm.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('music_albums').insert({
      creator_id: profile!.id,
      title: albumForm.title.trim(),
      type: albumForm.type,
      cover_url: albumForm.cover_url.trim(),
      release_year: parseInt(albumForm.release_year) || null,
      description: albumForm.description.trim(),
      sort_order: albums.length,
    });
    setSaving(false);
    setAddAlbumOpen(false);
    setAlbumForm({ title: '', type: 'album', cover_url: '', release_year: '', description: '' });
    load();
  }

  async function deleteTrack(id: string) {
    await supabase.from('music_tracks').delete().eq('id', id);
    setTracks(prev => prev.filter(t => t.id !== id));
  }

  async function deleteAlbum(id: string) {
    await supabase.from('music_albums').delete().eq('id', id);
    setAlbums(prev => prev.filter(a => a.id !== id));
  }

  async function togglePin(id: string, pinned: boolean, table: 'music_tracks' | 'music_albums') {
    await supabase.from(table).update({ is_pinned: !pinned }).eq('id', id);
    if (table === 'music_tracks') setTracks(prev => prev.map(t => t.id === id ? { ...t, is_pinned: !pinned } : t));
    else setAlbums(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !pinned } : a));
  }

  async function toggleFeature(id: string, featured: boolean, table: 'music_tracks' | 'music_albums') {
    await supabase.from(table).update({ is_featured: !featured }).eq('id', id);
    if (table === 'music_tracks') setTracks(prev => prev.map(t => t.id === id ? { ...t, is_featured: !featured } : t));
    else setAlbums(prev => prev.map(a => a.id === id ? { ...a, is_featured: !featured } : a));
  }

  return (
    <div className="pb-10">
      <div className="flex gap-1 px-4 py-3">
        {(['tracks', 'albums'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={tab === t ? { background: accent, color: '#000' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            {t === 'tracks' ? 'Tracks' : 'Albums'}
          </button>
        ))}
        <button
          onClick={() => tab === 'tracks' ? setAddTrackOpen(true) : setAddAlbumOpen(true)}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : tab === 'tracks' ? (
        <div className="px-4 space-y-2">
          {tracks.length === 0 && <p className="text-white/30 text-sm text-center py-8">No tracks yet</p>}
          {tracks.map(track => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${accent}15` }}>
                {track.cover_url ? <img src={track.cover_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music size={14} style={{ color: accent }} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{track.title}</p>
                <p className="text-white/40 text-xs truncate">{track.artist}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePin(track.id, track.is_pinned, 'music_tracks')} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${track.is_pinned ? 'text-white' : 'text-white/20 hover:text-white/40'}`} style={track.is_pinned ? { background: `${accent}30` } : {}}>
                  <Pin size={12} />
                </button>
                <button onClick={() => toggleFeature(track.id, track.is_featured, 'music_tracks')} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${track.is_featured ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>
                  <Star size={12} />
                </button>
                <button onClick={() => deleteTrack(track.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {albums.length === 0 && <p className="text-white/30 text-sm text-center py-8">No albums yet</p>}
          {albums.map(album => (
            <div
              key={album.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${accent}15` }}>
                {album.cover_url ? <img src={album.cover_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Disc size={14} style={{ color: accent }} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{album.title}</p>
                <p className="text-white/40 text-xs capitalize">{album.type}{album.release_year ? ` · ${album.release_year}` : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePin(album.id, album.is_pinned, 'music_albums')} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${album.is_pinned ? 'text-white' : 'text-white/20 hover:text-white/40'}`} style={album.is_pinned ? { background: `${accent}30` } : {}}>
                  <Pin size={12} />
                </button>
                <button onClick={() => toggleFeature(album.id, album.is_featured, 'music_albums')} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${album.is_featured ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>
                  <Star size={12} />
                </button>
                <button onClick={() => deleteAlbum(album.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Track Modal */}
      <Modal isOpen={addTrackOpen} onClose={() => setAddTrackOpen(false)} title="Add Track">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Track title...' },
            { key: 'artist', label: 'Artist', placeholder: 'Artist name...' },
            { key: 'audio_url', label: 'Audio URL', placeholder: 'https://...', type: 'url' },
            { key: 'cover_url', label: 'Cover Art URL', placeholder: 'https://...', type: 'url' },
            { key: 'duration_secs', label: 'Duration (seconds)', placeholder: '180', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={(trackForm as any)[f.key]}
                onChange={e => setTrackForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25"
              />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Album (optional)</label>
            <select
              value={trackForm.album_id}
              onChange={e => setTrackForm(p => ({ ...p, album_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/25"
            >
              <option value="">No album</option>
              {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <button
            onClick={addTrack}
            disabled={!trackForm.title.trim() || saving}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: accent, color: '#000' }}
          >
            {saving ? 'Adding...' : 'Add Track'}
          </button>
        </div>
      </Modal>

      {/* Add Album Modal */}
      <Modal isOpen={addAlbumOpen} onClose={() => setAddAlbumOpen(false)} title="Add Album">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Album title...' },
            { key: 'cover_url', label: 'Cover Art URL', placeholder: 'https://...', type: 'url' },
            { key: 'release_year', label: 'Release Year', placeholder: '2024', type: 'number' },
            { key: 'description', label: 'Description', placeholder: 'About this album...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={(albumForm as any)[f.key]}
                onChange={e => setAlbumForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25"
              />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</label>
            <select
              value={albumForm.type}
              onChange={e => setAlbumForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/25"
            >
              {['album', 'mixtape', 'playlist', 'collection'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <button
            onClick={addAlbum}
            disabled={!albumForm.title.trim() || saving}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: accent, color: '#000' }}
          >
            {saving ? 'Adding...' : 'Add Album'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
