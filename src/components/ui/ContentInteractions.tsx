import { useEffect, useState } from 'react';
import { MessageCircle, Flame, Heart, Star, HandMetal, Crown, ChevronDown, Send, X } from 'lucide-react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlace } from '../../contexts/PlaceContext';
import { ContentComment, timeAgo } from '../../types';

const REACTION_ICONS: Record<string, React.ElementType> = {
  fire: Flame,
  heart: Heart,
  star: Star,
  clap: HandMetal,
  crown: Crown,
};

const REACTION_COLORS: Record<string, string> = {
  fire: '#EF4444',
  heart: '#EC4899',
  star: '#EAB308',
  clap: '#22C55E',
  crown: '#A855F7',
};

interface ReactionBadgeProps {
  type: string;
  count: number;
  isUserReaction: boolean;
  onClick: () => void;
  accent: string;
}

export function ReactionBadge({ type, count, isUserReaction, onClick, accent }: ReactionBadgeProps) {
  const IconComp = REACTION_ICONS[type] ?? Star;
  const color = REACTION_COLORS[type] ?? accent;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95"
      style={{
        background: isUserReaction ? `${color}25` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isUserReaction ? color : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <IconComp size={12} style={{ color }} />
      <span className="text-[10px] font-semibold" style={{ color: isUserReaction ? color : 'rgba(255,255,255,0.5)' }}>
        {count}
      </span>
    </button>
  );
}

interface CommentItemProps {
  comment: ContentComment;
  accent: string;
  canDelete?: boolean;
  showDelete?: boolean;
  onDelete: () => void;
}

export function CommentItem({ comment, accent, canDelete, showDelete, onDelete }: CommentItemProps) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: `${comment.commenter_color}20`,
          border: `1.5px solid ${comment.commenter_color}`,
        }}
      >
        <span className="text-[10px] font-bold" style={{ color: comment.commenter_color }}>
          {comment.is_creator_message ? 'C' : comment.commenter_name?.[0]?.toUpperCase() ?? 'F'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-xs font-semibold"
            style={{ color: comment.is_creator_message ? accent : comment.commenter_color }}
          >
            {comment.commenter_name}
            {comment.is_creator_message && (
              <span
                className="ml-1 text-[8px] px-1 py-0.5 rounded-full font-bold"
                style={{ background: `${accent}20`, color: accent }}
              >
                CREATOR
              </span>
            )}
          </span>
          <span className="text-white/20 text-[10px]">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-white/70 text-xs leading-relaxed">{comment.comment}</p>
      </div>
      {canDelete && showDelete && (
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:text-red-400"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

interface CommentsPanelProps {
  creatorId: string;
  contentType: 'news' | 'music' | 'video' | 'exclusive';
  contentId: string;
  allowComments: boolean;
}

export function CommentsPanel({ creatorId, contentType, contentId, allowComments }: CommentsPanelProps) {
  const { profile, isCreator } = usePlace();
  const { user } = useAuth();
  const { comments, addComment, deleteComment, loadComments } = useContent();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const accent = profile?.accent_color ?? '#EC4899';

  useEffect(() => {
    if (allowComments || isCreator) {
      loadComments(creatorId, contentType, contentId);
    }
  }, [creatorId, contentType, contentId, allowComments, isCreator]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);

    const isCreatorComment = isCreator;
    const name = isCreatorComment
      ? (profile?.name ?? 'Creator')
      : 'FAMZ';
    const color = isCreatorComment
      ? accent
      : '#EC4899';

    const { error } = await addComment(
      creatorId, contentType, contentId,
      input.trim(), name, color, isCreatorComment
    );

    setSending(false);
    if (!error) {
      setInput('');
    }
  }

  if (!allowComments && !isCreator) return null;

  const commenterName = isCreator ? profile?.name ?? 'Creator' : 'FAMZ';
  const commenterColor = isCreator ? accent : '#EC4899';

  return (
    <div className="mt-2">
      {/* Comment count */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        <MessageCircle size={12} />
        <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded comments */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {comments.length > 0 ? (
            <div className="space-y-1 pb-2 border-b border-white/10 max-h-40 overflow-y-auto">
              {comments.map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  accent={accent}
                  canDelete={isCreator || c.commenter_id === user?.id}
                  showDelete
                  onDelete={() => deleteComment(c.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs py-2">No comments yet</p>
          )}

          {/* Comment input */}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isCreator ? "Write as creator..." : "Add a comment..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 text-xs outline-none focus:border-white/25"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ background: accent }}
            >
              <Send size={12} className="text-black" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReactionRowProps {
  creatorId: string;
  contentType: 'news' | 'music' | 'video' | 'exclusive' | 'comment';
  contentId: string;
  accent?: string;
}

export function ReactionRow({ creatorId, contentType, contentId, accent: propAccent }: ReactionRowProps) {
  const { reactions, userReactions, addReaction } = useContent();
  const { user } = useAuth();
  const [localReactions, setLocalReactions] = useState<{ type: string; count: number }[]>([]);

  const accent = propAccent ?? '#EC4899';

  useEffect(() => {
    const counts = new Map<string, number>();
    reactions.forEach(r => {
      counts.set(r.reaction_type, (counts.get(r.reaction_type) ?? 0) + 1);
    });
    const result = Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
    setLocalReactions(result);
  }, [reactions]);

  async function handleReact(type: string) {
    if (!user) return;
    await addReaction(creatorId, contentType, contentId, type);
  }

  const key = `${contentType}:${contentId}`;
  const userReaction = userReactions.get(key);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {localReactions.map(r => (
        <ReactionBadge
          key={r.type}
          type={r.type}
          count={r.count}
          isUserReaction={userReaction === r.type}
          onClick={() => handleReact(r.type)}
          accent={accent}
        />
      ))}
      {user && !userReaction && (
        <button
          onClick={() => handleReact('fire')}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-white/30 hover:text-white/50 text-[10px]"
          style={{ border: '1px dashed rgba(255,255,255,0.2)' }}
        >
          +
        </button>
      )}
    </div>
  );
}
