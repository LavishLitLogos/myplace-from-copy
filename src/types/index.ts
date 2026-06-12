export interface CreatorProfile {
  id: string;
  user_id: string | null;
  name: string;
  bio: string;
  profile_image_url: string;
  cover_image_url: string;
  accent_color: string;
  background_color: string;
  welcome_message: string;
  place_logo_url: string;
  is_active: boolean;
  presence_status: string;
  presence_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  creator_id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  sort_order: number;
  is_custom: boolean;
}

export interface MusicTrack {
  id: string;
  creator_id: string;
  album_id: string | null;
  title: string;
  artist: string;
  cover_url: string;
  audio_url: string;
  duration_secs: number;
  track_number: number;
  is_featured: boolean;
  is_pinned: boolean;
  is_visible: boolean;
  allow_comments: boolean;
  sort_order: number;
  created_at: string;
}

export interface MusicAlbum {
  id: string;
  creator_id: string;
  title: string;
  type: 'album' | 'mixtape' | 'playlist' | 'collection';
  cover_url: string;
  release_year: number | null;
  description: string;
  is_featured: boolean;
  is_pinned: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  tracks?: MusicTrack[];
}

export interface Video {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  type: 'music_video' | 'short' | 'interview' | 'behind_scenes' | 'livestream_replay';
  is_featured: boolean;
  is_pinned: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface NewsPost {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  cover_url: string;
  is_featured: boolean;
  is_pinned: boolean;
  is_published: boolean;
  allow_comments: boolean;
  is_visible: boolean;
  publish_at: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MerchProduct {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  button_label: string;
  button_url: string;
  is_featured: boolean;
  eligible_daily_drop: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Exclusive {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  cover_url: string;
  file_url: string;
  file_type: 'download' | 'vip' | 'behind_scenes' | 'fan_reward' | 'other';
  is_featured: boolean;
  eligible_daily_drop: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  creator_id: string;
  sender_name: string;
  sender_color: string;
  message: string;
  is_creator_message: boolean;
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface FamzRelationship {
  id: string;
  user_id: string;
  creator_id: string;
  created_at: string;
}

export type ViewName =
  | 'splash'
  | 'home'
  | 'auth'
  | 'famz:home'
  | 'famz:profile'
  | 'famz:creator_place'
  | 'room:music'
  | 'room:chat'
  | 'room:merch'
  | 'room:videos'
  | 'room:news'
  | 'room:exclusives'
  | 'room:daily_drop'
  | 'creator:panel'
  | 'creator:profile'
  | 'creator:music'
  | 'creator:videos'
  | 'creator:news'
  | 'creator:merch'
  | 'creator:exclusives'
  | 'creator:rooms'
  | 'creator:admin';

export const DEFAULT_ROOMS: Omit<Room, 'id' | 'creator_id'>[] = [
  { slug: 'music', name: 'Music', icon: 'Music', color: '#EC4899', enabled: true, sort_order: 0, is_custom: false },
  { slug: 'chat', name: 'Chat', icon: 'MessageCircle', color: '#06B6D4', enabled: true, sort_order: 1, is_custom: false },
  { slug: 'merch', name: 'Merch', icon: 'ShoppingBag', color: '#22C55E', enabled: true, sort_order: 2, is_custom: false },
  { slug: 'videos', name: 'Videos', icon: 'Play', color: '#A855F7', enabled: true, sort_order: 3, is_custom: false },
  { slug: 'news', name: 'News', icon: 'Newspaper', color: '#F97316', enabled: true, sort_order: 4, is_custom: false },
  { slug: 'exclusives', name: 'Exclusives', icon: 'Star', color: '#EAB308', enabled: true, sort_order: 5, is_custom: false },
  { slug: 'daily_drop', name: 'Daily Drop', icon: 'Zap', color: '#3B82F6', enabled: true, sort_order: 6, is_custom: false },
];

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export const FAMZ_COLORS = [
  '#EC4899', '#06B6D4', '#22C55E', '#A855F7',
  '#F97316', '#EAB308', '#3B82F6', '#EF4444',
  '#10B981', '#F59E0B',
];
