CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns safely if they don't exist
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_groups text[] DEFAULT '{}'::text[];
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions text[] DEFAULT '{}'::text[];
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS tips text[] DEFAULT '{}'::text[];

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can insert exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (is_coach());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can update exercises" ON public.exercises FOR UPDATE TO authenticated USING (is_coach()) WITH CHECK (is_coach());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can delete exercises" ON public.exercises FOR DELETE TO authenticated USING (is_coach());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed data skipped (table already exists with existing schema)
-- To add exercises, use the coach interface in the platform
-- INSERT INTO public.exercises ... (disabled to avoid type conflicts)

/* DISABLED SEED DATA
-- Bryst (Breast) 1-10
('Bænkpres', 'Klassisk styrkeløft øvelse der primært træner bryst, skuldre og triceps.', ARRAY['Bryst', 'Skuldre', 'Triceps'], 'Vægtstang', 'Letøvet', ARRAY['Læg dig fladt på bænken', 'Tag fat i stangen', 'Sænk stangen til brystet', 'Pres stangen op'], ARRAY['Hold spændet i cored', 'Hold albuerne let indad']),
('Incline Bænkpres', 'Bænkpres udført på en skrå bænk for at ramme det øvre bryst.', ARRAY['Bryst', 'Skuldre', 'Triceps'], 'Vægtstang', 'Letøvet', ARRAY['Indstil bænken til 30-45 grader', 'Tag fat i stangen', 'Sænk til øvre bryst', 'Pres opad'], ARRAY['Undgå at sveje for meget i lænden']),
('Dumbbell Press', 'Bænkpres med håndvægte, tillader større bevægelsesfrihed.', ARRAY['Bryst', 'Skuldre', 'Triceps'], 'Håndvægte', 'Begynder', ARRAY['Læg dig fladt på bænken med en håndvægt i hver hånd', 'Pres vægtene op', 'Sænk kontrolleret'], ARRAY['Hold vægtene balancerede']),
('Incline Dumbbell Press', 'Træner øvre del af brystet.', ARRAY['Bryst', 'Skuldre', 'Triceps'], 'Håndvægte', 'Begynder', ARRAY['Indstil bænken til skrå', 'Pres håndvægtene op over brystet', 'Sænk dem kontrolleret'], ARRAY['Skub brystkassen fremad']),
('Push-ups', 'Klassisk kropsvægtsøvelse for overkroppen.', ARRAY['Bryst', 'Skuldre', 'Triceps', 'Core'], 'Kropsvægt', 'Begynder', ARRAY['Placer hænderne lidt bredere end skulderbredde', 'Hold kroppen lige', 'Sænk brystet mod gulvet', 'Pres op'], ARRAY['Undgå at hofterne hænger']),
('Dips', 'God øvelse for den nedre del af brystet og triceps.', ARRAY['Bryst', 'Triceps', 'Skuldre'], 'Kropsvægt', 'Øvet', ARRAY['Støt i stativet', 'Sænk dig indtil overarmene er parallelle med gulvet', 'Pres op'], ARRAY['Hæld lidt fremover for at fokusere på brystet']),
('Cable Crossovers', 'Isolationsøvelse for brystmuskulaturen.', ARRAY['Bryst'], 'Kabler', 'Letøvet', ARRAY['Stil dig midt i kabeltårnet', 'Træk kablerne frem og saml dem foran brystet', 'Sænk tilbage kontrolleret'], ARRAY['Fokuser på at klemme brystmusklerne sammen']),
('Pec Deck', 'Maskinøvelse for brystmusklen.', ARRAY['Bryst'], 'Maskine', 'Begynder', ARRAY['Sæt dig i maskinen med ryggen fladt', 'Før armene sammen', 'Gå kontrolleret tilbage'], ARRAY['Hold skuldrene nede og tilbage']),
('Dumbbell Flyes', 'Isolationsøvelse med håndvægte for at strække brystet.', ARRAY['Bryst'], 'Håndvægte', 'Letøvet', ARRAY['Læg dig på bænken', 'Sænk armene ud til siden med let bøjede albuer', 'Saml dem igen oppe over brystet'], ARRAY['Gå kun så langt ned, som det føles behageligt for skuldrene']),
('Machine Chest Press', 'Brystpres i maskine til begyndere.', ARRAY['Bryst', 'Skuldre', 'Triceps'], 'Maskine', 'Begynder', ARRAY['Juster sædet', 'Pres håndtagene fremad', 'Før dem tilbage kontrolleret'], ARRAY['Hold spænd i core og ryg']),

-- Ryg (Back) 11-20
('Deadlift (Dødløft)', 'Kongebænkøvelse for hele bagsiden af kroppen.', ARRAY['Ryg', 'Baglår', 'Glutes', 'Core'], 'Vægtstang', 'Øvet', ARRAY['Stå i skulderbredde', 'Grib stangen', 'Hold ryggen ret', 'Rejs dig op med vægten', 'Sænk kontrolleret'], ARRAY['Hold stangen tæt ind til benene', 'Spænd i maven']),
('Pull-ups', 'Effektiv øvelse til at bygge bredde på ryggen.', ARRAY['Ryg', 'Biceps'], 'Kropsvægt', 'Øvet', ARRAY['Grib fat i baren med bredt greb', 'Træk dig op til brystet', 'Sænk dig kontrolleret ned'], ARRAY['Fokuser på at trække med albuerne nedad']),
('Chin-ups', 'Ligner pull-ups men med underhåndsgreb.', ARRAY['Ryg', 'Biceps'], 'Kropsvægt', 'Letøvet', ARRAY['Grib baren med håndfladerne mod dig selv', 'Træk dig op', 'Sænk kontrolleret nede'], ARRAY['Husk at trække skulderbladene sammen']),
('Bent Over Rows (Barbell)', 'Masseopbyggende rygøvelse.', ARRAY['Ryg', 'Biceps', 'Lænd'], 'Vægtstang', 'Letøvet', ARRAY['Bøj forover til ca. 45 grader', 'Hold stangen fremfor dig', 'Træk den op til navlen', 'Sænk igen'], ARRAY['Hold ryggen helt ret']),
('Dumbbell Rows', 'En-arms ro-øvelse med håndvægt.', ARRAY['Ryg', 'Biceps'], 'Håndvægte', 'Begynder', ARRAY['Støt knæ og hånd på en bænk', 'Hold ryggen lige', 'Træk vægten op mod hoften', 'Sænk ned'], ARRAY['Fokuser på spændet i øvre ryg']),
('Lat Pulldown', 'God maskinøvelse for lats.', ARRAY['Ryg', 'Biceps'], 'Maskine', 'Begynder', ARRAY['Sæt dig i maskinen med knæene låst fast', 'Træk stangen ned til øvre bryst', 'Giv langsomt efter tilbage'], ARRAY['Læn dig kun en lille smule tilbage']),
('Seated Cable Row', 'Ro-øvelse i kabeltårn.', ARRAY['Ryg', 'Biceps'], 'Kabler', 'Begynder', ARRAY['Sæt dig på maskinen med let bøjede knæ', 'Hold ryggen ret', 'Træk håndtaget ind til maven', 'Før kontrolleret frem'], ARRAY['Lad ikke skuldrene runde frem']),
('T-Bar Rows', 'Ro-øvelse med T-bar.', ARRAY['Ryg', 'Biceps'], 'Vægtstang', 'Letøvet', ARRAY['Brug V-greb eller maskine til T-bar', 'Hold ryggen lige og bøj fremover', 'Træk til brystkassen', 'Sænk kontrolleret'], ARRAY['Hold rygsøjlen neutral']),
('Face Pulls', 'God øvelse for bagside skulder og øvre ryg.', ARRAY['Skuldre', 'Ryg'], 'Kabler', 'Begynder', ARRAY['Monter et reb i kabeltårnet i hovedhøjde', 'Træk rebet mod dit ansigt', 'Split hænderne når rebet er tæt på ansigtet'], ARRAY['Hold albuerne højt']),
('Straight Arm Pulldown', 'Isolationsøvelse for lats.', ARRAY['Ryg'], 'Kabler', 'Letøvet', ARRAY['Grib stangen med strakte arme', 'Pres stangen ned mod lårene', 'Returner til start'], ARRAY['Undgå at bruge triceps']),

-- Ben og Baller (Legs and Glutes) 21-32
('Squat', 'Den fundamentale benøvelse for styrke og muskelvækst.', ARRAY['Forlår', 'Baglår', 'Glutes', 'Core'], 'Vægtstang', 'Letøvet', ARRAY['Placer stangen på nakken/skuldrene', 'Gå ned i hugsiddende position', 'Hold knæene i retning af tæerne', 'Pres op igen'], ARRAY['Hold brystet oppe', 'Gå mindst ned til parallel']),
('Front Squat', 'Squat med vægten foran, fokuserer mere på forlår og core.', ARRAY['Forlår', 'Core'], 'Vægtstang', 'Øvet', ARRAY['Placer stangen foran på skuldrene', 'Hold albuerne oppe', 'Sæt dig ned i knæ', 'Pres op'], ARRAY['Hold overkroppen meget opret']),
('Leg Press', 'Maskinbaseret presseøvelse til benene.', ARRAY['Forlår', 'Baglår', 'Glutes'], 'Maskine', 'Begynder', ARRAY['Placer fødderne på pladen', 'Sænk pladen mod dig til 90 grader', 'Pres pladen væk igen'], ARRAY['Undgå at låse knæene helt ud']),
('Lunges (Dumbbell)', 'God unilateral benøvelse for balance og muskelvækst.', ARRAY['Forlår', 'Glutes', 'Baglår'], 'Håndvægte', 'Letøvet', ARRAY['Træd et stort skridt frem', 'Sænk bageste knæ mod gulvet', 'Pres tilbage til start'], ARRAY['Hold overkroppen ret']),
('Bulgarian Split Squat', 'Enbens squat med bagerste fod hævet.', ARRAY['Forlår', 'Glutes'], 'Håndvægte', 'Øvet', ARRAY['Placer bageste fod på en bænk', 'Hold en håndvægt i hver hånd', 'Gå ned i knæ til forreste lår er parallelt', 'Skub op'], ARRAY['Læg vægten på den forreste hæl']),
('Romanian Deadlift (RDL)', 'Dødløft med let bøjet knæ, der fokuserer på baglår og baller.', ARRAY['Baglår', 'Glutes', 'Lænd'], 'Vægtstang', 'Letøvet', ARRAY['Stå ret op med stangen', 'Bøj let i knæene', 'Skub hoften bagud og glid ned langs benene', 'Spænd op i ballerne på toppen'], ARRAY['Hold ryggen i en neutral position']),
('Leg Extension', 'Isolationsøvelse i maskine til forlår.', ARRAY['Forlår'], 'Maskine', 'Begynder', ARRAY['Sæt dig i maskinen og placer puden over anklen', 'Stræk benene helt ud', 'Sænk vægten kontrolleret'], ARRAY['Hold overkroppen stille']),
('Leg Curl (Seated)', 'Siddende maskinøvelse til baglår.', ARRAY['Baglår'], 'Maskine', 'Begynder', ARRAY['Juster maskinen', 'Bøj i knæet og træk puden ind under dig', 'Før benene op kontrolleret'], ARRAY['Træk maskinen helt i bund']),
('Leg Curl (Lying)', 'Liggende maskinøvelse til baglår.', ARRAY['Baglår'], 'Maskine', 'Begynder', ARRAY['Læg dig på maven', 'Placer puden over anklen', 'Bøj i knæet for at trække hælene mod numsen', 'Før kontrolleret tilbage'], ARRAY['Hold hoften i bænken']),
('Hip Thrust', 'Den bedste øvelse dedikeret til glutes.', ARRAY['Glutes', 'Baglår'], 'Vægtstang', 'Letøvet', ARRAY['Placer øvre ryg på en bænk', 'Læg vægtstangen over hoften', 'Sænk hoften og pres derefter op', 'Spænd i numsen i toppen'], ARRAY['Brug en pude eller måtte på stangen']),
('Calf Raises (Standing)', 'Stående lægøvelse med vægt.', ARRAY['Lægge'], 'Maskine', 'Begynder', ARRAY['Stil dig på kanten i maskinen', 'Stræk ankelen helt op', 'Sænk ned for et stræk', 'Stræk op igen'], ARRAY['Stop et sekund i bunden og toppen']),
('Calf Raises (Seated)', 'Siddende lægtræning.', ARRAY['Lægge'], 'Maskine', 'Begynder', ARRAY['Sæt dig med pude over knæene', 'Løft hælene', 'Sænk for stræk'], ARRAY['Fokuser kun på bevægelse i anklen']),

-- Skuldre (Shoulders) 33-39
('Overhead Press (Barbell)', 'Militær pres - bygger skuldre og triceps masse.', ARRAY['Skuldre', 'Triceps', 'Core'], 'Vægtstang', 'Letøvet', ARRAY['Stå ret med stangen foran på skuldrene', 'Pres stangen direkte op og tilbage over hovedet', 'Sænk tilbage til kravebenet'], ARRAY['Stram i mave og baller for ikke at sveje i lænden']),
('Dumbbell Shoulder Press', 'Skulderpres med håndvægte, oftest siddende.', ARRAY['Skuldre', 'Triceps'], 'Håndvægte', 'Begynder', ARRAY['Sid på en bænk med rygstød', 'Pres vægtene op over hovedet', 'Sænk vægtene ned til ørehøjde'], ARRAY['Hold håndleddene lige']),
('Lateral Raises', 'Vingesus til skuldrene.', ARRAY['Skuldre'], 'Håndvægte', 'Begynder', ARRAY['Stå ret med let bøjede arme', 'Løft armene ud til siden til skulderhøjde', 'Sænk langsomt'], ARRAY['Forehold lillefingersiden lidt højere (som at hælde vand af en kande)']),
('Cable Lateral Raises', 'Vingesus i kabeltårn.', ARRAY['Skuldre'], 'Kabler', 'Begynder', ARRAY['Træk kablet fra bunden', 'Løft armen ud til siden til skulderhøjde', 'Sænk kontrolleret ned'], ARRAY['Fokuser på en langsom excentrisk fase']),
('Front Raises', 'Frontløft for forreste skuldermuskel.', ARRAY['Skuldre'], 'Håndvægte', 'Begynder', ARRAY['Stå ret med vægte i hænderne foran låret', 'Løft en arm (eller begge) op foran dig til øjenhøjde', 'Sænk langsomt'], ARRAY['Brug ikke momentum ryggen, hold fast core']),
('Reverse Pec Deck', 'Maskinøvelse for bagskulder.', ARRAY['Skuldre', 'Ryg'], 'Maskine', 'Begynder', ARRAY['Sæt dig med front mod maskinen', 'Pres armene tilbage og sammen', 'Vend langsomt tilbage'], ARRAY['Hold skuldrene helt nede under bevægelsen']),
('Upright Rows', 'Træk til hagen for primært skuldre og trapezius.', ARRAY['Skuldre', 'Ryg'], 'Vægtstang', 'Letøvet', ARRAY['Stå ret med stangen', 'Træk stangen op langs kroppen', 'Før albuerne så højt du kan opad', 'Sænk kontrolleret nede'], ARRAY['Hold stangen tæt på kroppen']),

-- Arme (Biceps/Triceps/Underarme) 40-46
('Barbell Curl', 'Klassisk massisk biceps øvelse.', ARRAY['Biceps'], 'Vægtstang', 'Begynder', ARRAY['Stå ret og grib stangen i underhåndsgreb', 'Bøj armene og træk stangen op', 'Sænk langsomt ned'], ARRAY['Hold albuerne låst inde ved siden']),
('Dumbbell Curl', 'Biceps øvelse med enkle håndvægte.', ARRAY['Biceps'], 'Håndvægte', 'Begynder', ARRAY['Stå ret med en vægt i hver hånd', 'Sving håndfladen op og træk overarmen i en fuld bøjning', 'Sænk ned'], ARRAY['Ingen sving med kroppen']),
('Hammer Curls', 'Træner underarms-siden af biceps.', ARRAY['Biceps', 'Underarme'], 'Håndvægte', 'Begynder', ARRAY['Hold håndvægtene i et neutral greb', 'Fold armene og træk opad som at bruge en hammer', 'Sænk ned og gentag'], ARRAY['En god øvelse for variation til grebet']),
('Preacher Curls', 'Isolationsøvelse for biceps for maximal fokus på top-kontraktion.', ARRAY['Biceps'], 'EZ bar', 'Letøvet', ARRAY['Læn dig over Preacher bænken', 'Sænk stangen og lad armene rette op', 'Træk opad for maksimumspænding'], ARRAY['Undlad at overstrække i bunden hvis du er utrænet']),
('Tricep Pushdown (Rope)', 'En af de mest populære maskinøvelser til triceps.', ARRAY['Triceps'], 'Kabler', 'Begynder', ARRAY['Hold om rebet i kabeltårnet', 'Pres hænderne ned', 'Skil rebet lidt nede i bunden', 'Lad kablet føre op kontrolleret'], ARRAY['Hold overarmen lodret under hele øvelsen']),
('Skull Crushers', 'Liggende triceps extension for masse.', ARRAY['Triceps'], 'EZ bar', 'Letøvet', ARRAY['Læg dig på en bænk', 'Hold stangen over dig', 'Bøj kun albuerne og sænk stangen mod panden', 'Pres stangen tilbage til udstrakt arms'], ARRAY['Giv slip hvis der er for meget vægt over hovedet']),
('Overhead Tricep Extension', 'Isolationsøvelse som strækker triceps fuldt.', ARRAY['Triceps'], 'Håndvægte', 'Begynder', ARRAY['Sæt/Stå med en enkelt håndvægt baghovedet holdt af to arme', 'Stræk armene lodret op over hoved', 'Sænk den bagved ud af syne'], ARRAY['Hold albuerne til at pege ligefrem fremad og ikke til siden']),

-- Core & Mave (Abs/Core) 47-50
('Planken (Plank)', 'Isometrisk stabiliserende øvelse for kernemusklerne.', ARRAY['Core'], 'Kropsvægt', 'Begynder', ARRAY['Læg dig med underarmene og tæerne på jorden', 'Lift hoften, så kroppen er en lige linie fra hoved til hæle', 'Spænd fast i mave og balder'], ARRAY['Træk vejret og hold ikke åndedrættet, giv ikke mave for meget ned i et svaj']),
('Crunches', 'Dynamisk coreøvelse primært til at arbejde med det øverste part.', ARRAY['Core'], 'Kropsvægt', 'Begynder', ARRAY['Lig på ryggen med fødderne på gulvet', 'Lift langsomt din overkrop til hævning', 'Sænk igen langsomt'], ARRAY['Ikke trække mod nakken i nakke pres, brug maven']),
('Leg Raises (Lying)', 'Maveøvelse specielt for nedre rectus abdominis.', ARRAY['Core'], 'Kropsvægt', 'Begynder', ARRAY['Læg dig fladt på ryggen', 'Hold benene strakte', 'Løft benene opad til hoften er ved at slippe jorden', 'Sænk dem langsomt (helst uden at røre gulvet)'], ARRAY['For ekstra stabilitet - læg hænderne under balderne']),
('Russian Twists', 'Arbejder med core rotation for skrå mavemuskler.', ARRAY['Core'], 'Håndvægte', 'Begynder', ARRAY['Sid på en måtte og læn dig 45 grader tilbage', 'Hold en vægtskive eller lignende foran brystet', 'Roter overkroppen fra side til side', 'Rør gulvet med vægten eller hænderne i hver side'], ARRAY['Spænd core konstant'])
) AS v(name, description, muscle_groups, equipment, difficulty, instructions, tips)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises LIMIT 1);
*/
