import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { ContentComment, ContentReaction, CreatorProfile } from '../types';
import { useAuth } from './AuthContext';

interface ContentContextValue {
  comments: ContentComment[];
  reactions: ContentReaction[];
  userReactions: Map<string, string>;
  loading: boolean;
  loadComments: (creatorId: string, contentType: string, contentId: string) => Promise<void>;
  loadReactions: (creatorId: string, contentType: string, contentId: string) => Promise<void>;
  addComment: (creatorId: string, contentType: string, contentId: string, comment: string, commenterName: string, commenterColor: string, isCreatorComment: boolean) => Promise<{ error: string | null }>;
  deleteComment: (commentId: string) => Promise<{ error: string | null }>;
  addReaction: (creatorId: string, contentType: string, contentId: string, reactionType: string) => Promise<{ error: string | null }>;
  removeReaction: (contentType: string, contentId: string) => Promise<{ error: string | null }>;
}

const ContentCtx = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [reactions, setReactions] = useState<ContentReaction[]>([]);
  const [userReactions, setUserReactions] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  async function loadComments(creatorId: string, contentType: string, contentId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('content_comments')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }

  async function loadReactions(creatorId: string, contentType: string, contentId: string) {
    const { data } = await supabase
      .from('content_reactions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('content_type', contentType)
      .eq('content_id', contentId);
    setReactions(data ?? []);

    if (user) {
      const userReaction = (data ?? []).find(r => r.user_id === user.id);
      if (userReaction) {
        const newMap = new Map(userReactions);
        newMap.set(`${contentType}:${contentId}`, userReaction.reaction_type);
        setUserReactions(newMap);
      }
    }
  }

  async function addComment(
    creatorId: string,
    contentType: string,
    contentId: string,
    comment: string,
    commenterName: string,
    commenterColor: string,
    isCreatorComment: boolean
  ) {
    if (!user) return { error: 'Not authenticated' };
    if (!comment.trim()) return { error: 'Comment cannot be empty' };

    const { error } = await supabase
      .from('content_comments')
      .insert({
        creator_id: creatorId,
        content_type: contentType,
        content_id: contentId,
        commenter_id: user.id,
        commenter_name: commenterName,
        commenter_color: commenterColor,
        comment: comment.trim(),
        is_creator_comment: isCreatorComment,
      });

    if (!error) {
      const { data } = await supabase
        .from('content_comments')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });
      setComments(data ?? []);
    }

    return { error: error?.message ?? null };
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase
      .from('content_comments')
      .delete()
      .eq('id', commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
    return { error: error?.message ?? null };
  }

  async function addReaction(creatorId: string, contentType: string, contentId: string, reactionType: string) {
    if (!user) return { error: 'Not authenticated' };

    const key = `${contentType}:${contentId}`;
    const currentReaction = userReactions.get(key);

    if (currentReaction === reactionType) {
      return removeReaction(contentType, contentId);
    }

    if (currentReaction) {
      await supabase
        .from('content_reactions')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('user_id', user.id);
    }

    const { error } = await supabase
      .from('content_reactions')
      .insert({
        creator_id: creatorId,
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        reaction_type: reactionType,
      });

    if (!error) {
      const newMap = new Map(userReactions);
      newMap.set(key, reactionType);
      setUserReactions(newMap);
    }

    return { error: error?.message ?? null };
  }

  async function removeReaction(contentType: string, contentId: string) {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('content_reactions')
      .delete()
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('user_id', user.id);

    if (!error) {
      const key = `${contentType}:${contentId}`;
      const newMap = new Map(userReactions);
      newMap.delete(key);
      setUserReactions(newMap);
    }

    return { error: error?.message ?? null };
  }

  return (
    <ContentCtx.Provider value={{
      comments,
      reactions,
      userReactions,
      loading,
      loadComments,
      loadReactions,
      addComment,
      deleteComment,
      addReaction,
      removeReaction,
    }}>
      {children}
    </ContentCtx.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
