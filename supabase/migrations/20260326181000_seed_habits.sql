-- Seed example habits for existing coaches
DO $$
DECLARE
    coach_record RECORD;
    habit_id uuid;
BEGIN
    FOR coach_record IN SELECT id FROM public.profiles WHERE role = 'coach' LOOP
        -- Habit 1
        INSERT INTO public.habits (coach_id, name, description, frequency, icon)
        VALUES (coach_record.id, 'Drik 3L vand', 'Sørg for at være hydreret hele dagen', 'daily', '💧')
        ON CONFLICT DO NOTHING;

        -- Habit 2
        INSERT INTO public.habits (coach_id, name, description, frequency, icon)
        VALUES (coach_record.id, 'Sov 8 timer', 'Prioriter din søvn for optimal restitution', 'daily', '😴')
        ON CONFLICT DO NOTHING;

        -- Habit 3
        INSERT INTO public.habits (coach_id, name, description, frequency, icon)
        VALUES (coach_record.id, '10.000 skridt', 'Daglige skridt for at holde dig aktiv', 'daily', '🚶‍♂️')
        ON CONFLICT DO NOTHING;

        -- Habit 4
        INSERT INTO public.habits (coach_id, name, description, frequency, icon)
        VALUES (coach_record.id, 'Protein efter træning', 'Tag protein indenfor 30 min efter træning', 'daily', '🥩')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
