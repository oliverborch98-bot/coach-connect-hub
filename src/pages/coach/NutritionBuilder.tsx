import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, Save, UtensilsCrossed, Sparkles, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealDraft {
  id: string;
  meal_name: string;
  description: string;
  calories: number | '';
  protein_g: number | '';
  carbs_g: number | '';
  fat_g: number | '';
  recipe_id: string | null;
}

const emptyMeal = (order: number): MealDraft => ({
  id: crypto.randomUUID(),
  meal_name: `Måltid ${order + 1}`,
  description: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  recipe_id: null,
});

export default function NutritionBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const editId = searchParams.get('edit');
  const qc = useQueryClient();

  const [clientId, setClientId] = useState(preselectedClient);
  const [planName, setPlanName] = useState('');
  const [phase, setPhase] = useState('foundation');
  const [isTemplate, setIsTemplate] = useState(false);
  const [caloriesTarget, setCaloriesTarget] = useState<number | ''>('');
  const [proteinG, setProteinG] = useState<number | ''>('');
  const [carbsG, setCarbsG] = useState<number | ''>('');
  const [fatG, setFatG] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [meals, setMeals] = useState<MealDraft[]>([emptyMeal(0)]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  // Load existing plan for editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: plan } = await supabase.from('nutrition_plans').select('*').eq('id', editId).single();
      if (!plan) { toast.error('Plan ikke fundet'); navigate(-1); return; }
      setPlanName(plan.name);
      setPhase(plan.phase ?? 'foundation');
      setClientId(plan.client_id ?? '');
      setIsTemplate(plan.is_template ?? false);
      setCaloriesTarget(plan.calories_target ?? '');
      setProteinG(plan.protein_g ?? '');
      setCarbsG(plan.carbs_g ?? '');
      setFatG(plan.fat_g ?? '');
      setNotes(plan.notes ?? '');

      const { data: dbMeals } = await supabase.from('meals').select('*').eq('plan_id', editId).order('meal_order');
      if (dbMeals && dbMeals.length > 0) {
        setMeals(dbMeals.map(m => ({
          id: m.id,
          meal_name: m.meal_name,
          description: m.description ?? '',
          calories: m.calories ?? '',
          protein_g: m.protein_g ?? '',
          carbs_g: m.carbs_g ?? '',
          fat_g: m.fat_g ?? '',
          recipe_id: m.recipe_id ?? null,
        })));
      }
      setLoaded(true);
    })();
  }, [editId]);

  const generateWithAI = async () => {
    if (!clientId) { toast.error('Vælg en klient først'); return; }
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId, mealsCount: meals.length || 4, goal: '' }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || 'AI fejl'); }
      const plan = await resp.json();
      setPlanName(plan.planName ?? planName);
      setCaloriesTarget(plan.caloriesTarget ?? '');
      setProteinG(plan.proteinG ?? '');
      setCarbsG(plan.carbsG ?? '');
      setFatG(plan.fatG ?? '');
      setNotes(plan.notes ?? '');
      if (plan.meals?.length) {
        setMeals(plan.meals.map((m: any, i: number) => ({
          id: crypto.randomUUID(),
          meal_name: m.mealName ?? `Måltid ${i + 1}`,
          description: m.description ?? '',
          calories: m.calories ?? '',
          protein_g: m.proteinG ?? '',
          carbs_g: m.carbsG ?? '',
          fat_g: m.fatG ?? '',
          recipe_id: null,
        })));
      }
      toast.success('AI-kostplan genereret! Gennemgå og gem.');
    } catch (e: any) { toast.error(e.message); }
    setAiLoading(false);
  };

  const { data: clients = [] } = useQuery({
    queryKey: ['coach-clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_profiles').select('id, profiles!client_profiles_user_id_fkey(full_name)').eq('status', 'active');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select('id, title, calories, protein_g, carbs_g, fat_g').order('title');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clientId && !isTemplate) throw new Error('Vælg en klient eller markér som skabelon');
      if (!planName.trim()) throw new Error('Angiv plannavn');

      const planData = {
        client_id: isTemplate ? null : clientId,
        name: planName,
        phase: phase || null,
        calories_target: caloriesTarget || null,
        protein_g: proteinG || null,
        carbs_g: carbsG || null,
        fat_g: fatG || null,
        notes: notes || null,
        meals_per_day: meals.length,
        is_template: isTemplate,
      };

      if (editId) {
        await supabase.from('nutrition_plans').update({ ...planData, status: 'active' }).eq('id', editId);
        await supabase.from('meals').delete().eq('plan_id', editId);
        const mealInserts = meals.map((m, i) => ({
          plan_id: editId, meal_name: m.meal_name, meal_order: i,
          description: m.description || null, calories: m.calories || null,
          protein_g: m.protein_g || null, carbs_g: m.carbs_g || null, fat_g: m.fat_g || null,
          recipe_id: m.recipe_id || null,
        }));
        if (mealInserts.length > 0) {
          const { error: mErr } = await supabase.from('meals').insert(mealInserts);
          if (mErr) throw mErr;
        }
      } else {
        const { data: plan, error: pErr } = await supabase.from('nutrition_plans').insert({ ...planData, status: 'active' }).select('id').single();
        if (pErr) throw pErr;
        const mealInserts = meals.map((m, i) => ({
          plan_id: plan.id, meal_name: m.meal_name, meal_order: i,
          description: m.description || null, calories: m.calories || null,
          protein_g: m.protein_g || null, carbs_g: m.carbs_g || null, fat_g: m.fat_g || null,
          recipe_id: m.recipe_id || null,
        }));
        if (mealInserts.length > 0) {
          const { error: mErr } = await supabase.from('meals').insert(mealInserts);
          if (mErr) throw mErr;
        }
      }
    },
    onSuccess: () => {
      toast.success(editId ? 'Kostplan opdateret!' : 'Kostplan oprettet!');
      qc.invalidateQueries({ queryKey: ['coach-clients-list'] });
      qc.invalidateQueries({ queryKey: ['coach-client-nutrition'] });
      navigate(clientId ? `/coach/client/${clientId}` : '/coach');
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved oprettelse'),
  });

  const totalCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein_g) || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs_g) || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (Number(m.fat_g) || 0), 0);

  const setClientGoalsMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Vælg en klient først');
      const { error } = await supabase.from('client_profiles').update({
        daily_calories_goal: totalCalories || null,
        daily_protein_goal: totalProtein || null,
        daily_carbs_goal: totalCarbs || null,
        daily_fat_goal: totalFat || null,
      } as any).eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Klientmål opdateret med summen fra måltiderne!');
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved opdatering af mål'),
  });

  const addMeal = () => setMeals(prev => [...prev, emptyMeal(prev.length)]);
  const removeMeal = (id: string) => setMeals(prev => prev.filter(m => m.id !== id));
  const updateMeal = (id: string, field: string, value: any) =>
    setMeals(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{editId ? 'Redigér Kostplan' : 'Ny Kostplan'}</h1>
            <p className="text-sm text-muted-foreground">{editId ? 'Opdatér kostplanen' : 'Opret makromål og måltider til en klient'}</p>
          </div>
        </div>
        <button onClick={generateWithAI} disabled={aiLoading || !clientId}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {aiLoading ? 'Genererer...' : 'Generér med AI'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Klient</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} disabled={isTemplate}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50">
            <option value="">Vælg klient...</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.profiles?.full_name ?? 'Ukendt'}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Plannavn</label>
          <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="F.eks. Bulking Plan"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Fase</label>
          <select value={phase} onChange={e => setPhase(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="foundation">Foundation</option>
            <option value="acceleration">Acceleration</option>
            <option value="transformation">Transformation</option>
          </select>
        </div>
        <div className="md:col-span-3 flex items-center gap-2">
          <input type="checkbox" id="is-template-n" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)}
            className="rounded border-border" />
          <label htmlFor="is-template-n" className="text-xs text-muted-foreground">Gem som skabelon (template)</label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-primary" /> Daglige makromål
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Kalorier', value: caloriesTarget, set: setCaloriesTarget, ph: '2400' },
            { label: 'Protein (g)', value: proteinG, set: setProteinG, ph: '180' },
            { label: 'Kulhydrater (g)', value: carbsG, set: setCarbsG, ph: '280' },
            { label: 'Fedt (g)', value: fatG, set: setFatG, ph: '70' },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</label>
              <input type="number" value={f.value} onChange={e => f.set(e.target.value ? Number(e.target.value) : '')} placeholder={f.ph}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-center" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Noter</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Evt. noter til klienten..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Måltider</h3>
          <div className="flex items-center gap-3 text-xs bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl shadow-inner">
            <div className="font-medium"><span className="text-zinc-400">Sum Kcal:</span> <span className="text-amber-500">{totalCalories}</span></div>
            <div className="font-medium"><span className="text-zinc-400">P:</span> <span className="text-white">{totalProtein}g</span></div>
            <div className="font-medium"><span className="text-zinc-400">K:</span> <span className="text-white">{totalCarbs}g</span></div>
            <div className="font-medium"><span className="text-zinc-400">F:</span> <span className="text-white">{totalFat}g</span></div>
            
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            
            <button 
              onClick={() => setClientGoalsMutation.mutate()} 
              disabled={setClientGoalsMutation.isPending || !clientId || (totalCalories === 0 && totalProtein === 0)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {setClientGoalsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sæt som klientmål'}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {meals.map((meal) => (
            <motion.div key={meal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <input value={meal.meal_name} onChange={e => updateMeal(meal.id, 'meal_name', e.target.value)}
                  className="bg-transparent text-sm font-semibold focus:outline-none border-b border-transparent focus:border-primary" />
                {meals.length > 1 && (
                  <button onClick={() => removeMeal(meal.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {[
                  { key: 'calories', label: 'Kcal' },
                  { key: 'protein_g', label: 'Protein' },
                  { key: 'carbs_g', label: 'Kulhydrat' },
                  { key: 'fat_g', label: 'Fedt' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'calories' ? 'col-span-2 sm:col-span-1 md:col-span-1' : ''}>
                    <label className="text-[10px] text-muted-foreground">{f.label}</label>
                    <input type="number" value={(meal as any)[f.key]}
                      onChange={e => updateMeal(meal.id, f.key, e.target.value ? Number(e.target.value) : '')}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center" />
                  </div>
                ))}
              </div>
              <div className="mt-2 space-y-1">
                <label className="text-[10px] text-muted-foreground">Beskrivelse</label>
                <textarea value={meal.description} onChange={e => updateMeal(meal.id, 'description', e.target.value)} rows={2}
                  placeholder="F.eks. 200g kylling, 150g ris, grøntsager..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs resize-none" />
              </div>
              <div className="mt-2 space-y-1">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ChefHat className="h-3 w-3" /> Link opskrift
                </label>
                <select value={meal.recipe_id ?? ''} onChange={e => updateMeal(meal.id, 'recipe_id', e.target.value || null)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
                  <option value="">Ingen opskrift</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}{r.calories ? ` (${r.calories} kcal)` : ''}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={addMeal}
          className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Tilføj måltid
        </button>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
          Annuller
        </button>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editId ? 'Opdatér kostplan' : 'Gem kostplan'}
        </button>
      </div>
    </div>
  );
}
