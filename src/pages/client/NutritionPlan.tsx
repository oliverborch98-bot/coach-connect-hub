import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Utensils, Flame, Beef, Wheat, Droplets,
  ChefHat, Clock, ChevronDown, ChevronUp, ArrowRightLeft, X, Check,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Ingredient {
  name: string;
  amount: string;
}

// Tolerance range for macro matching (±)
const MACRO_TOLERANCE = { calories: 100, protein: 10, carbs: 15, fat: 8 };

export default function NutritionPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [swapMealId, setSwapMealId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs', clientProfile?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs' as any)
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('date', today);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!clientProfile,
  });

  const consumedCalories = foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const consumedProtein = foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const consumedCarbs = foodLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const consumedFat = foodLogs.reduce((sum, log) => sum + (log.fat || 0), 0);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logName, setLogName] = useState('');
  const [logCalories, setLogCalories] = useState('');
  const [logProtein, setLogProtein] = useState('');
  const [logCarbs, setLogCarbs] = useState('');
  const [logFat, setLogFat] = useState('');

  const logMealMutation = useMutation({
    mutationFn: async () => {
      if (!logName.trim()) throw new Error('Navngiv måltidet');
      const { error } = await supabase.from('food_logs' as any).insert({
        client_id: clientProfile!.id,
        date: today,
        meal_name: logName,
        calories: logCalories ? Number(logCalories) : 0,
        protein: logProtein ? Number(logProtein) : 0,
        carbs: logCarbs ? Number(logCarbs) : 0,
        fat: logFat ? Number(logFat) : 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Måltid logget succesfuldt!');
      setIsLogModalOpen(false);
      setLogName(''); setLogCalories(''); setLogProtein(''); setLogCarbs(''); setLogFat('');
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const MacroCircle = ({ label, consumed, goal, color }: { label: string, consumed: number, goal: number, color: string }) => {
    const validGoal = goal || 1;
    const pct = Math.min(100, Math.round((consumed / validGoal) * 100));
    const data = [
      { name: 'Consumed', value: consumed, color },
      { name: 'Remaining', value: Math.max(0, validGoal - consumed), color: '#27272a' } 
    ];
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-[70px] h-[70px] md:w-20 md:h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius="75%" outerRadius="100%"
                startAngle={90} endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-white leading-none">{pct}%</span>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] md:text-sm font-bold text-white">{consumed} / <span className="text-zinc-500">{goal || 0}</span></p>
          <p className="text-[8px] md:text-[10px] text-zinc-400 uppercase tracking-widest font-black">{label}</p>
        </div>
      </div>
    );
  };

  const { data: plan, isLoading } = useQuery({
    queryKey: ['nutrition-plan', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['meals', plan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('plan_id', plan!.id)
        .order('meal_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!plan,
  });

  // Fetch all recipes for the swap library
  const { data: allRecipes = [] } = useQuery({
    queryKey: ['all-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch recipes linked to current meals
  const recipeIds = meals.map(m => (m as any).recipe_id).filter(Boolean) as string[];
  const { data: linkedRecipes = [] } = useQuery({
    queryKey: ['meal-recipes', recipeIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);
      if (error) throw error;
      return data;
    },
    enabled: recipeIds.length > 0,
  });

  const recipeMap = new Map(linkedRecipes.map(r => [r.id, r]));

  // Swap mutation: updates the meal's recipe_id + macros from the recipe
  const swapMutation = useMutation({
    mutationFn: async ({ mealId, recipe }: { mealId: string; recipe: typeof allRecipes[0] }) => {
      const { error } = await supabase
        .from('meals')
        .update({
          recipe_id: recipe.id,
          meal_name: recipe.title,
          description: recipe.description || null,
          calories: recipe.calories || null,
          protein_g: recipe.protein_g || null,
          carbs_g: recipe.carbs_g || null,
          fat_g: recipe.fat_g || null,
        } as any)
        .eq('id', mealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', plan?.id] });
      queryClient.invalidateQueries({ queryKey: ['meal-recipes'] });
      toast.success('Måltid erstattet!');
      setSwapMealId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Get matching recipes for a meal (within macro tolerance)
  const getMatchingRecipes = (meal: typeof meals[0]) => {
    const mealCal = meal.calories ?? 0;
    const mealP = meal.protein_g ?? 0;
    const mealC = meal.carbs_g ?? 0;
    const mealF = meal.fat_g ?? 0;
    const currentRecipeId = (meal as any).recipe_id;

    return allRecipes.filter(r => {
      if (r.id === currentRecipeId) return false;
      if (!r.calories) return false;

      const calOk = Math.abs((r.calories ?? 0) - mealCal) <= MACRO_TOLERANCE.calories;
      const pOk = !mealP || Math.abs((r.protein_g ?? 0) - mealP) <= MACRO_TOLERANCE.protein;
      const cOk = !mealC || Math.abs((r.carbs_g ?? 0) - mealC) <= MACRO_TOLERANCE.carbs;
      const fOk = !mealF || Math.abs((r.fat_g ?? 0) - mealF) <= MACRO_TOLERANCE.fat;

      return calOk && pOk && cOk && fOk;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-16 space-y-3">
        <Utensils className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Du har ikke fået en kostplan endnu</p>
        <p className="text-xs text-muted-foreground">Din coach tildeler en plan snart.</p>
      </div>
    );
  }

  const swapMeal = meals.find(m => m.id === swapMealId);
  const matchingRecipes = swapMeal ? getMatchingRecipes(swapMeal) : [];
  // Also show all other recipes that don't match for browsing
  const nonMatchingRecipes = swapMeal
    ? allRecipes.filter(r => r.id !== (swapMeal as any).recipe_id && !matchingRecipes.find(mr => mr.id === r.id) && r.calories)
    : [];

  return (
    <div className="space-y-6 px-4 pb-24 md:pb-12 max-w-2xl mx-auto">
      
      {clientProfile && (clientProfile.daily_calories_goal || clientProfile.daily_protein_goal) && (
        <motion.div
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
           className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
               <Flame className="w-5 h-5 text-amber-500" />
               <h2 className="text-sm font-bold text-amber-500 tracking-wide uppercase">Dagens Makroer</h2>
             </div>
             <button onClick={() => setIsLogModalOpen(true)} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors">
               <PlusCircle className="h-4 w-4" /> Log måltid
             </button>
          </div>
          
          <div className="flex justify-between items-center px-1">
            <MacroCircle label="Kcal" consumed={consumedCalories} goal={clientProfile.daily_calories_goal} color="#3b82f6" />
            <MacroCircle label="Protein" consumed={consumedProtein} goal={clientProfile.daily_protein_goal} color="#f59e0b" />
            <MacroCircle label="Kulhydrat" consumed={consumedCarbs} goal={clientProfile.daily_carbs_goal} color="#10b981" />
            <MacroCircle label="Fedt" consumed={consumedFat} goal={clientProfile.daily_fat_goal} color="#ef4444" />
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-zinc-100">{plan.name}</h1>
        {plan.notes && <p className="text-sm text-zinc-400 mt-1">{plan.notes}</p>}
      </motion.div>

      {/* Macro overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">DAGLIGE MÅL</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
          <MacroItem icon={Flame} label="Kalorier" value={plan.calories_target} unit="kcal" />
          <MacroItem icon={Beef} label="Protein" value={plan.protein_g} unit="g" />
          <MacroItem icon={Wheat} label="Kulhydrat" value={plan.carbs_g} unit="g" />
          <MacroItem icon={Droplets} label="Fedt" value={plan.fat_g} unit="g" />
        </div>
      </motion.div>

      {/* Meals */}
      <div className="space-y-3">
        {meals.map((meal, i) => {
          const recipe = recipeMap.get((meal as any).recipe_id);
          const isExpanded = expandedMeal === meal.id;
          const ingredients = recipe?.ingredients as unknown as Ingredient[] | undefined;

          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{meal.meal_name}</h3>
                  {meal.calories && (
                    <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>
                  )}
                </div>
                {meal.description && (
                  <p className="text-sm text-muted-foreground mb-2">{meal.description}</p>
                )}
                {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                  <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                    {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                    {meal.carbs_g && <span>K: {meal.carbs_g}g</span>}
                    {meal.fat_g && <span>F: {meal.fat_g}g</span>}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-1">
                  {recipe && (
                    <button
                      onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      <ChefHat className="h-3.5 w-3.5" />
                      Se opskrift
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => setSwapMealId(meal.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-primary transition-colors"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Byt måltid
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && recipe && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-secondary/30 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold">{recipe.title}</h4>
                        {recipe.prep_time_min && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                            <Clock className="h-3.5 w-3.5" /> {recipe.prep_time_min} min
                          </span>
                        )}
                      </div>

                      {ingredients && ingredients.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Ingredienser</p>
                          <ul className="space-y-0.5">
                            {ingredients.map((ing, idx) => (
                              <li key={idx} className="text-xs flex gap-2">
                                <span className="text-muted-foreground min-w-[4rem]">{ing.amount}</span>
                                <span>{ing.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recipe.instructions && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Fremgangsmåde</p>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Swap Modal */}
      <AnimatePresence>
        {swapMealId && swapMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4"
            onClick={() => setSwapMealId(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl bg-card border border-border shadow-xl"
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-sm font-semibold">Byt måltid</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Erstatter "{swapMeal.meal_name}" ({swapMeal.calories ?? '–'} kcal)
                  </p>
                </div>
                <button onClick={() => setSwapMealId(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Matching recipes */}
                {matchingRecipes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <h4 className="text-xs font-semibold text-emerald-500">Matcher dine makroer</h4>
                    </div>
                    <div className="space-y-2">
                      {matchingRecipes.map(r => (
                        <RecipeSwapCard
                          key={r.id}
                          recipe={r}
                          isMatch
                          onSwap={() => swapMutation.mutate({ mealId: swapMealId!, recipe: r })}
                          loading={swapMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {matchingRecipes.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      Ingen opskrifter matcher præcis dette måltids makroer (±{MACRO_TOLERANCE.calories} kcal).
                    </p>
                  </div>
                )}

                {/* Non-matching recipes */}
                {nonMatchingRecipes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      Andre opskrifter <span className="font-normal">(afviger fra makroer)</span>
                    </h4>
                    <div className="space-y-2">
                      {nonMatchingRecipes.map(r => (
                        <RecipeSwapCard
                          key={r.id}
                          recipe={r}
                          isMatch={false}
                          onSwap={() => swapMutation.mutate({ mealId: swapMealId!, recipe: r })}
                          loading={swapMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {allRecipes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Din coach har ikke tilføjet opskrifter endnu.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-amber-500 flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Log Måltid
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Registrer hvad du har spist for at holde styr på dine makroer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Hvad har du spist?</Label>
              <Input placeholder="F.eks. Havregryn med mælk" value={logName} onChange={(e) => setLogName(e.target.value)} className="bg-black border-zinc-800 text-zinc-100" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Kalorier (kcal)</Label>
                <Input type="number" placeholder="400" value={logCalories} onChange={(e) => setLogCalories(e.target.value)} className="bg-black border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Protein (g)</Label>
                <Input type="number" placeholder="25" value={logProtein} onChange={(e) => setLogProtein(e.target.value)} className="bg-black border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Kulhydrat (g)</Label>
                <Input type="number" placeholder="45" value={logCarbs} onChange={(e) => setLogCarbs(e.target.value)} className="bg-black border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Fedt (g)</Label>
                <Input type="number" placeholder="12" value={logFat} onChange={(e) => setLogFat(e.target.value)} className="bg-black border-zinc-800 text-zinc-100" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
             <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white" onClick={() => setIsLogModalOpen(false)}>
               Annuller
             </Button>
             <Button 
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
               onClick={() => logMealMutation.mutate()}
               disabled={logMealMutation.isPending || !logName.trim()}
             >
               {logMealMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
               Gem Måltid
             </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function RecipeSwapCard({
  recipe,
  isMatch,
  onSwap,
  loading,
}: {
  recipe: any;
  isMatch: boolean;
  onSwap: () => void;
  loading: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const ingredients = recipe.ingredients as unknown as Ingredient[] | undefined;

  return (
    <div className={`rounded-xl border p-3 ${isMatch ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-secondary/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{recipe.title}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1.5 font-medium">
            {recipe.calories && <span>{recipe.calories} kcal</span>}
            {recipe.protein_g && <span>P: {recipe.protein_g}g</span>}
            {recipe.carbs_g && <span>K: {recipe.carbs_g}g</span>}
            {recipe.fat_g && <span>F: {recipe.fat_g}g</span>}
            {recipe.prep_time_min && (
              <span className="flex items-center gap-0.5"><Clock className="h-3.5 w-3.5" />{recipe.prep_time_min} min</span>
            )}
          </div>
        </div>
        <button
          onClick={onSwap}
          disabled={loading}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 min-h-[44px] ${
            isMatch
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          } disabled:opacity-50 active:scale-95`}
        >
          Vælg
        </button>
      </div>

      {recipe.description && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{recipe.description}</p>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 text-xs text-primary font-bold mt-3 hover:underline uppercase tracking-widest"
      >
        <ChefHat className="h-4 w-4" />
        {showDetails ? 'Skjul detaljer' : 'Se detaljer'}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2 border-t border-border/50 mt-2">
              {ingredients && ingredients.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Ingredienser</p>
                  <ul className="space-y-0.5">
                    {ingredients.map((ing, idx) => (
                      <li key={idx} className="text-xs flex gap-3 py-0.5">
                        <span className="text-muted-foreground/60 min-w-[4rem] font-medium">{ing.amount}</span>
                        <span className="font-medium">{ing.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recipe.instructions && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Fremgangsmåde</p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80">{recipe.instructions}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MacroItem({ icon: Icon, label, value, unit }: { icon: any; label: string; value: number | null; unit: string }) {
  return (
    <div className="space-y-1">
      <Icon className="h-4 w-4 mx-auto text-primary" />
      <p className="text-lg font-bold">{value ?? '–'}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">{label}</p>
    </div>
  );
}
