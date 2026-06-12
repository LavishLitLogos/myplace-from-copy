import { useEffect, useState, useCallback } from 'react';
import { Zap, Lock, Sparkles, ExternalLink, Music, ShoppingBag, Star, Film } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePlace } from '../../contexts/PlaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { ViewName } from '../../types';

interface DropItem {
  id: string;
  type: 'merch' | 'exclusive' | 'music';
  title: string;
  subtitle: string;
  cover_url: string;
  link_view: ViewName;
}

interface DailyDropRoomProps {
  onNavigate?: (view: ViewName) => void;
}

const MIN_ITEMS = 15;

export function DailyDropRoom({ onNavigate }: DailyDropRoomProps) {
  const { profile, isCreator } = usePlace();
  const { user } = useAuth();
  const [eligibleItems, setEligibleItems] = useState<DropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canDrop, setCanDrop] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [droppedItem, setDroppedItem] = useState<DropItem | null>(null);
  const [usedToday, setUsedToday] = useState(false);

  const accent = profile?.accent_color ?? '#3B82F6';

  useEffect(() => {
    if (!profile) return;
    loadEligible();
    checkDropUsage();
  }, [profile?.id]);

  async function loadEligible() {
    setLoading(true);
    const items: DropItem[] = [];

    const [{ data: merch }, { data: exclusives }, { data: tracks }] = await Promise.all([
      supabase.from('merch_products').select('id, name, image_url, button_url').eq('creator_id', profile!.id).eq('is_visible', true).eq('eligible_daily_drop', true),
      supabase.from('exclusives').select('id, title, cover_url, file_url, file_type').eq('creator_id', profile!.id).eq('is_visible', true).eq('eligible_daily_drop', true),
      supabase.from('music_tracks').select('id, title, artist, cover_url, audio_url').eq('creator_id', profile!.id).eq('is_visible', true).eq('is_featured', true),
    ]);

    for (const m of merch ?? []) {
      items.push({ id: m.id, type: 'merch', title: m.name, subtitle: 'Merch Drop', cover_url: m.image_url ?? '', link_view: 'room:merch' });
    }
    for (const e of exclusives ?? []) {
      items.push({ id: e.id, type: 'exclusive', title: e.title, subtitle: e.file_type ?? 'Exclusive', cover_url: e.cover_url ?? '', link_view: 'room:exclusives' });
    }
    for (const t of tracks ?? []) {
      items.push({ id: t.id, type: 'music', title: t.title, subtitle: t.artist ?? 'Music', cover_url: t.cover_url ?? '', link_view: 'room:music' });
    }

    setEligibleItems(items);
    setLoading(false);
  }

  async function checkDropUsage() {
    if (!user || !profile) { setCanDrop(eligibleItems.length >= MIN_ITEMS); return; }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('daily_drop_usage').select('id')
      .eq('user_id', user.id).eq('creator_id', profile.id)
      .gte('used_at', today).limit(1);
    const hasUsed = (data ?? []).length > 0;
    setUsedToday(hasUsed);
    setCanDrop(!hasUsed && eligibleItems.length >= MIN_ITEMS);
  }

  useEffect(() => { checkDropUsage(); }, [eligibleItems.length]);

  const performDrop = useCallback(async () => {
    if (!canDrop || dropping || eligibleItems.length === 0) return;
    setDropping(true);

    // Fast animation phase (<2s)
    await new Promise(r => setTimeout(r, 1200));

    const randomIdx = Math.floor(Math.random() * eligibleItems.length);
    const item = eligibleItems[randomIdx];
    setDroppedItem(item);

    // Record usage
    if (user && profile) {
      await supabase.from('daily_drop_usage').insert({
        user_id: user.id,
        creator_id: profile.id,
        content_type: item.type,
        content_id: item.id,
        used_at: new Date().toISOString(),
      });
    }
    setUsedToday(true);
    setCanDrop(false);
    setDropping(false);
  }, [canDrop, dropping, eligibleItems, user, profile]);

  const unlocked = eligibleItems.length >= MIN_ITEMS;
  const TYPE_ICON: Record<string, React.ElementType> = { merch: ShoppingBag, exclusive: Star, music: Music };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" /></div>;
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, border: `1.5px solid ${accent}40` }}>
          <Zap size={20} style={{ color: accent }} />
        </div>
        <div>
          <p className="text-white font-bold text-base">Daily Drop</p>
          <p className="text-white/30 text-xs">{eligibleItems.length}/{MIN_ITEMS} items unlocked</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mb-6 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${Math.min((eligibleItems.length / MIN_ITEMS) * 100, 100)}%`,
          background: unlocked ? accent : 'rgba(255,255,255,0.2)',
        }} />
      </div>

      {/* Drop result */}
      {droppedItem && (
        <div className="mx-4 mb-6 rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${accent}50`, background: `${accent}08` }}>
          {droppedItem.cover_url && <img src={droppedItem.cover_url} alt={droppedItem.title} className="w-full h-40 object-cover" />}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              {(() => { const Ic = TYPE_ICON[droppedItem.type] ?? Zap; return <Ic size={12} style={{ color: accent }} />; })()}
              <span className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>{droppedItem.subtitle}</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-3">{droppedItem.title}</h3>
            <button onClick={() => onNavigate?.(droppedItem.link_view)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: accent, color: '#000' }}>
              <ExternalLink size={14} /> Go to {droppedItem.type === 'merch' ? 'Merch' : droppedItem.type === 'exclusive' ? 'Exclusives' : 'Music'}
            </button>
          </div>
        </div>
      )}

      {/* Locked state */}
      {!unlocked && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: `${accent}10`, border: `2px solid ${accent}25` }}>
            <Lock size={28} style={{ color: accent, opacity: 0.5 }} />
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Locked</h3>
          <p className="text-white/30 text-sm text-center">
            Need {MIN_ITEMS - eligibleItems.length} more eligible items to unlock Daily Drop.
          </p>
          {isCreator && (
            <p className="text-white/20 text-xs mt-3 text-center">Mark items as "Daily Drop Eligible" in your content management panels.</p>
          )}
        </div>
      )}

      {/* Unlocked but not yet dropped */}
      {unlocked && !droppedItem && !usedToday && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 cursor-pointer transition-all active:scale-90"
            onClick={performDrop}
            style={{
              background: dropping ? `${accent}30` : `${accent}20`,
              border: `2px solid ${accent}`,
              boxShadow: `0 0 40px ${accent}40, 0 0 80px ${accent}15`,
              animation: dropping ? 'pulse 0.4s infinite' : 'pulse 2s infinite',
            }}>
            {dropping ? (
              <Sparkles size={32} style={{ color: accent }} className="animate-spin" />
            ) : (
              <Zap size={32} style={{ color: accent }} fill={accent} />
            )}
          </div>
          <button onClick={performDrop} disabled={dropping}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: accent, color: '#000' }}>
            {dropping ? 'Dropping...' : 'Drop Now'}
          </button>
          <p className="text-white/30 text-xs mt-3">Once per day. Come back tomorrow for another!</p>
        </div>
      )}

      {/* Used today */}
      {unlocked && usedToday && !droppedItem && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: `${accent}15`, border: `1.5px solid ${accent}30` }}>
            <Zap size={24} style={{ color: accent, opacity: 0.4 }} />
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">Already Dropped Today</h3>
          <p className="text-white/30 text-xs text-center">Come back tomorrow for another drop!</p>
        </div>
      )}
    </div>
  );
}
