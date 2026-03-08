import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, Save, UtensilsCrossed, Sparkles } from 'lucide-react';
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
}

const emptyMeal = (order: number): MealDraft => ({
  id: crypto.randomUUID(),
  meal_name: `Måltid ${order + 1}`,
  description: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
});

export default function NutritionBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const qc = useQueryClient();

  const [clientId, setClientId] = useState(preselectedClient);
  const [planName, setPlanName] = useState('');
  const [phase, setPhase] = useState('foundation');
  const [caloriesTarget, setCaloriesTarget] = useState<number | ''>('');
  const [proteinG, setProteinG] = useState<number | ''>('');
  const [carbsG, setCarbsG] = useState<number | ''>('');
  const [fatG, setFatG] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [meals, setMeals] = useState<MealDraft[]>([emptyMeal(0)]);
  const [aiLoading, setAiLoading] = useState(false);

  const generateWithAI = async () => {
    if (!clientId) { toast.error('Vælg en klient først'); return; }
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
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
        })));
      }
      toast.success('AI-kostplan genereret! Gennemgå og gem.');
    } catch (e: any) { toast.error(e.message); }
    setAiLoading(false);
  };

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['coach-clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, profiles!client_profiles_user_id_fkey(full_name)')
        .eq('status', 'active');
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Vælg en klient');
      if (!planName.trim()) throw new Error('Angiv plannavn');

      // 1. Create plan
      const { data: plan, error: pErr } = await supabase
        .from('nutrition_plans')
        .insert({
          client_id: clientId,
          name: planName,
          phase: phase || null,
          calories_target: caloriesTarget || null,
          protein_g: proteinG || null,
          carbs_g: carbsG || null,
          fat_g: fatG || null,
          notes: notes || null,
          meals_per_day: meals.length,
          status: 'active',
        })
        .select('id')
        .single();
      if (pErr) throw pErr;

      // 2. Create meals
      const mealInserts = meals.map((m, i) => ({
        plan_id: plan.id,
        meal_name: m.meal_name,
        meal_order: i,
        description: m.description || null,
        calories: m.calories || null,
        protein_g: m.protein_g || null,
        carbs_g: m.carbs_g || null,
        fat_g: m.fat_g || null,
      }));

      if (mealInserts.length > 0) {
        const { error: mErr } = await supabase.from('meals').insert(mealInserts);
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      toast.success('Kostplan oprettet!');
      qc.invalidateQueries({ queryKey: ['coach-clients-list'] });
      navigate(clientId ? `/coach/client/${clientId}` : '/coach');
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved oprettelse'),
  });

  const addMeal = () => setMeals(prev => [...prev, emptyMeal(prev.length)]);
  const removeMeal = (id: string) => setMeals(prev => prev.filter(m => m.id !== id));
  const updateMeal = (id: string, field: string, value: any) =>
    setMeals(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Ny Kostplan</h1>
          <p className="text-sm text-muted-foreground">Opret makromål og måltider til en klient</p>
        </div>
        <button onClick={generateWithAI} disabled={aiLoading || !clientId}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {aiLoading ? 'Genererer...' : 'Generér med AI'}
        </button>
      </div>

      {/* Meta */}
      <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Klient</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Vælg klient...</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.profiles?.full_name ?? 'Ukendt'}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Plannavn</label>
          <input
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            placeholder="F.eks. Bulking Plan"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Fase</label>
          <select
            value={phase}
            onChange={e => setPhase(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="foundation">Foundation</option>
            <option value="acceleration">Acceleration</option>
            <option value="transformation">Transformation</option>
          </select>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-primary" /> Daglige makromål
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Kalorier</label>
            <input
              type="number"
              value={caloriesTarget}
              onChange={e => setCaloriesTarget(e.target.value ? Number(e.target.value) : '')}
              placeholder="2400"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-center"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein (g)</label>
            <input
              type="number"
              value={proteinG}
              onChange={e => setProteinG(e.target.value ? Number(e.target.value) : '')}
              placeholder="180"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-center"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Kulhydrater (g)</label>
            <input
              type="number"
              value={carbsG}
              onChange={e => setCarbsG(e.target.value ? Number(e.target.value) : '')}
              placeholder="280"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-center"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Fedt (g)</label>
            <input
              type="number"
              value={fatG}
              onChange={e => setFatG(e.target.value ? Number(e.target.value) : '')}
              placeholder="70"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-center"
            />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Noter</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Evt. noter til klienten..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Måltider</h3>
        <AnimatePresence>
          {meals.map((meal, i) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <input
                  value={meal.meal_name}
                  onChange={e => updateMeal(meal.id, 'meal_name', e.target.value)}
                  className="bg-transparent text-sm font-semibold focus:outline-none border-b border-transparent focus:border-primary"
                />
                {meals.length > 1 && (
                  <button onClick={() => removeMeal(meal.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] text-muted-foreground">Kcal</label>
                  <input
                    type="number"
                    value={meal.calories}
                    onChange={e => updateMeal(meal.id, 'calories', e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Protein</label>
                  <input
                    type="number"
                    value={meal.protein_g}
                    onChange={e => updateMeal(meal.id, 'protein_g', e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Kulhydrat</label>
                  <input
                    type="number"
                    value={meal.carbs_g}
                    onChange={e => updateMeal(meal.id, 'carbs_g', e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fedt</label>
                  <input
                    type="number"
                    value={meal.fat_g}
                    onChange={e => updateMeal(meal.id, 'fat_g', e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <label className="text-[10px] text-muted-foreground">Beskrivelse</label>
                <textarea
                  value={meal.description}
                  onChange={e => updateMeal(meal.id, 'description', e.target.value)}
                  rows={2}
                  placeholder="F.eks. 200g kylling, 150g ris, grøntsager..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs resize-none"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addMeal}
          className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Tilføj måltid
        </button>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          Annuller
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Gem kostplan
        </button>
      </div>
    </div>
  );
}
