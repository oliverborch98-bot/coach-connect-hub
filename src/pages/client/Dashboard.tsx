import { motion } from 'framer-motion';
import { Target, Zap, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile'],
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

  const { data: goals = [] } = useQuery({
    queryKey: ['my-goals', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const week = clientProfile?.current_week ?? 0;
  const phase = clientProfile?.current_phase ?? 'Foundation';
  const phasePct = Math.round((week / 26) * 100);

  // Next Friday for check-in
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  const nextCheckinStr = nextFriday.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Din fase</p>
            <p className="text-lg font-bold text-primary capitalize">{phase}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">{week}<span className="text-sm font-normal text-muted-foreground">/26</span></p>
            <p className="text-xs text-muted-foreground">uger</p>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full gold-gradient rounded-full transition-all" style={{ width: `${phasePct}%` }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Næste check-in: <span className="text-foreground font-medium">{nextCheckinStr}</span>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Dine mål
        </h2>
        {goals.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Ingen mål sat endnu</p>
          </div>
        ) : (
          goals.map((goal) => {
            const current = Number(goal.current_value) || 0;
            const target = Number(goal.target_value) || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            return (
              <div key={goal.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-muted-foreground">{current}/{target} {goal.unit}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Hurtige handlinger
        </h2>
        {[
          { label: 'Udfyld check-in', to: '/client/checkin' },
          { label: 'Daglige habits', to: '/client/habits' },
        ].map(link => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-primary/30 transition-colors"
          >
            {link.label}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>
    </div>
  );
}
