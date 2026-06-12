-- Add a default daily drop for testing (will be replaced by real system)
-- This ensures the daily drop system has data to work with initially

-- Create a function to automatically create daily drops from eligible content
CREATE OR REPLACE FUNCTION create_daily_drop_from_eligible()
RETURNS void AS $$
DECLARE
  eligible_record RECORD;
  today_date date := CURRENT_DATE;
BEGIN
  -- Check if there's already a drop for today
  IF NOT EXISTS (SELECT 1 FROM daily_drops WHERE drop_date = today_date) THEN
    -- Try to find an eligible music track
    SELECT mt.id, mt.title, mt.cover_url, 'music' as type, m.id as creator
    INTO eligible_record
    FROM music_tracks mt
    JOIN creator_profile m ON mt.creator_id = m.id
    WHERE mt.is_daily_drop_eligible = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF eligible_record IS NOT NULL THEN
      INSERT INTO daily_drops (creator_id, content_type, content_id, title, cover_url, drop_date)
      VALUES (
        eligible_record.creator,
        eligible_record.type,
        eligible_record.id,
        eligible_record.title,
        eligible_record.cover_url,
        today_date
      );
      RETURN;
    END IF;
    
    -- Try news posts
    SELECT np.id, np.title, np.cover_url, 'news' as type, np.creator_id as creator
    INTO eligible_record
    FROM news_posts np
    WHERE np.is_daily_drop_eligible = true AND np.is_published = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF eligible_record IS NOT NULL THEN
      INSERT INTO daily_drops (creator_id, content_type, content_id, title, cover_url, drop_date)
      VALUES (
        eligible_record.creator,
        eligible_record.type,
        eligible_record.id,
        eligible_record.title,
        eligible_record.cover_url,
        today_date
      );
      RETURN;
    END IF;
    
    -- Try videos
    SELECT v.id, v.title, v.thumbnail_url as cover_url, 'video' as type, v.creator_id as creator
    INTO eligible_record
    FROM videos v
    WHERE v.is_daily_drop_eligible = true
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF eligible_record IS NOT NULL THEN
      INSERT INTO daily_drops (creator_id, content_type, content_id, title, cover_url, drop_date)
      VALUES (
        eligible_record.creator,
        eligible_record.type,
        eligible_record.id,
        eligible_record.title,
        eligible_record.cover_url,
        today_date
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;