/*
# MyPlace™ Core Schema

## Summary
Creates the full data model for MyPlace™ — a creator-owned digital platform.

## New Tables

### creator_profile
Single-row table for the creator's Place settings.
- id, user_id (auth owner), name, bio, profile_image_url, cover_image_url
- accent_color, background_color, welcome_message
- created_at, updated_at

### rooms
Configuration for each Room node (Music, Chat, Merch, Videos, News, Exclusives + custom).
- id, creator_id (FK to creator_profile), slug, name, icon, color
- enabled (boolean), sort_order, custom (boolean)

### music_tracks
Individual music files.
- id, creator_id, title, artist, album_id (nullable), cover_url, audio_url
- duration_secs, track_number, is_featured, is_pinned, sort_order

### music_albums
Albums, mixtapes, playlists.
- id, creator_id, title, type (album|mixtape|playlist|collection), cover_url
- release_year, is_featured, is_pinned, sort_order

### videos
Video content.
- id, creator_id, title, description, thumbnail_url, video_url
- type (music_video|short|interview|behind_scenes|livestream_replay)
- is_featured, is_pinned, sort_order

### news_posts
Announcements and updates.
- id, creator_id, title, body, cover_url
- is_featured, is_pinned, is_published, publish_at, sort_order

### merch_products
Merchandise items.
- id, creator_id, name, description, price_cents, image_url
- button_label, button_url, is_featured, sort_order

### exclusives
VIP / exclusive content items.
- id, creator_id, title, description, cover_url, file_url, file_type
- is_featured, sort_order

### chat_messages
Community chat messages.
- id, creator_id, sender_name, sender_color, message, is_creator_message
- is_pinned, is_featured, created_at

## Security
- RLS enabled on all tables.
- Public read for all content (anon + authenticated).
- Write (insert/update/delete) restricted to authenticated creator (auth.uid() = user_id via creator_profile).
*/

-- =====================
-- CREATOR PROFILE
-- =====================
CREATE TABLE IF NOT EXISTS creator_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Place',
  bio text DEFAULT '',
  profile_image_url text DEFAULT '',
  cover_image_url text DEFAULT '',
  accent_color text DEFAULT '#EC4899',
  background_color text DEFAULT '#000000',
  welcome_message text DEFAULT 'Welcome to My Place',
  place_logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE creator_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_creator_profile" ON creator_profile;
CREATE POLICY "public_read_creator_profile" ON creator_profile FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_profile" ON creator_profile;
CREATE POLICY "creator_insert_profile" ON creator_profile FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_update_profile" ON creator_profile;
CREATE POLICY "creator_update_profile" ON creator_profile FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_delete_profile" ON creator_profile;
CREATE POLICY "creator_delete_profile" ON creator_profile FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- ROOMS
-- =====================
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'circle',
  color text NOT NULL DEFAULT '#EC4899',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_rooms" ON rooms;
CREATE POLICY "public_read_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_rooms" ON rooms;
CREATE POLICY "creator_insert_rooms" ON rooms FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_rooms" ON rooms;
CREATE POLICY "creator_update_rooms" ON rooms FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_rooms" ON rooms;
CREATE POLICY "creator_delete_rooms" ON rooms FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- MUSIC ALBUMS
-- =====================
CREATE TABLE IF NOT EXISTS music_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'album' CHECK (type IN ('album','mixtape','playlist','collection')),
  cover_url text DEFAULT '',
  release_year integer,
  description text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE music_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_music_albums" ON music_albums;
CREATE POLICY "public_read_music_albums" ON music_albums FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_music_albums" ON music_albums;
CREATE POLICY "creator_insert_music_albums" ON music_albums FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_music_albums" ON music_albums;
CREATE POLICY "creator_update_music_albums" ON music_albums FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_music_albums" ON music_albums;
CREATE POLICY "creator_delete_music_albums" ON music_albums FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- MUSIC TRACKS
-- =====================
CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  album_id uuid REFERENCES music_albums(id) ON DELETE SET NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  cover_url text DEFAULT '',
  audio_url text NOT NULL DEFAULT '',
  duration_secs integer DEFAULT 0,
  track_number integer DEFAULT 1,
  is_featured boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_music_tracks" ON music_tracks;
CREATE POLICY "public_read_music_tracks" ON music_tracks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_music_tracks" ON music_tracks;
CREATE POLICY "creator_insert_music_tracks" ON music_tracks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_music_tracks" ON music_tracks;
CREATE POLICY "creator_update_music_tracks" ON music_tracks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_music_tracks" ON music_tracks;
CREATE POLICY "creator_delete_music_tracks" ON music_tracks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- VIDEOS
-- =====================
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'music_video' CHECK (type IN ('music_video','short','interview','behind_scenes','livestream_replay')),
  is_featured boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_videos" ON videos;
CREATE POLICY "public_read_videos" ON videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_videos" ON videos;
CREATE POLICY "creator_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_videos" ON videos;
CREATE POLICY "creator_update_videos" ON videos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_videos" ON videos;
CREATE POLICY "creator_delete_videos" ON videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- NEWS POSTS
-- =====================
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  cover_url text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  publish_at timestamptz DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_news_posts" ON news_posts;
CREATE POLICY "public_read_news_posts" ON news_posts FOR SELECT
  TO anon, authenticated USING (is_published = true AND publish_at <= now());

DROP POLICY IF EXISTS "creator_insert_news_posts" ON news_posts;
CREATE POLICY "creator_insert_news_posts" ON news_posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_news_posts" ON news_posts;
CREATE POLICY "creator_update_news_posts" ON news_posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_news_posts" ON news_posts;
CREATE POLICY "creator_delete_news_posts" ON news_posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- MERCH PRODUCTS
-- =====================
CREATE TABLE IF NOT EXISTS merch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  button_label text NOT NULL DEFAULT 'Shop Now',
  button_url text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE merch_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_merch_products" ON merch_products;
CREATE POLICY "public_read_merch_products" ON merch_products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_merch_products" ON merch_products;
CREATE POLICY "creator_insert_merch_products" ON merch_products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_merch_products" ON merch_products;
CREATE POLICY "creator_update_merch_products" ON merch_products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_merch_products" ON merch_products;
CREATE POLICY "creator_delete_merch_products" ON merch_products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- EXCLUSIVES
-- =====================
CREATE TABLE IF NOT EXISTS exclusives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  file_url text DEFAULT '',
  file_type text DEFAULT 'download' CHECK (file_type IN ('download','vip','behind_scenes','fan_reward','other')),
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exclusives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_exclusives" ON exclusives;
CREATE POLICY "public_read_exclusives" ON exclusives FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_insert_exclusives" ON exclusives;
CREATE POLICY "creator_insert_exclusives" ON exclusives FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_update_exclusives" ON exclusives;
CREATE POLICY "creator_update_exclusives" ON exclusives FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_exclusives" ON exclusives;
CREATE POLICY "creator_delete_exclusives" ON exclusives FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- CHAT MESSAGES
-- =====================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT 'Anonymous',
  sender_color text NOT NULL DEFAULT '#EC4899',
  message text NOT NULL,
  is_creator_message boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_chat_messages" ON chat_messages;
CREATE POLICY "public_read_chat_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_chat_messages" ON chat_messages;
CREATE POLICY "public_insert_chat_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "creator_update_chat_messages" ON chat_messages;
CREATE POLICY "creator_update_chat_messages" ON chat_messages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "creator_delete_chat_messages" ON chat_messages;
CREATE POLICY "creator_delete_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND user_id = auth.uid())
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_creator_id ON music_tracks(creator_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_album_id ON music_tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_music_albums_creator_id ON music_albums(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_creator_id ON news_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_merch_products_creator_id ON merch_products(creator_id);
CREATE INDEX IF NOT EXISTS idx_exclusives_creator_id ON exclusives(creator_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_creator_id ON chat_messages(creator_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
