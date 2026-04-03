
-- Gamification: Auto-award points via database functions

-- Function to award points to a client
CREATE OR REPLACE FUNCTION public.award_points(p_client_id uuid, p_points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO accountability_scores (client_id, total_points, current_streak, longest_streak, level)
  VALUES (p_client_id, p_points, 0, 0, 'begynder')
  ON CONFLICT (client_id) DO UPDATE SET
    total_points = accountability_scores.total_points + p_points,
    level = CASE
      WHEN accountability_scores.total_points + p_points >= 1000 THEN 'built'
      WHEN accountability_scores.total_points + p_points >= 600 THEN 'machine'
      WHEN accountability_scores.total_points + p_points >= 300 THEN 'disciplined'
      WHEN accountability_scores.total_points + p_points >= 100 THEN 'builder'
      ELSE 'begynder'
    END;
END;
$$;

-- Trigger: Award 10 points on check-in submission
CREATE OR REPLACE FUNCTION public.on_checkin_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    PERFORM award_points(NEW.client_id, 10);
    -- Update streak
    UPDATE accountability_scores 
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1)
    WHERE client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER checkin_submitted_trigger
  AFTER UPDATE ON weekly_checkins
  FOR EACH ROW
  EXECUTE FUNCTION on_checkin_submitted();

-- Trigger: Award 5 points when all habits completed for a day
CREATE OR REPLACE FUNCTION public.on_habit_logged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
  v_total_habits integer;
  v_completed_habits integer;
BEGIN
  IF NEW.completed = true THEN
    SELECT dh.client_id INTO v_client_id
    FROM daily_habits dh WHERE dh.id = NEW.habit_id;
    
    SELECT COUNT(*) INTO v_total_habits
    FROM daily_habits WHERE client_id = v_client_id AND active = true;
    
    SELECT COUNT(*) INTO v_completed_habits
    FROM habit_logs hl
    JOIN daily_habits dh ON dh.id = hl.habit_id
    WHERE dh.client_id = v_client_id AND hl.date = NEW.date AND hl.completed = true;
    
    IF v_completed_habits >= v_total_habits AND v_total_habits > 0 THEN
      PERFORM award_points(v_client_id, 5);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER habit_logged_trigger
  AFTER INSERT OR UPDATE ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION on_habit_logged();

-- Trigger: Award 15 points on progress photo upload
CREATE OR REPLACE FUNCTION public.on_photo_uploaded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM award_points(NEW.client_id, 15);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER photo_uploaded_trigger
  AFTER INSERT ON progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION on_photo_uploaded();

-- Trigger: Award 50 points on milestone achieved
CREATE OR REPLACE FUNCTION public.on_milestone_achieved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  IF NEW.achieved = true AND (OLD.achieved IS NULL OR OLD.achieved = false) THEN
    SELECT g.client_id INTO v_client_id
    FROM goals g WHERE g.id = NEW.goal_id;
    
    IF v_client_id IS NOT NULL THEN
      PERFORM award_points(v_client_id, 50);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER milestone_achieved_trigger
  AFTER UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION on_milestone_achieved();

-- Add unique constraint on accountability_scores.client_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accountability_scores_client_id_key'
  ) THEN
    ALTER TABLE accountability_scores ADD CONSTRAINT accountability_scores_client_id_key UNIQUE (client_id);
  END IF;
END $$;
