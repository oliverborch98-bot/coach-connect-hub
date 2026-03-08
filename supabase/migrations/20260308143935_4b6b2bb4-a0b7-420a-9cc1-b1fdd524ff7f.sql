
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify coach when client submits a check-in
CREATE OR REPLACE FUNCTION public.notify_checkin_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_name text;
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    SELECT cp.coach_id INTO v_coach_id FROM client_profiles cp WHERE cp.id = NEW.client_id;
    SELECT p.full_name INTO v_client_name FROM client_profiles cp JOIN profiles p ON p.id = cp.user_id WHERE cp.id = NEW.client_id;
    
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_coach_id, 'checkin', 'Ny check-in', COALESCE(v_client_name, 'Klient') || ' har indsendt check-in #' || NEW.checkin_number);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_checkin_submitted
AFTER UPDATE ON weekly_checkins
FOR EACH ROW EXECUTE FUNCTION notify_checkin_submitted();

-- Trigger: notify client when coach reviews check-in
CREATE OR REPLACE FUNCTION public.notify_checkin_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_client_user_id uuid;
BEGIN
  IF NEW.status = 'reviewed' AND (OLD.status IS NULL OR OLD.status != 'reviewed') THEN
    SELECT cp.user_id INTO v_client_user_id FROM client_profiles cp WHERE cp.id = NEW.client_id;
    
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_client_user_id, 'feedback', 'Ny feedback', 'Din coach har givet feedback på check-in #' || NEW.checkin_number);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_checkin_reviewed
AFTER UPDATE ON weekly_checkins
FOR EACH ROW EXECUTE FUNCTION notify_checkin_reviewed();

-- Trigger: notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_sender_name text;
BEGIN
  SELECT p.full_name INTO v_sender_name FROM profiles p WHERE p.id = NEW.sender_id;
  
  INSERT INTO notifications (user_id, type, title, body)
  VALUES (NEW.receiver_id, 'message', 'Ny besked', COALESCE(v_sender_name, 'Nogen') || ' har sendt dig en besked');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Trigger: notify client on payment failure
CREATE OR REPLACE FUNCTION public.notify_payment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_client_user_id uuid;
  v_coach_id uuid;
  v_client_name text;
BEGIN
  IF NEW.status = 'failed' THEN
    SELECT cp.user_id, cp.coach_id INTO v_client_user_id, v_coach_id FROM client_profiles cp WHERE cp.id = NEW.client_id;
    SELECT p.full_name INTO v_client_name FROM client_profiles cp JOIN profiles p ON p.id = cp.user_id WHERE cp.id = NEW.client_id;
    
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_client_user_id, 'payment', 'Betaling fejlet', 'Din seneste betaling kunne ikke gennemføres. Opdater din betalingsmetode.');
    
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_coach_id, 'payment', 'Betaling fejlet', COALESCE(v_client_name, 'Klient') || 's betaling er fejlet.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_event
AFTER INSERT ON payment_events
FOR EACH ROW EXECUTE FUNCTION notify_payment_event();
