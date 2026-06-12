import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export type ReactionType = 'like' | 'love' | 'fire' | 'sad' | 'hundred' | 'mic' | 'music_note';

const REACTION_DISPLAY: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '\u{1F44D}', label: 'Like' },
  love: { emoji: '\u{2764}\u{FE0F}', label: 'Love' },
  fire: { emoji: '\u{1F525}', label: 'Fire' },
  sad: { emoji: '\u{1F622}', label: 'Sad' },
  hundred: { emoji: '\u{1F4AF}', label: '100' },
  mic: { emoji: '\u{1F3A4}', label: 'Mic' },
  music_note: { emoji: '\u{1F3B5}', label: 'Music' },
};

interface ReactionCounts {
  [key: string]: { count: number; reacted: boolean };
}

interface ReactionsProps {
  contentType: 'news_post' | 'music_track';
  contentId: string;
}

export function Reactions({ contentType, contentId }: ReactionsProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ReactionCounts>({});
  const [showPicker, setShowPicker] = useState(false);

  const loadReactions = useCallback(async () => {
    const { data } = await supabase
      .from('content_reactions')
      .select('reaction, user_id')
      .eq('content_type', contentType)
      .eq('content_id', contentId);
    const map: ReactionCounts = {};
    for (const r of data ?? []) {
      if (!map[r.reaction]) map[r.reaction] = { count: 0, reacted: false };
      map[r.reaction].count++;
      if (user && r.user_id === user.id) map[r.reaction].reacted = true;
    }
    setCounts(map);
  }, [contentType, contentId, user?.id]);

  useEffect(() => { loadReactions(); }, [loadReactions]);

  async function toggleReaction(reaction: ReactionType) {
    if (!user) return;
    if (counts[reaction]?.reacted) {
      await supabase.from('content_reactions').delete()
        .eq('content_type', contentType).eq('content_id', contentId)
        .eq('user_id', user.id).eq('reaction', reaction);
    } else {
      await supabase.from('content_reactions').insert({
        content_type: contentType, content_id: contentId, user_id: user.id, reaction,
      });
    }
    loadReactions();
    setShowPicker(false);
  }

  const activeReactions = (Object.keys(counts) as ReactionType[]).filter(r => counts[r].count > 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeReactions.map(r => (
        <button key={r} onClick={() => toggleReaction(r)}
          className="flex items-center gap-0.5 px-2 py-1 rounded-full text-xs transition-all active:scale-90"
          style={{ background: counts[r].reacted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: counts[r].reacted ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-sm">{REACTION_DISPLAY[r].emoji}</span>
          <span className="text-white/50 text-[10px]">{counts[r].count}</span>
        </button>
      ))}
      <div className="relative">
        <button onClick={() => setShowPicker(p => !p)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/25 hover:text-white/50 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>+</button>
        {showPicker && (
          <div className="absolute bottom-9 left-0 flex gap-1 p-2 rounded-xl z-20"
            style={{ background: 'rgba(20,20,20,0.98)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
            {(Object.keys(REACTION_DISPLAY) as ReactionType[]).map(r => (
              <button key={r} onClick={() => toggleReaction(r)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
                title={REACTION_DISPLAY[r].label}>
                <span className="text-base">{REACTION_DISPLAY[r].emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
