import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Utensils, Flame, Beef, Wheat, Droplets,
  ChefHat, Clock, ChevronDown, ChevronUp, ArrowRightLeft, X, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_month')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">{plan.name}</h1>
        {plan.notes && <p className="text-sm text-muted-foreground mt-1">{plan.notes}</p>}
      </motion.div>

      {/* Macro overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">DAGLIGE MÅL</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
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
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {recipe.prep_time_min} min
                          </span>
                        )}
                      </div>

                      {ingredients && ingredients.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Ingredienser</p>
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
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Fremgangsmåde</p>
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">
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
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-1">
            {recipe.calories && <span>{recipe.calories} kcal</span>}
            {recipe.protein_g && <span>P: {recipe.protein_g}g</span>}
            {recipe.carbs_g && <span>K: {recipe.carbs_g}g</span>}
            {recipe.fat_g && <span>F: {recipe.fat_g}g</span>}
            {recipe.prep_time_min && (
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{recipe.prep_time_min} min</span>
            )}
          </div>
        </div>
        <button
          onClick={onSwap}
          disabled={loading}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            isMatch
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          } disabled:opacity-50`}
        >
          Vælg
        </button>
      </div>

      {recipe.description && (
        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{recipe.description}</p>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-[10px] text-primary font-medium mt-2 hover:underline"
      >
        <ChefHat className="h-3 w-3" />
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
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Ingredienser</p>
                  <ul className="space-y-0.5">
                    {ingredients.map((ing, idx) => (
                      <li key={idx} className="text-[11px] flex gap-2">
                        <span className="text-muted-foreground min-w-[3.5rem]">{ing.amount}</span>
                        <span>{ing.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {recipe.instructions && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Fremgangsmåde</p>
                  <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
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
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
