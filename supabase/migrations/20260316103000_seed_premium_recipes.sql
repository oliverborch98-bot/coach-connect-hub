
-- Seed premium recipes for The Build Method
INSERT INTO public.recipes (title, description, instructions, ingredients, prep_time_min, calories, protein_g, carbs_g, fat_g, tags)
VALUES 
(
  'Elite Protein Pancakes', 
  'Lækre og luftige proteinpandekager perfekte til en muskelopbyggende morgenmad.', 
  '1. Blend havregryn til mel.\n2. Bland proteinpulver, æg og mælk i.\n3. Steg på en slip-let pande ved middel varme.\n4. Server med friske bær.', 
  '[{"name": "Havregryn", "amount": "50g"}, {"name": "Whey Proteinpulver (Vanilje)", "amount": "30g"}, {"name": "Æggehvider", "amount": "100ml"}, {"name": "Bagepulver", "amount": "1 tsk"}]'::jsonb, 
  15, 450, 45, 35, 8, 
  '{Morgenmad, High Protein, Muskelopbygning}'
),
(
  'Build Method Power Bowl', 
  'En næringsrig bowl fyldt med sunde fedtstoffer og komplekse kulhydrater.', 
  '1. Kog quinoa efter anvisning.\n2. Steg kyllingebryst på panden.\n3. Snit grøntsagerne og anret i en skål.\n4. Top med avocado og dressing.', 
  '[{"name": "Kyllingebryst", "amount": "150g"}, {"name": "Quinoa", "amount": "60g"}, {"name": "Avocado", "amount": "1/2 stk"}, {"name": "Spinat", "amount": "1 håndfuld"}]'::jsonb, 
  20, 580, 52, 45, 18, 
  '{Frokost, Sunde Fedtstoffer, Energigivende}'
),
(
  'Zesty Lemon Salmon', 
  'Frisk laks med citron og asparges. Lavt kalorieindhold men høj på smag.', 
  '1. Forvarm ovnen til 200 grader.\n2. Placer laks og asparges på en bageplade.\n3. Pres citron over og krydr med salt/peber.\n4. Bag i 12-15 minutter.', 
  '[{"name": "Lakseside", "amount": "180g"}, {"name": "Asparges", "amount": "100g"}, {"name": "Citron", "amount": "1/2 stk"}, {"name": "Olivenolie", "amount": "1 tsk"}]'::jsonb, 
  25, 380, 38, 5, 22, 
  '{Aftensmad, Low Carb, Lean}'
),
(
  'Post-Workout Beef Stir-Fry', 
  'Hurtig og nem stir-fry med masser af grøntsager og mørt oksekød.', 
  '1. Skær oksekød i tynde strimler.\n2. Lynsteg kød og grøntsager i en wok.\n3. Tilsæt soja og ingefær.\n4. Server med ris (valgfrit).', 
  '[{"name": "Oksekød (mager)", "amount": "150g"}, {"name": "Broccoli", "amount": "100g"}, {"name": "Gulerødder", "amount": "2 stk"}, {"name": "Soja sauce", "amount": "2 spsk"}]'::jsonb, 
  15, 420, 42, 12, 14, 
  '{Post-workout, Hurtig mad, Grøntsager}'
);
