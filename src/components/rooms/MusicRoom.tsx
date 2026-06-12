import { useEffect, useState } from 'react';
import { Play, Pause, Music, Pin, Star, Disc, Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { useAudio } from '../../contexts/AudioContext';
import { MusicTrack, MusicAlbum, formatDuration, ViewName } from '../../types';
import { Modal } from '../ui/Modal';
import { Reactions } from '../ui/Reactions';
import { CommentsSection } from '../ui/CommentsSection';
import { AudioUpload } from '../ui/AudioUpload';
import { ImageUpload } from '../ui/ImageUpload';

interface MusicRoomProps {
  onNavigate?: (view: ViewName) => void;
}

export function MusicRoom({ onNavigate }: MusicRoomProps) {
  const { profile, isCreator } = usePlace();
  const { play, currentTrack, isPlaying, togglePlay } = useAudio();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MusicAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackForm, setTrackForm] = useState({ title: '', artist: '', audio_url: '', cover_url: '', album_id: '' });
  const [trackDuration, setTrackDuration] = useState<number>(0);
  const [albumForm, setAlbumForm] = useState({ title: '', type: 'album', cover_url: '', release_year: '', description: '' });

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile?.id]);

  async function load() {
    setLoading(true);
    let tracksQuery = supabase.from('music_tracks').select('*').eq('creator_id', profile!.id);
    if (!isCreator) tracksQuery = tracksQuery.eq('is_visible', true);

    let albumsQuery = supabase.from('music_albums').select('*').eq('creator_id', profile!.id);
    if (!isCreator) albumsQuery = albumsQuery.eq('is_visible', true);

    const [{ data: t }, { data: a }] = await Promise.all([
      tracksQuery.order('is_pinned', { ascending: false }).order('sort_order'),
      albumsQuery.order('is_pinned', { ascending: false }).order('sort_order'),
    ]);
    setTracks(t ?? []);
    setAlbums(a ?? []);
    setLoading(false);
  }

  async function loadAlbumTracks(album: MusicAlbum) {
    let query = supabase.from('music_tracks').select('*').eq('creator_id', profile!.id).eq('album_id', album.id);
    if (!isCreator) query = query.eq('is_visible', true);
    const { data } = await query.order('track_number');
    setSelectedAlbum({ ...album, tracks: data ?? [] });
  }

  function playTrack(track: MusicTrack, list: MusicTrack[]) {
    if (currentTrack?.id === track.id) { togglePlay(); } else { play(track, list); }
  }

  async function addTrack() {
    if (!trackForm.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('music_tracks').insert({
      creator_id: profile!.id, title: trackForm.title.trim(), artist: trackForm.artist.trim(),
      audio_url: trackForm.audio_url.trim(), cover_url: trackForm.cover_url.trim(),
      album_id: trackForm.album_id || null, duration_secs: trackDuration || 0,
      sort_order: tracks.length, is_visible: true, allow_comments: true,
    });
    setSaving(false);
    setAddTrackOpen(false);
    setTrackForm({ title: '', artist: '', audio_url: '', cover_url: '', album_id: '' });
    setTrackDuration(0);
    load();
  }

  async function addAlbum() {
    if (!albumForm.title.trim() || saving) return;
    setSaving(true);
    await supabase.from('music_albums').insert({
      creator_id: profile!.id, title: albumForm.title.trim(), type: albumForm.type,
      cover_url: albumForm.cover_url.trim(), release_year: parseInt(albumForm.release_year) || null,
      description: albumForm.description.trim(), sort_order: albums.length,
    });
    setSaving(false);
    setAddAlbumOpen(false);
    setAlbumForm({ title: '', type: 'album', cover_url: '', release_year: '', description: '' });
    load();
  }

  async function toggleTrackProp(id: string, field: 'is_pinned' | 'is_featured' | 'is_visible' | 'allow_comments', val: boolean) {
    await supabase.from('music_tracks').update({ [field]: !val }).eq('id', id);
    setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: !val } : t));
  }

  async function deleteTrack(id: string) {
    await supabase.from('music_tracks').delete().eq('id', id);
    setTracks(prev => prev.filter(t => t.id !== id));
  }

  async function toggleAlbumProp(id: string, field: 'is_pinned' | 'is_featured', val: boolean) {
    await supabase.from('music_albums').update({ [field]: !val }).eq('id', id);
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, [field]: !val } : a));
  }

  async function deleteAlbum(id: string) {
    await supabase.from('music_albums').delete().eq('id', id);
    setAlbums(prev => prev.filter(a => a.id !== id));
  }

  const singles = tracks.filter(t => !t.album_id);
  const displayTracks = selectedAlbum ? (selectedAlbum.tracks ?? []) : singles;
  const featuredTracks = tracks.filter(t => t.is_featured);
  const albumTypes = { album: albums.filter(a => a.type === 'album'), mixtape: albums.filter(a => a.type === 'mixtape'), playlist: albums.filter(a => a.type === 'playlist'), collection: albums.filter(a => a.type === 'collection') };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;
  }

  const isEmpty = tracks.length === 0 && albums.length === 0;

  return (
    <div className="pb-28">
      {/* Creator controls */}
      {isCreator && (
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
          <button onClick={() => onNavigate?.('creator:music')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}>
            <Music size={11} /> Manage Music
          </button>
          <button onClick={() => setAddTrackOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}>
            <Plus size={11} /> Add Track
          </button>
          <button onClick={() => setAddAlbumOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95" style={{ background: `${accent}15`, color: accent }}>
            <Plus size={11} /> Add Album
          </button>
        </div>
      )}

      {/* Featured Music Bin */}
      {featuredTracks.length > 0 && !selectedAlbum && (
        <Bin label="Featured Music" icon={Star} accent={accent}>
          {featuredTracks.map(track => (
            <TrackRow key={track.id} track={track} accent={accent} currentTrack={currentTrack} isPlaying={isPlaying}
              onPlay={() => playTrack(track, tracks)} isCreator={isCreator}
              onTogglePin={() => toggleTrackProp(track.id, 'is_pinned', track.is_pinned)}
              onToggleFeature={() => toggleTrackProp(track.id, 'is_featured', track.is_featured)}
              onToggleVisibility={() => toggleTrackProp(track.id, 'is_visible', track.is_visible)}
              onToggleComments={() => toggleTrackProp(track.id, 'allow_comments', track.allow_comments)}
              onDelete={() => deleteTrack(track.id)} />
          ))}
        </Bin>
      )}

      {/* Pinned Singles Bin */}
      {singles.filter(t => t.is_pinned).length > 0 && !selectedAlbum && (
        <Bin label="Pinned Singles" icon={Pin} accent={accent}>
          {singles.filter(t => t.is_pinned).map(track => (
            <TrackRow key={track.id} track={track} accent={accent} currentTrack={currentTrack} isPlaying={isPlaying}
              onPlay={() => playTrack(track, tracks)} isCreator={isCreator}
              onTogglePin={() => toggleTrackProp(track.id, 'is_pinned', track.is_pinned)}
              onToggleFeature={() => toggleTrackProp(track.id, 'is_featured', track.is_featured)}
              onToggleVisibility={() => toggleTrackProp(track.id, 'is_visible', track.is_visible)}
              onToggleComments={() => toggleTrackProp(track.id, 'allow_comments', track.allow_comments)}
              onDelete={() => deleteTrack(track.id)} />
          ))}
        </Bin>
      )}

      {/* Singles Bin */}
      {singles.length > 0 && !selectedAlbum && (
        <Bin label="Singles" icon={Music} accent={accent}>
          {singles.map(track => (
            <TrackRow key={track.id} track={track} accent={accent} currentTrack={currentTrack} isPlaying={isPlaying}
              onPlay={() => playTrack(track, tracks)} isCreator={isCreator}
              onTogglePin={() => toggleTrackProp(track.id, 'is_pinned', track.is_pinned)}
              onToggleFeature={() => toggleTrackProp(track.id, 'is_featured', track.is_featured)}
              onToggleVisibility={() => toggleTrackProp(track.id, 'is_visible', track.is_visible)}
              onToggleComments={() => toggleTrackProp(track.id, 'allow_comments', track.allow_comments)}
              onDelete={() => deleteTrack(track.id)} />
          ))}
        </Bin>
      )}

      {/* Album bins by type */}
      {!selectedAlbum && Object.entries(albumTypes).map(([type, list]) => list.length > 0 ? (
        <Bin key={type} label={type === 'album' ? 'Albums' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`} icon={Disc} accent={accent}>
          <div className="grid grid-cols-2 gap-3">
            {list.map(album => (
              <div key={album.id} className="relative">
                <button onClick={() => loadAlbumTracks(album)} className="w-full text-left rounded-2xl overflow-hidden group active:scale-95 transition-transform" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {album.cover_url ? <img src={album.cover_url} alt={album.title} className="w-full aspect-square object-cover" />
                    : <div className="w-full aspect-square flex items-center justify-center" style={{ background: `${accent}18` }}><Disc size={36} style={{ color: accent }} /></div>}
                  <div className="p-2.5">
                    {album.is_pinned && <Pin size={10} className="text-white/30 mb-1" />}
                    <p className="text-white font-semibold text-sm truncate">{album.title}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide">{album.type}</p>
                  </div>
                </button>
                {isCreator && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => toggleAlbumProp(album.id, 'is_pinned', album.is_pinned)} className={`w-6 h-6 rounded-full flex items-center justify-center ${album.is_pinned ? 'text-white' : 'text-white/30'}`} style={album.is_pinned ? { background: `${accent}40` } : { background: 'rgba(0,0,0,0.5)' }}>
                      <Pin size={10} />
                    </button>
                    <button onClick={() => deleteAlbum(album.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <Upload size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Bin>
      ) : null)}

      {/* Album detail view */}
      {selectedAlbum && (
        <div className="px-4 pb-4">
          <button onClick={() => setSelectedAlbum(null)} className="text-xs text-white/40 mb-3 flex items-center gap-1">← Back</button>
          <div className="flex items-center gap-4">
            {selectedAlbum.cover_url ? <img src={selectedAlbum.cover_url} alt={selectedAlbum.title} className="w-20 h-20 rounded-xl object-cover" />
              : <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}><Disc size={28} style={{ color: accent }} /></div>}
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>{selectedAlbum.type}</p>
              <h3 className="text-white font-bold text-lg">{selectedAlbum.title}</h3>
              {selectedAlbum.release_year && <p className="text-white/40 text-xs">{selectedAlbum.release_year}</p>}
              <button onClick={() => { const t = selectedAlbum.tracks?.[0]; if (t) playTrack(t, selectedAlbum.tracks ?? []); }} className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5" style={{ background: accent, color: '#000' }}>
                <Play size={12} fill="black" /> Play All
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {(selectedAlbum.tracks ?? []).map(track => (
              <TrackRow key={track.id} track={track} accent={accent} currentTrack={currentTrack} isPlaying={isPlaying}
                onPlay={() => playTrack(track, selectedAlbum.tracks ?? [])} isCreator={isCreator}
                onTogglePin={() => toggleTrackProp(track.id, 'is_pinned', track.is_pinned)}
                onToggleFeature={() => toggleTrackProp(track.id, 'is_featured', track.is_featured)}
                onToggleVisibility={() => toggleTrackProp(track.id, 'is_visible', track.is_visible)}
                onToggleComments={() => toggleTrackProp(track.id, 'allow_comments', track.allow_comments)}
                onDelete={() => deleteTrack(track.id)} />
            ))}
            {(selectedAlbum.tracks ?? []).length === 0 && <p className="text-white/30 text-sm text-center py-6">No tracks in this album</p>}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}>
            <Music size={24} style={{ color: accent }} />
          </div>
          <h3 className="text-white font-semibold text-base mb-1">No Music Yet</h3>
          <p className="text-white/30 text-sm text-center mb-4">Tracks and albums will appear here.</p>
          {isCreator && (
            <div className="flex gap-2">
              <button onClick={() => setAddTrackOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: accent, color: '#000' }}>
                <Plus size={12} /> Add Track
              </button>
              <button onClick={() => setAddAlbumOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                <Plus size={12} /> Add Album
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Track Modal */}
      <Modal isOpen={addTrackOpen} onClose={() => setAddTrackOpen(false)} title="Add Track">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Track title...' },
            { key: 'artist', label: 'Artist', placeholder: 'Artist name...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input type={f.type ?? 'text'} value={(trackForm as any)[f.key]} onChange={e => setTrackForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Audio File</label>
            <AudioUpload onChange={(url, duration) => {
              setTrackForm(p => ({ ...p, audio_url: url }));
              setTrackDuration(duration || 0);
            }} />
          </div>
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Cover Art</label>
            <ImageUpload onChange={(url) => setTrackForm(p => ({ ...p, cover_url: url }))} />
          </div>
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Album (optional)</label>
            <select value={trackForm.album_id} onChange={e => setTrackForm(p => ({ ...p, album_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              <option value="">No album</option>
              {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <button onClick={addTrack} disabled={!trackForm.title.trim() || saving} className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50" style={{ background: accent, color: '#000' }}>
            {saving ? 'Adding...' : 'Add Track'}
          </button>
        </div>
      </Modal>

      {/* Add Album Modal */}
      <Modal isOpen={addAlbumOpen} onClose={() => setAddAlbumOpen(false)} title="Add Album">
        <div className="p-4 space-y-3">
          {[
            { key: 'title', label: 'Title *', placeholder: 'Album title...' },
            { key: 'release_year', label: 'Release Year', placeholder: '2024', type: 'number' },
            { key: 'description', label: 'Description', placeholder: 'About this album...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
              <input type={f.type ?? 'text'} value={(albumForm as any)[f.key]} onChange={e => setAlbumForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none focus:border-white/25" />
            </div>
          ))}
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Cover Art</label>
            <ImageUpload onChange={(url) => setAlbumForm(p => ({ ...p, cover_url: url }))} />
          </div>
          <div>
            <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</label>
            <select value={albumForm.type} onChange={e => setAlbumForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              {['album', 'mixtape', 'playlist', 'collection'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={addAlbum} disabled={!albumForm.title.trim() || saving} className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all" style={{ background: accent, color: '#000' }}>
            {saving ? 'Adding...' : 'Add Album'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Bin({ label, icon: Icon, accent, children }: { label: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon size={12} style={{ color: accent }} />
        </div>
        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>{label}</p>
      </div>
      {children}
    </div>
  );
}

function TrackRow({ track, accent, currentTrack, isPlaying, onPlay, isCreator, onTogglePin, onToggleFeature, onToggleVisibility, onToggleComments, onDelete }: {
  track: MusicTrack; accent: string; currentTrack: MusicTrack | null; isPlaying: boolean; onPlay: () => void;
  isCreator: boolean; onTogglePin: () => void; onToggleFeature: () => void; onToggleVisibility?: () => void; onToggleComments?: () => void; onDelete: () => void;
}) {
  const active = currentTrack?.id === track.id;
  return (
    <div>
      <div className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: active ? `${accent}18` : 'rgba(255,255,255,0.03)', border: active ? `1px solid ${accent}40` : '1px solid transparent' }}>
        <button onClick={onPlay} className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
          {track.cover_url ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: `${accent}20` }}><Music size={16} style={{ color: accent }} /></div>}
          {active && <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${accent}80` }}>
            {isPlaying ? <Pause size={14} className="text-white" fill="white" /> : <Play size={14} className="text-white" fill="white" style={{ marginLeft: 1 }} />}
          </div>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${active ? 'text-white' : 'text-white/90'}`}>
            {track.is_pinned && <Pin size={10} className="inline mr-1 text-white/40" />}
            {track.title}
          </p>
          <p className="text-white/40 text-xs truncate">{track.artist}</p>
        </div>
        {track.is_featured && <Star size={12} style={{ color: accent }} />}
        {track.duration_secs > 0 && <span className="text-white/30 text-xs flex-shrink-0">{formatDuration(track.duration_secs)}</span>}
        {isCreator && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={onTogglePin} className={`w-6 h-6 rounded-full flex items-center justify-center ${track.is_pinned ? 'text-white' : 'text-white/20'}`} style={track.is_pinned ? { background: `${accent}30` } : {}}>
              <Pin size={10} />
            </button>
            <button onClick={onToggleFeature} className={`w-6 h-6 rounded-full flex items-center justify-center ${track.is_featured ? 'text-yellow-400' : 'text-white/20'}`}>
              <Star size={10} />
            </button>
            <button onClick={onDelete} className="w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
              <Upload size={10} />
            </button>
          </div>
        )}
      </div>
      {active && (
        <div className="px-3 py-2 space-y-3">
          <Reactions itemId={track.id} itemType="music_track" accent={accent} />
          {track.allow_comments && <CommentsSection itemId={track.id} itemType="music_track" accent={accent} />}
        </div>
      )}
    </div>
  );
}
