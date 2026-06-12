/*
# Daily Drop, Comments, Reactions, Reports
*/

-- =====================
-- DAILY DROPS
-- =====================
CREATE TABLE IF NOT EXISTS daily_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('news', 'music', 'video', 'exclusive', 'merch')),
  content_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  source_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  drop_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_drops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_daily_drops" ON daily_drops;
CREATE POLICY "public_read_daily_drops" ON daily_drops FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "creator_insert_daily_drops" ON daily_drops;
CREATE POLICY "creator_insert_daily_drops" ON daily_drops FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_daily_drops" ON daily_drops;
CREATE POLICY "creator_update_daily_drops" ON daily_drops FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_delete_daily_drops" ON daily_drops;
CREATE POLICY "creator_delete_daily_drops" ON daily_drops FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "admin_manage_daily_drops" ON daily_drops;
CREATE POLICY "admin_manage_daily_drops" ON daily_drops FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- =====================
-- FAMZ DAILY CLAIMS
-- =====================
CREATE TABLE IF NOT EXISTS famz_daily_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famz_id uuid NOT NULL REFERENCES famz_profiles(id) ON DELETE CASCADE,
  daily_drop_id uuid NOT NULL REFERENCES daily_drops(id) ON DELETE CASCADE,
  claim_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(famz_id, claim_date)
);

ALTER TABLE famz_daily_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_famz_claims" ON famz_daily_claims;
CREATE POLICY "public_read_famz_claims" ON famz_daily_claims FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "famz_insert_claim" ON famz_daily_claims;
CREATE POLICY "famz_insert_claim" ON famz_daily_claims FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM famz_profiles WHERE id = famz_id AND user_id = auth.uid())
  );

-- =====================
-- CONTENT COMMENTS
-- =====================
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('news', 'music', 'video', 'exclusive')),
  content_id uuid NOT NULL,
  commenter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  commenter_name text NOT NULL,
  commenter_color text NOT NULL DEFAULT '#EC4899',
  comment text NOT NULL,
  is_creator_comment boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_comments" ON content_comments;
CREATE POLICY "public_read_comments" ON content_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_comments" ON content_comments;
CREATE POLICY "authenticated_insert_comments" ON content_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = commenter_id);

DROP POLICY IF EXISTS "commenter_delete_own" ON content_comments;
CREATE POLICY "commenter_delete_own" ON content_comments FOR DELETE
  TO authenticated USING (auth.uid() = commenter_id);

DROP POLICY IF EXISTS "creator_delete_comments" ON content_comments;
CREATE POLICY "creator_delete_comments" ON content_comments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_update_comments" ON content_comments;
CREATE POLICY "creator_update_comments" ON content_comments FOR UPDATE
  TO authenticated USING (
    auth.uid() = commenter_id OR
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  ) WITH CHECK (
    auth.uid() = commenter_id OR
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- CONTENT REACTIONS
-- =====================
CREATE TABLE IF NOT EXISTS content_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('news', 'music', 'video', 'exclusive', 'comment')),
  content_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('fire', 'heart', 'star', 'clap', 'crown')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_type, content_id, user_id)
);

ALTER TABLE content_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reactions" ON content_reactions;
CREATE POLICY "public_read_reactions" ON content_reactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_reactions" ON content_reactions;
CREATE POLICY "authenticated_insert_reactions" ON content_reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_delete_reactions" ON content_reactions;
CREATE POLICY "authenticated_delete_reactions" ON content_reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- CONTENT REPORTS (Moderation)
-- =====================
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('news', 'music', 'video', 'exclusive', 'comment', 'chat')),
  content_id uuid NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('hate', 'harassment', 'threat', 'sexual', 'gore', 'criminal', 'other')),
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_reports" ON content_reports;
CREATE POLICY "admin_read_reports" ON content_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_update_reports" ON content_reports;
CREATE POLICY "admin_update_reports" ON content_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "authenticated_insert_reports" ON content_reports;
CREATE POLICY "authenticated_insert_reports" ON content_reports FOR INSERT
  TO authenticated WITH CHECK (true);

-- =====================
-- CONTENT SETTINGS (per content item)
-- =====================

ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS is_daily_drop_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE music_tracks ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;
ALTER TABLE music_tracks ADD COLUMN IF NOT EXISTS is_daily_drop_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE videos ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_daily_drop_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE exclusives ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true;
ALTER TABLE exclusives ADD COLUMN IF NOT EXISTS is_daily_drop_eligible boolean NOT NULL DEFAULT false;

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_daily_drops_drop_date ON daily_drops(drop_date);
CREATE INDEX IF NOT EXISTS idx_daily_drops_creator_id ON daily_drops(creator_id);
CREATE INDEX IF NOT EXISTS idx_famz_daily_claims_famz_date ON famz_daily_claims(famz_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reactions_content ON content_reactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);