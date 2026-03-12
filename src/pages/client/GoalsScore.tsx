import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Target, Trophy, Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoalsScore() {
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('client_id', clientProfile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!clientProfile,
  });

  const { data: score } = useQuery({
    queryKey: ['accountability-score', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountability_scores')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['client-badges', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_badges')
        .select('*, badges(*)')
        .eq('client_id', clientProfile!.id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!clientProfile,
  });

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">Mål & Score</h1>
      </motion.div>

      {/* Accountability Score */}
      {score && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full lime-gradient flex items-center justify-center">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Accountability Score</p>
              <p className="text-xs text-muted-foreground capitalize">{score.level ?? 'Begynder'}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold lime-text">{score.total_points ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">point</p>
            </div>
          </div>
          <div className="flex gap-4 text-center text-xs">
            <div>
              <p className="text-lg font-bold">{score.current_streak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </div>
            <div>
              <p className="text-lg font-bold">{score.longest_streak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Bedste</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h2 className="text-xs font-semibold text-muted-foreground mb-3">BADGES</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map(cb => (
              <div key={cb.id} className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                <Star className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">{cb.badges?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{cb.badges?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Goals */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground">DINE MÅL</h2>
        {goals.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Target className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ingen mål opsat endnu</p>
          </div>
        ) : (
          goals.map((goal, i) => {
            const start = Number(goal.start_value) || 0;
            const target = Number(goal.target_value) || 0;
            const current = Number(goal.current_value) || start;
            const pct = start !== target
              ? Math.min(100, Math.max(0, ((current - start) / (target - start)) * 100))
              : 0;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{goal.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    goal.status === 'achieved' ? 'bg-success/10 text-success'
                    : goal.status === 'failed' ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/10 text-primary'
                  }`}>
                    {goal.status === 'achieved' ? 'Opnået' : goal.status === 'failed' ? 'Ikke nået' : 'Aktiv'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>{start} {goal.unit}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full lime-gradient rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span>{target} {goal.unit}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Nu: <span className="text-foreground font-medium">{current} {goal.unit}</span>
                  {goal.deadline && (
                    <> · Deadline: {new Date(goal.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</>
                  )}
                </p>

                {/* Milestones */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {goal.milestones.map((ms: any) => (
                      <div key={ms.id} className="flex items-center gap-2 text-xs">
                        <div className={`h-3 w-3 rounded-full border ${ms.achieved ? 'bg-success border-success' : 'border-muted-foreground'}`} />
                        <span className={ms.achieved ? 'line-through text-muted-foreground' : ''}>{ms.title}</span>
                        {ms.target_value && <span className="text-muted-foreground ml-auto">{ms.target_value} {goal.unit}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
