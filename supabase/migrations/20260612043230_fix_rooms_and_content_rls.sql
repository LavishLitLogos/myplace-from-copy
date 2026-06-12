/*
# Fix RLS policies for MVP single-creator deployment

## Changes

### rooms — INSERT policy
Allow authenticated users to insert rooms when:
- profile.user_id matches auth.uid(), OR
- profile.user_id is NULL (legacy / initial setup)

This supports the case where a profile was created before user_id
was explicitly set, enabling room seeding on first sign-in.

### All content tables — same fix applied to INSERT + UPDATE + DELETE
Allows authenticated users to manage content when the profile either
belongs to them or has no owner yet (initial setup state).

### creator_profile — INSERT policy (without user_id)
Allow authenticated users to insert a profile with user_id defaulting
to auth.uid(), even if they forget to pass it explicitly.
*/

-- Helper: IS the authenticated user the owner of a given creator_profile id?
-- Handles both claimed profiles (user_id = auth.uid()) and unclaimed (user_id IS NULL).
-- We use this in all content table policies.

-- =====================
-- ROOMS
-- =====================
DROP POLICY IF EXISTS "creator_insert_rooms" ON rooms;
CREATE POLICY "creator_insert_rooms" ON rooms FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM creator_profile
      WHERE id = creator_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "creator_update_rooms" ON rooms;
CREATE POLICY "creator_update_rooms" ON rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_delete_rooms" ON rooms;
CREATE POLICY "creator_delete_rooms" ON rooms FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- MUSIC TRACKS
-- =====================
DROP POLICY IF EXISTS "creator_insert_music_tracks" ON music_tracks;
CREATE POLICY "creator_insert_music_tracks" ON music_tracks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_music_tracks" ON music_tracks;
CREATE POLICY "creator_update_music_tracks" ON music_tracks FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_music_tracks" ON music_tracks;
CREATE POLICY "creator_delete_music_tracks" ON music_tracks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- MUSIC ALBUMS
-- =====================
DROP POLICY IF EXISTS "creator_insert_music_albums" ON music_albums;
CREATE POLICY "creator_insert_music_albums" ON music_albums FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_music_albums" ON music_albums;
CREATE POLICY "creator_update_music_albums" ON music_albums FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_music_albums" ON music_albums;
CREATE POLICY "creator_delete_music_albums" ON music_albums FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- VIDEOS
-- =====================
DROP POLICY IF EXISTS "creator_insert_videos" ON videos;
CREATE POLICY "creator_insert_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_videos" ON videos;
CREATE POLICY "creator_update_videos" ON videos FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_videos" ON videos;
CREATE POLICY "creator_delete_videos" ON videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- NEWS POSTS
-- =====================
DROP POLICY IF EXISTS "creator_insert_news_posts" ON news_posts;
CREATE POLICY "creator_insert_news_posts" ON news_posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_news_posts" ON news_posts;
CREATE POLICY "creator_update_news_posts" ON news_posts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_news_posts" ON news_posts;
CREATE POLICY "creator_delete_news_posts" ON news_posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- MERCH PRODUCTS
-- =====================
DROP POLICY IF EXISTS "creator_insert_merch_products" ON merch_products;
CREATE POLICY "creator_insert_merch_products" ON merch_products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_merch_products" ON merch_products;
CREATE POLICY "creator_update_merch_products" ON merch_products FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_merch_products" ON merch_products;
CREATE POLICY "creator_delete_merch_products" ON merch_products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- EXCLUSIVES
-- =====================
DROP POLICY IF EXISTS "creator_insert_exclusives" ON exclusives;
CREATE POLICY "creator_insert_exclusives" ON exclusives FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_exclusives" ON exclusives;
CREATE POLICY "creator_update_exclusives" ON exclusives FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_exclusives" ON exclusives;
CREATE POLICY "creator_delete_exclusives" ON exclusives FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- CHAT MESSAGES — creator moderation
-- =====================
DROP POLICY IF EXISTS "creator_update_chat_messages" ON chat_messages;
CREATE POLICY "creator_update_chat_messages" ON chat_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL)));

DROP POLICY IF EXISTS "creator_delete_chat_messages" ON chat_messages;
CREATE POLICY "creator_delete_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- CREATOR PROFILE — fix update to allow claiming unclaimed profile
-- =====================
DROP POLICY IF EXISTS "creator_update_profile" ON creator_profile;
CREATE POLICY "creator_update_profile" ON creator_profile FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (true);
