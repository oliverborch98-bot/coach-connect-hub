import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Utensils, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NutritionPlan() {
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_week')
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
        .single();
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
        {meals.map((meal, i) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
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
              <div className="flex gap-3 text-xs text-muted-foreground">
                {meal.protein_g && <span>P: {meal.protein_g}g</span>}
                {meal.carbs_g && <span>K: {meal.carbs_g}g</span>}
                {meal.fat_g && <span>F: {meal.fat_g}g</span>}
              </div>
            )}
          </motion.div>
        ))}
      </div>
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
