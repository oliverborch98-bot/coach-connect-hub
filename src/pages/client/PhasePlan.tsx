import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, CheckCircle2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PhasePlan() {
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_month, current_phase')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: phases = [], isLoading } = useQuery({
    queryKey: ['phases', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('phase_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentMonth = clientProfile?.current_month ?? 1;
  const phasePct = Math.round((currentMonth / 6) * 100);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">Dit forløb</h1>
        <p className="text-sm text-muted-foreground mt-1">Måned {currentMonth} af 6</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full royal-blue-gradient rounded-full transition-all duration-500" style={{ width: `${phasePct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Md 1</span>
          <span>Md 2</span>
          <span>Md 4</span>
          <span>Md 6</span>
        </div>
      </motion.div>

      {phases.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Faser er ikke opsat endnu.</p>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, i) => {
            const isActive = phase.status === 'active';
            const isCompleted = phase.status === 'completed';

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className={`rounded-xl border p-4 transition-colors ${
                  isActive ? 'border-primary/40 bg-primary/5' : isCompleted ? 'border-border bg-card' : 'border-border bg-card/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isActive ? 'royal-blue-gradient' : isCompleted ? 'bg-success/20' : 'bg-secondary'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4 text-success" /> : isActive ? <Play className="h-4 w-4 text-primary-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{phase.name ?? `Fase ${phase.phase_number}`}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {phase.start_date && phase.end_date
                        ? `${new Date(phase.start_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${new Date(phase.end_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`
                        : `Fase ${phase.phase_number}`}
                    </p>
                  </div>
                  {isActive && <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded bg-primary/10">AKTIV</span>}
                </div>

                {(isActive || isCompleted) && (
                  <div className="mt-3 space-y-2">
                    {phase.phase_goals && phase.phase_goals.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">MÅL</p>
                        <ul className="space-y-1">
                          {phase.phase_goals.map((goal: string, gi: number) => (
                            <li key={gi} className="text-xs text-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {phase.focus_items && phase.focus_items.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">FOKUS</p>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.focus_items.map((item: string, fi: number) => (
                            <span key={fi} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
