import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import {
  Music, MessageCircle, ShoppingBag, Play, Newspaper,
  Star, Circle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { Room, DEFAULT_ROOMS } from '../../types';

const ICON_MAP: Record<string, React.ElementType> = {
  Music, MessageCircle, ShoppingBag, Play, Newspaper, Star, Circle,
};

const ROOM_COLORS = [
  '#EC4899', '#06B6D4', '#22C55E', '#A855F7',
  '#F97316', '#EAB308', '#3B82F6', '#EF4444',
  '#10B981', '#F59E0B',
];

export function ManageRooms() {
  const { profile, rooms, refreshRooms } = usePlace();
  const [localRooms, setLocalRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSlug, setNewRoomSlug] = useState('');

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  async function seedDefaultRooms() {
    if (!profile || seeding) return;
    setSeeding(true);
    for (const r of DEFAULT_ROOMS) {
      await supabase.from('rooms').insert({ ...r, creator_id: profile.id });
    }
    setSeeding(false);
    await refreshRooms();
  }

  async function toggleRoom(id: string, enabled: boolean) {
    await supabase.from('rooms').update({ enabled: !enabled }).eq('id', id);
    setLocalRooms(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
    await refreshRooms();
  }

  async function moveRoom(id: string, direction: 'up' | 'down') {
    const idx = localRooms.findIndex(r => r.id === id);
    if (idx < 0) return;
    const newRooms = [...localRooms];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newRooms.length) return;
    [newRooms[idx], newRooms[swapIdx]] = [newRooms[swapIdx], newRooms[idx]];
    setLocalRooms(newRooms);

    setSaving(true);
    await Promise.all(newRooms.map((r, i) =>
      supabase.from('rooms').update({ sort_order: i }).eq('id', r.id)
    ));
    setSaving(false);
    await refreshRooms();
  }

  async function updateRoomName(id: string, name: string) {
    await supabase.from('rooms').update({ name }).eq('id', id);
    setLocalRooms(prev => prev.map(r => r.id === id ? { ...r, name } : r));
  }

  async function updateRoomColor(id: string, color: string) {
    await supabase.from('rooms').update({ color }).eq('id', id);
    setLocalRooms(prev => prev.map(r => r.id === id ? { ...r, color } : r));
    await refreshRooms();
  }

  async function addCustomRoom() {
    if (!profile || !newRoomName.trim()) return;
    const slug = newRoomSlug.trim() || newRoomName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await supabase.from('rooms').insert({
      creator_id: profile.id, slug, name: newRoomName.trim(),
      icon: 'Circle', color: accent, enabled: true, sort_order: localRooms.length, is_custom: true,
    });
    setAddOpen(false);
    setNewRoomName('');
    setNewRoomSlug('');
    await refreshRooms();
  }

  async function removeRoom(id: string) {
    await supabase.from('rooms').delete().eq('id', id);
    setLocalRooms(prev => prev.filter(r => r.id !== id));
    await refreshRooms();
  }

  if (localRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <p className="text-white/40 text-sm text-center mb-4">No rooms configured yet.</p>
        <button
          onClick={seedDefaultRooms}
          disabled={seeding}
          className="px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          style={{ background: accent, color: '#000' }}
        >
          {seeding ? 'Setting up...' : 'Set Up Default Rooms'}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-10 space-y-2">
      {/* Add Room button */}
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 mb-2"
        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
      >
        <Plus size={14} /> Add Room
      </button>

      {addOpen && (
        <div className="p-4 rounded-2xl space-y-3 mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <input
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            placeholder="Room name (e.g. Podcasts)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none"
          />
          <input
            value={newRoomSlug}
            onChange={e => setNewRoomSlug(e.target.value)}
            placeholder="Slug (e.g. podcasts) — auto-generated if empty"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 text-sm outline-none"
          />
          <div className="flex gap-2">
            <button onClick={addCustomRoom} disabled={!newRoomName.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: accent, color: '#000' }}>Add Room</button>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl text-sm text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
          <div className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" />
          Saving order...
        </div>
      )}
      {localRooms.map((room, idx) => {
        const IconComp = ICON_MAP[room.icon] ?? Circle;
        return (
          <div
            key={room.id}
            className="rounded-xl p-3 transition-all"
            style={{
              background: room.enabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${room.enabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              opacity: room.enabled ? 1 : 0.5,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${room.color}20` }}
              >
                <IconComp size={16} style={{ color: room.color }} />
              </div>

              <input
                value={room.name}
                onChange={e => setLocalRooms(prev => prev.map(r => r.id === room.id ? { ...r, name: e.target.value } : r))}
                onBlur={e => updateRoomName(room.id, e.target.value)}
                className="flex-1 bg-transparent text-white text-sm font-semibold outline-none min-w-0"
              />

              <div className="flex items-center gap-1">
                <button onClick={() => moveRoom(room.id, 'up')} disabled={idx === 0} className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveRoom(room.id, 'down')} disabled={idx === localRooms.length - 1} className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => toggleRoom(room.id, room.enabled)}
                  className="w-10 h-6 rounded-full transition-all relative"
                  style={{ background: room.enabled ? accent : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: room.enabled ? 'calc(100% - 22px)' : 2 }}
                  />
                </button>
                {room.is_custom && (
                  <button onClick={() => removeRoom(room.id)} className="w-7 h-7 flex items-center justify-center text-red-400/40 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Color swatches */}
            <div className="flex items-center gap-1.5 mt-2 pl-12">
              {ROOM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateRoomColor(room.id, c)}
                  className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                  style={{
                    background: c,
                    border: room.color === c ? '2px solid white' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
