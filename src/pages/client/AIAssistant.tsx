import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Utensils, Zap, Plus, Search, ChevronRight, X, Loader2, Dumbbell } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [parseText, setParseText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchMeal, setSearchMeal] = useState('');

  // Opskriftsgenerator state
  const [recipeProtein, setRecipeProtein] = useState('');
  const [recipeCarbs, setRecipeCarbs] = useState('');
  const [recipeFat, setRecipeFat] = useState('');
  const [recipeCalories, setRecipeCalories] = useState('');
  const [recipePreferences, setRecipePreferences] = useState('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeResult, setRecipeResult] = useState<any>(null);

  // Form state for logging meal
  const [logName, setLogName] = useState('');
  const [logCalories, setLogCalories] = useState('');
  const [logProtein, setLogProtein] = useState('');
  const [logCarbs, setLogCarbs] = useState('');
  const [logFat, setLogFat] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['my-client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs', profile?.id, new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('client_id', profile!.id)
        .eq('date', today);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const { data: latestPlanMeals = [] } = useQuery({
    queryKey: ['latest-nutrition-meals', profile?.id],
    queryFn: async () => {
      const { data: plans, error: planErr } = await supabase
        .from('nutrition_plans')
        .select('id')
        .eq('client_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (planErr || !plans || plans.length === 0) return [];

      const { data: meals, error: mealErr } = await supabase
        .from('meals')
        .select('*')
        .eq('plan_id', plans[0].id);

      if (mealErr) throw mealErr;
      return meals;
    },
    enabled: !!profile,
  });

  const handleParse = async () => {
    if (!parseText.trim() || !profile) return;
    setIsParsing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plan-parser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ textInput: parseText }),
      });

      if (!resp.ok) throw new Error('AI Parse Error');
      const parsed = await resp.json();

      // Gem Nutrition Plan
      if (parsed.nutrition) {
        const { data: plan, error: pErr } = await supabase.from('nutrition_plans').insert({
          client_id: profile.id,
          name: parsed.nutrition.planName || 'AI Kostplan',
          calories_target: parsed.nutrition.caloriesTarget || 2000,
          protein_g: parsed.nutrition.proteinG || 150,
          carbs_g: parsed.nutrition.carbsG || 200,
          fat_g: parsed.nutrition.fatG || 70,
        }).select().single();
        if (pErr) throw pErr;

        if (parsed.nutrition.meals && parsed.nutrition.meals.length > 0) {
          const mealsToInsert = parsed.nutrition.meals.map((m: any, i: number) => ({
            plan_id: plan.id,
            meal_name: m.mealName || `Måltid ${i+1}`,
            description: m.description || '',
            calories: m.calories || 0,
            protein_g: m.proteinG || 0,
            carbs_g: m.carbsG || 0,
            fat_g: m.fatG || 0,
            meal_order: i + 1,
          }));
          const { error: mErr } = await supabase.from('meals').insert(mealsToInsert);
          if (mErr) throw mErr;
        }

        // Opdater profilens makro mål hvis de er null
        await supabase.from('client_profiles').update({
          daily_calories_goal: parsed.nutrition.caloriesTarget,
          daily_protein_goal: parsed.nutrition.proteinG,
          daily_carbs_goal: parsed.nutrition.carbsG,
          daily_fat_goal: parsed.nutrition.fatG,
        }).eq('id', profile.id);
      }

      // Gem Træningsprogram
      if (parsed.training) {
        const { data: prog, error: pgErr } = await supabase.from('training_programs').insert({
          client_id: profile.id,
          name: parsed.training.programName || 'AI Træningsprogram',
        }).select().single();
        if (pgErr) throw pgErr;

        if (parsed.training.days) {
          for (let i = 0; i < parsed.training.days.length; i++) {
            const day = parsed.training.days[i];
            const { data: td, error: tdErr } = await supabase.from('training_days').insert({
              program_id: prog.id,
              day_name: day.dayName || `Dag ${i+1}`,
              day_order: i + 1,
            }).select().single();
            if (tdErr) throw tdErr;

            if (day.exercises) {
              for (let j = 0; j < day.exercises.length; j++) {
                const ex = day.exercises[j];
                // Check if exercise exists or create custom
                let exId = '';
                const { data: existingEx } = await supabase.from('exercises').select('id').ilike('name', ex.exerciseName).maybeSingle();
                if (existingEx) {
                  exId = existingEx.id;
                } else {
                  const { data: newEx } = await supabase.from('exercises').insert({
                    name: ex.exerciseName,
                    is_custom: true
                  }).select().single();
                  if (newEx) exId = newEx.id;
                }

                if (exId) {
                  await supabase.from('training_exercises').insert({
                    training_day_id: td.id,
                    exercise_id: exId,
                    exercise_order: j + 1,
                    sets: ex.sets || 3,
                    reps: ex.reps || '10',
                    notes: `${ex.weight ? 'Vægt: ' + ex.weight + '. ' : ''}${ex.notes || ''}`
                  });
                }
              }
            }
          }
        }
      }

      setParseText('');
      toast({ title: 'Succes', description: 'Din plan er nu tilføjet til platformen', variant: 'default' });
      queryClient.invalidateQueries({ queryKey: ['my-client-profile'] });
      queryClient.invalidateQueries({ queryKey: ['latest-nutrition-meals'] });

    } catch (e: any) {
      toast({ title: 'Fejl', description: e.message || 'Kunne ikke generere plan', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleLogMeal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('food_logs').insert({
        client_id: profile.id,
        date: today,
        meal_name: logName || 'Måltid',
        calories: parseInt(logCalories) || 0,
        protein: parseInt(logProtein) || 0,
        carbs: parseInt(logCarbs) || 0,
        fat: parseInt(logFat) || 0,
      });
      if (error) throw error;
      toast({ title: 'Logget', description: 'Måltid blev gemt' });
      setIsModalOpen(false);
      setLogName(''); setLogCalories(''); setLogProtein(''); setLogCarbs(''); setLogFat('');
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
    } catch (e: any) {
      toast({ title: 'Fejl', description: 'Kunne ikke logge måltid', variant: 'destructive' });
    }
  };

  const logMealFromPlan = async (m: any) => {
    setLogName(m.meal_name);
    setLogCalories(m.calories?.toString() || '0');
    setLogProtein(m.protein_g?.toString() || '0');
    setLogCarbs(m.carbs_g?.toString() || '0');
    setLogFat(m.fat_g?.toString() || '0');
    handleLogMeal();
  };

  const handleGenerateRecipe = async () => {
    if (!profile) return;
    setIsGeneratingRecipe(true);
    setRecipeResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recipe-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          protein: Number(recipeProtein) || 0,
          carbs: Number(recipeCarbs) || 0,
          fat: Number(recipeFat) || 0,
          calories: Number(recipeCalories) || 0,
          preferences: recipePreferences,
        }),
      });

      if (!resp.ok) throw new Error('Kunne ikke generere opskrift');
      const data = await resp.json();
      setRecipeResult(data);
    } catch (e: any) {
      toast({ title: 'Fejl', description: e.message || 'Kunne ikke generere opskrift', variant: 'destructive' });
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const goals = {
    calories: profile?.daily_calories_goal || 2500,
    protein: profile?.daily_protein_goal || 160,
    carbs: profile?.daily_carbs_goal || 250,
    fat: profile?.daily_fat_goal || 80,
  };

  const eaten = useMemo(() => {
    return foodLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodLogs]);

  const getStatusColor = (eatenAmt: number, goalAmt: number) => {
    if (goalAmt === 0) return '#0066FF';
    const pct = eatenAmt / goalAmt;
    if (pct < 0.8) return '#10B981'; // Green
    if (pct <= 1.0) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const MacroCircle = ({ title, eatenAmt, goalAmt, unit }: { title: string, eatenAmt: number, goalAmt: number, unit: string }) => {
    const data = [
      { name: 'Eaten', value: Math.min(eatenAmt, goalAmt), fill: getStatusColor(eatenAmt, goalAmt) },
      { name: 'Remaining', value: Math.max(goalAmt - eatenAmt, 0), fill: '#1F2937' },
    ];
    return (
      <div className="flex flex-col items-center p-4 glass-dark rounded-2xl relative">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{title}</h3>
        <div className="w-24 h-24 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={30}
                outerRadius={42}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={10}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white">{eatenAmt}</span>
            <span className="text-[9px] text-muted-foreground">/ {goalAmt}{unit}</span>
          </div>
        </div>
      </div>
    );
  };

  const guideText = useMemo(() => {
    const msgs = [];
    const calLeft = goals.calories - eaten.calories;
    if (calLeft > 0) {
      msgs.push({ text: `Du har ${calLeft} kcal tilbage i dag.`, color: 'text-green-400' });
    } else {
      msgs.push({ text: `Du har overskredet dit kaloriemål med ${Math.abs(calLeft)} kcal.`, color: 'text-red-400' });
    }

    const proLeft = goals.protein - eaten.protein;
    if (proLeft > 20) {
      msgs.push({ text: `Du mangler ${proLeft}g protein — spis fx kylling eller æg til dit næste måltid.`, color: 'text-yellow-400' });
    }

    const carbPct = goals.carbs > 0 ? eaten.carbs / goals.carbs : 0;
    if (carbPct > 0.8 && carbPct <= 1.0) {
      msgs.push({ text: `Du er ${(carbPct*100).toFixed(0)}% af dit kulhydratmål — pas på med brød/ris til aftensmad.`, color: 'text-yellow-400' });
    } else if (carbPct > 1.0) {
      msgs.push({ text: `Du har spist for mange kulhydrater i dag.`, color: 'text-red-400' });
    }

    return msgs;
  }, [goals, eaten]);

  const filteredMeals = latestPlanMeals.filter(m => m.meal_name.toLowerCase().includes(searchMeal.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="glass-dark rounded-[24px] p-6 text-center border overflow-hidden relative border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 glow-royal-blue">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2">Smart AI Assistent</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Parse planer & Track Makroer</p>
        </div>
      </div>

      <div className="glass-dark p-6 rounded-[24px] border border-white/5">
        <h2 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Plan Parser
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Indsæt en trænings- eller kostplan som tekst, og AI'en oversætter den og gemmer den direkte på din profil.
        </p>
        <textarea
          value={parseText}
          onChange={e => setParseText(e.target.value)}
          placeholder="Indsæt din plan her..."
          className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors mb-4"
        />
        <button
          onClick={handleParse}
          disabled={isParsing || !parseText.trim()}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold tracking-widest uppercase text-sm disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {isParsing ? 'Genererer...' : 'Generer plan'}
        </button>
      </div>

      {/* OPSKRIFTSGENERATOR */}
      <div className="glass-dark p-6 rounded-[24px] border border-white/5">
        <h2 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          AI Opskriftsgenerator
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Få en skræddersyet opskrift der rammer dine makroer præcist.
        </p>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={recipeProtein} onChange={e => setRecipeProtein(e.target.value)} placeholder="Protein (g)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
            <input type="number" value={recipeCarbs} onChange={e => setRecipeCarbs(e.target.value)} placeholder="Kulhydrat (g)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
            <input type="number" value={recipeFat} onChange={e => setRecipeFat(e.target.value)} placeholder="Fedt (g)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
            <input type="number" value={recipeCalories} onChange={e => setRecipeCalories(e.target.value)} placeholder="Kalorier (kcal)" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
          </div>
          <input type="text" value={recipePreferences} onChange={e => setRecipePreferences(e.target.value)} placeholder="Valgfrit: 'Ingen nødder', 'Vegansk'..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
        </div>

        {!recipeResult ? (
          <button
            onClick={handleGenerateRecipe}
            disabled={isGeneratingRecipe || (!recipeProtein && !recipeCarbs && !recipeFat && !recipeCalories)}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold tracking-widest uppercase text-sm disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {isGeneratingRecipe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {isGeneratingRecipe ? 'Tænker...' : 'Generer opskrift'}
          </button>
        ) : (
          <div className="bg-black/40 border border-white/10 rounded-[20px] p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h3 className="text-xl font-black text-white">{recipeResult.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 font-bold">{recipeResult.prepTime}</p>
            </div>

            <div className="flex justify-center gap-4 text-center border-y border-white/5 py-3">
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-widest font-bold">PRO</span>
                <span className="text-sm font-black text-white">{recipeResult.macros?.protein}g</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-widest font-bold">KUL</span>
                <span className="text-sm font-black text-white">{recipeResult.macros?.carbs}g</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-widest font-bold">FEDT</span>
                <span className="text-sm font-black text-white">{recipeResult.macros?.fat}g</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-widest font-bold">KCAL</span>
                <span className="text-sm font-black text-white">{recipeResult.macros?.calories}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ingredienser</h4>
              <ul className="space-y-2">
                {recipeResult.ingredients?.map((ing: any, i: number) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    <span className="text-white">{ing.name}</span>
                    <span className="text-muted-foreground font-bold">{ing.amount} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Fremgangsmåde</h4>
              <div className="space-y-3">
                {recipeResult.instructions?.map((step: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    <p className="text-white/90 pt-0.5 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateRecipe}
              disabled={isGeneratingRecipe}
              className="w-full py-3 bg-white/5 text-white font-bold tracking-widest uppercase rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm mt-4"
            >
              {isGeneratingRecipe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isGeneratingRecipe ? 'Genererer...' : 'Generer en ny'}
            </button>
          </div>
        )}
      </div>

      <div className="glass-dark p-6 rounded-[24px] border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Daglig Makro Tæller
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg text-xs font-bold tracking-widest uppercase"
          >
            <Plus className="h-3 w-3" /> Log Måltid
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MacroCircle title="Protein" eatenAmt={eaten.protein} goalAmt={goals.protein} unit="g" />
          <MacroCircle title="Kulhydrat" eatenAmt={eaten.carbs} goalAmt={goals.carbs} unit="g" />
          <MacroCircle title="Fedt" eatenAmt={eaten.fat} goalAmt={goals.fat} unit="g" />
          <MacroCircle title="Kalorier" eatenAmt={eaten.calories} goalAmt={goals.calories} unit="k" />
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Bot className="h-3 w-3" /> Smart Daglig Guide
          </h3>
          {guideText.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.color} flex items-start gap-2`}>
              <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
              <span>{msg.text}</span>
            </div>
          ))}
          {guideText.length === 0 && (
            <p className="text-sm text-green-400">Du er helt på sporet med dine makroer!</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#09090B] border border-white/10 p-6 rounded-[24px] w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter">Log Måltid</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-xl text-muted-foreground hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                {latestPlanMeals.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Søg fra kostplan</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input type="text" value={searchMeal} onChange={e => setSearchMeal(e.target.value)} placeholder="Søg måltid..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    {searchMeal && filteredMeals.length > 0 && (
                      <div className="bg-black/50 border border-white/10 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
                        {filteredMeals.map(m => (
                          <button key={m.id} onClick={() => { logMealFromPlan(m); setSearchMeal(''); }} className="w-full text-left p-2 hover:bg-white/5 rounded-lg text-sm flex justify-between items-center">
                            <span>{m.meal_name}</span>
                            <span className="text-xs text-muted-foreground">{m.calories} kcal</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-muted-foreground font-bold uppercase">Eller manuelt</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  
                  <form onSubmit={handleLogMeal} className="space-y-4">
                    <input type="text" required value={logName} onChange={e => setLogName(e.target.value)} placeholder="Måltidsnavn" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" required value={logCalories} onChange={e => setLogCalories(e.target.value)} placeholder="Kalorier (kcal)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                      <input type="number" required value={logProtein} onChange={e => setLogProtein(e.target.value)} placeholder="Protein (g)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                      <input type="number" required value={logCarbs} onChange={e => setLogCarbs(e.target.value)} placeholder="Kulhydrat (g)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                      <input type="number" required value={logFat} onChange={e => setLogFat(e.target.value)} placeholder="Fedt (g)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white font-bold tracking-widest uppercase rounded-xl hover:bg-primary/90 mt-2">
                      Gem Måltid
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
