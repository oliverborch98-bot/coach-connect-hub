import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Target } from 'lucide-react';

export default function ClientGoalsTab({ clientId }: { clientId: string }) {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['client-goals-coach', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (goals.length === 0) return <p className="text-sm text-muted-foreground">Ingen mål oprettet endnu</p>;

  return (
    <div className="space-y-3">
      {goals.map(goal => {
        const pct = goal.start_value != null && goal.target_value != null && goal.current_value != null && goal.start_value !== goal.target_value
          ? Math.min(100, Math.max(0, ((Number(goal.start_value) - Number(goal.current_value)) / (Number(goal.start_value) - Number(goal.target_value))) * 100))
          : 0;
        const milestones = (goal as any).milestones ?? [];

        return (
          <div key={goal.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{goal.title}</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                goal.status === 'achieved' ? 'bg-success/10 text-success' : goal.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>{goal.status}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Start: {goal.start_value ?? '–'} {goal.unit}</span>
              <span>Nu: {goal.current_value ?? '–'} {goal.unit}</span>
              <span>Mål: {goal.target_value ?? '–'} {goal.unit}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full royal-blue-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {milestones.length > 0 && (
              <div className="space-y-1">
                {milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${m.achieved ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    <span className={m.achieved ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                    {m.target_value && <span className="text-muted-foreground">({m.target_value} {goal.unit})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
