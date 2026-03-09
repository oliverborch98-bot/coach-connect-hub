
CREATE OR REPLACE FUNCTION public.notify_new_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
BEGIN
  SELECT id INTO v_coach_id FROM profiles WHERE role = 'coach' LIMIT 1;
  
  IF v_coach_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_coach_id, 'checkin', 'Ny adgangsanmodning', NEW.name || ' har anmodet om adgang (' || NEW.email || ')');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_access_request_inserted
  AFTER INSERT ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_access_request();
