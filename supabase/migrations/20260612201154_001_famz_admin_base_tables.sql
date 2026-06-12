/*
# FAMZ System, Daily Drop, Comments, Reactions - Base Tables
*/

-- =====================
-- FAMZ PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS famz_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text NOT NULL DEFAULT 'FAMZ',
  display_color text NOT NULL DEFAULT '#EC4899',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE famz_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_famz_profiles" ON famz_profiles;
CREATE POLICY "public_read_famz_profiles" ON famz_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "famz_insert_own" ON famz_profiles;
CREATE POLICY "famz_insert_own" ON famz_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "famz_update_own" ON famz_profiles;
CREATE POLICY "famz_update_own" ON famz_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================
-- ADMIN ROLES (early, needed for other tables)
-- =====================
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_admin_roles" ON admin_roles;
CREATE POLICY "admin_read_admin_roles" ON admin_roles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "super_admin_manage_roles" ON admin_roles;
CREATE POLICY "super_admin_manage_roles" ON admin_roles FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'super_admin')
  );

-- Insert the admin user from PlaceContext
INSERT INTO admin_roles (user_id, role) 
SELECT id, 'super_admin' FROM auth.users 
WHERE email ILIKE 'homerunroyce@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- =====================
-- CREATOR TAPS (FAMZ -> Creator relationships)
-- =====================
CREATE TABLE IF NOT EXISTS creator_taps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  famz_id uuid NOT NULL REFERENCES famz_profiles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(famz_id, creator_id)
);

ALTER TABLE creator_taps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_creator_taps" ON creator_taps;
CREATE POLICY "public_read_creator_taps" ON creator_taps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "famz_insert_tap" ON creator_taps;
CREATE POLICY "famz_insert_tap" ON creator_taps FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM famz_profiles WHERE id = famz_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "famz_delete_tap" ON creator_taps;
CREATE POLICY "famz_delete_tap" ON creator_taps FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM famz_profiles WHERE id = famz_id AND user_id = auth.uid())
  );

-- =====================
-- CREATOR PRESENCE ("I'm Here" status)
-- =====================
CREATE TABLE IF NOT EXISTS creator_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  last_active_at timestamptz DEFAULT now(),
  status_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE creator_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_creator_presence" ON creator_presence;
CREATE POLICY "public_read_creator_presence" ON creator_presence FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "creator_update_presence" ON creator_presence;
CREATE POLICY "creator_update_presence" ON creator_presence FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

DROP POLICY IF EXISTS "creator_insert_presence" ON creator_presence;
CREATE POLICY "creator_insert_presence" ON creator_presence FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profile WHERE id = creator_id AND (user_id = auth.uid() OR user_id IS NULL))
  );

-- =====================
-- PLATFORM SETTINGS
-- =====================
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_creator_verification boolean NOT NULL DEFAULT false,
  allow_creator_signups boolean NOT NULL DEFAULT true,
  allow_famz_signups boolean NOT NULL DEFAULT true,
  platform_announcement text DEFAULT '',
  daily_drop_minimum integer NOT NULL DEFAULT 1,
  upload_limit_mb integer NOT NULL DEFAULT 50,
  maintenance_mode boolean NOT NULL DEFAULT false,
  support_email text DEFAULT 'support@myplace.app',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO platform_settings (id) VALUES ('11111111-1111-1111-1111-111111111111') ON CONFLICT DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_platform_settings" ON platform_settings;
CREATE POLICY "public_read_platform_settings" ON platform_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_settings" ON platform_settings;
CREATE POLICY "admin_manage_settings" ON platform_settings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_creator_taps_famz_id ON creator_taps(famz_id);
CREATE INDEX IF NOT EXISTS idx_creator_taps_creator_id ON creator_taps(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_presence_creator_id ON creator_presence(creator_id);