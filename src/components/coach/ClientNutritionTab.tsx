import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UtensilsCrossed, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientNutritionTab({ clientId }: { clientId: string }) {
  const qc = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['coach-client-nutrition', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['coach-client-meals', plan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('plan_id', plan!.id)
        .order('meal_order');
      if (error) throw error;
      return data;
    },
    enabled: !!plan,
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['coach-client-kcal-checkins', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('checkin_number, avg_calories')
        .eq('client_id', clientId)
        .in('status', ['submitted', 'reviewed'])
        .order('checkin_number');
      if (error) throw error;
      return data;
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-nutrition-email', {
        body: { planId: plan!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? 'Email sendt!');
      qc.invalidateQueries({ queryKey: ['coach-client-nutrition', clientId] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Kunne ikke sende email'),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (!plan) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <UtensilsCrossed className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Ingen aktiv kostplan tildelt</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{plan.name}</h3>
            {plan.notes && <p className="text-xs text-muted-foreground mt-1">{plan.notes}</p>}
          </div>
          <button
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {sendEmailMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : plan.email_sent ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            {plan.email_sent ? 'Send igen' : 'Send via email'}
          </button>
        </div>
        {plan.email_sent && plan.email_sent_at && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Sidst sendt: {new Date(plan.email_sent_at).toLocaleString('da-DK')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Kcal', value: plan.calories_target },
          { label: 'Protein', value: plan.protein_g ? `${plan.protein_g}g` : '–' },
          { label: 'Kulhydrat', value: plan.carbs_g ? `${plan.carbs_g}g` : '–' },
          { label: 'Fedt', value: plan.fat_g ? `${plan.fat_g}g` : '–' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold">{m.value ?? '–'}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {meals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Måltider</h4>
          {meals.map(meal => (
            <div key={meal.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{meal.meal_name}</p>
                  {meal.description && <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>}
                </div>
                <span className="text-xs font-medium">{meal.calories ?? '–'} kcal</span>
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>P: {meal.protein_g ?? '–'}g</span>
                <span>K: {meal.carbs_g ?? '–'}g</span>
                <span>F: {meal.fat_g ?? '–'}g</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {checkins.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Faktisk kcal vs. target</h4>
          <div className="space-y-2">
            {checkins.filter(c => c.avg_calories).map(c => {
              const pct = plan.calories_target ? Math.round(((c.avg_calories ?? 0) / plan.calories_target) * 100) : 0;
              return (
                <div key={c.checkin_number} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-muted-foreground">#{c.checkin_number}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 110 || pct < 90 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="w-16 text-right">{c.avg_calories} kcal</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
