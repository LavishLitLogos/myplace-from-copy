import { useEffect, useState, useRef } from 'react';
import { Send, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlace } from '../../contexts/PlaceContext';
import { timeAgo, FAMZ_COLORS } from '../../types';

interface Comment { id: string; sender_name: string; sender_color: string; message: string; is_creator_message: boolean; created_at: string; }

interface CommentsSectionProps {
  contentType: 'news_post' | 'music_track';
  contentId: string;
  creatorId: string;
}

const DISPLAY_NAME_KEY = 'myplace_famz_name';
const DISPLAY_COLOR_KEY = 'myplace_famz_color';
function randomColor() { return FAMZ_COLORS[Math.floor(Math.random() * FAMZ_COLORS.length)]; }

export function CommentsSection({ contentType, contentId, creatorId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { profile, isCreator } = usePlace();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [senderName] = useState(() => localStorage.getItem(DISPLAY_NAME_KEY) ?? 'FAMZ');
  const [senderColor] = useState(() => localStorage.getItem(DISPLAY_COLOR_KEY) ?? randomColor());
  const bottomRef = useRef<HTMLDivElement>(null);
  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => { loadComments(); }, [contentType, contentId]);

  async function loadComments() {
    const { data } = await supabase.from('content_comments').select('*')
      .eq('content_type', contentType).eq('content_id', contentId)
      .order('created_at', { ascending: true }).limit(50);
    setComments(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function sendComment() {
    if (!input.trim() || !user) return;
    const msg = input.trim();
    setInput('');
    await supabase.from('content_comments').insert({
      content_type: contentType, content_id: contentId, creator_id: creatorId,
      user_id: user.id, sender_name: isCreator ? (profile?.name ?? 'Creator') : senderName,
      sender_color: isCreator ? accent : senderColor, message: msg, is_creator_message: isCreator,
    });
    loadComments();
  }

  return (
    <div className="mt-4">
      <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Comments</p>
      <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
        {comments.length === 0 && <p className="text-white/20 text-xs text-center py-3">No comments yet</p>}
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold"
              style={{ background: c.is_creator_message ? `${accent}20` : `${c.sender_color}15`, border: c.is_creator_message ? `1.5px solid ${accent}` : `1.5px solid ${c.sender_color}60`, color: c.is_creator_message ? accent : c.sender_color }}>
              {c.is_creator_message ? <Crown size={8} /> : c.sender_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold" style={{ color: c.is_creator_message ? accent : c.sender_color }}>{c.sender_name}</span>
                <span className="text-white/15 text-[8px]">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">{c.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()}
            placeholder="Add a comment..." maxLength={300}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/25 text-xs outline-none focus:border-white/20" />
          <button onClick={sendComment} disabled={!input.trim()}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
            style={{ background: accent }}><Send size={10} className="text-black" /></button>
        </div>
      )}
    </div>
  );
}
