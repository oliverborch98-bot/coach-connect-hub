import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, ArrowRight, Calendar, CreditCard, AlertTriangle, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import PremiumCard from '@/components/PremiumCard';

const packageLabels: Record<string, string> = {
  the_system: 'The System',
  build_method: 'Build Method',
};

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

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const month = clientProfile?.current_month ?? 1;
  const phase = clientProfile?.current_phase ?? 'foundation';
  const packageType = (clientProfile as any)?.package_type ?? 'the_system';
  const phasePct = Math.round((month / 6) * 100);

  // Next Friday for check-in
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  const nextCheckinStr = nextFriday.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'short' });

  const subStatus = clientProfile?.subscription_status;
  const isPastDue = subStatus === 'past_due';
  const nextPayment = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-12 px-1">
      <header>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Velkommen</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black tracking-tighter"
        >
          Din <span className="royal-blue-text">Progression</span>
        </motion.h1>
      </header>

      {/* Payment Status Widget */}
      <AnimatePresence>
        {isPastDue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-md p-5 flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-tight text-destructive">Betaling mangler</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Din seneste betaling fejlede. Opdatér nu.</p>
            </div>
            <button onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke('customer-portal');
                if (error) throw error;
                if (data?.url) window.open(data.url, '_blank');
              } catch { }
            }} className="px-5 py-3 rounded-xl bg-destructive text-destructive-foreground text-xs font-black uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-lg active:scale-95 min-h-[44px]">
              Betal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Highlights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-morphism p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Trophy className="h-16 w-16 text-primary" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Måned</p>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-black tracking-tighter text-glow-royal-blue">{month}</span>
            <span className="text-xs font-bold text-muted-foreground/40 mb-1.5 uppercase tracking-tighter">af 6</span>
          </div>
        </div>
        <div className="glass-morphism p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <TrendingUp className="h-16 w-16 text-primary" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Fase</p>
          <span className="text-xl font-black uppercase tracking-tighter royal-blue-text">{phase}</span>
        </div>
      </div>

      {/* Main Status Container */}
      <PremiumCard
        title="Næste Skridt"
        subtitle={`Næste check-in: ${nextCheckinStr}`}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Samlet Progression</span>
              <span className="text-xs font-black text-primary">{phasePct}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${phasePct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full royal-blue-gradient rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { label: 'Check-in slutter om', value: '4 dage', icon: Calendar },
              { label: 'Abonnement status', value: subStatus === 'active' ? 'Aktivt' : 'Afventer', icon: CreditCard },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PremiumCard>

      {/* Goals Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/80 flex items-center gap-2 px-1">
          <Target className="h-3.5 w-3.5 text-glow-royal-blue shadow-primary" /> Aktive Mål
        </h2>

        {goals.length === 0 ? (
          <div className="glass-morphism p-8 rounded-2xl text-center border-dashed border-white/10">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Ingen aktive mål</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal, idx) => {
              const current = Number(goal.current_value) || 0;
              const target = Number(goal.target_value) || 1;
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (idx * 0.05) }}
                  className="glass-morphism p-5 rounded-2xl group hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-black uppercase tracking-tight text-sm text-glow-royal-blue">{goal.title}</span>
                    <div className="text-right">
                      <span className="text-xs font-black text-primary">{current} / {target}</span>
                      <span className="text-xs font-bold text-muted-foreground block uppercase tracking-tighter">{goal.unit}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 + (idx * 0.1) }}
                      className="h-full royal-blue-gradient rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Hub */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/80 flex items-center gap-2 px-1">
          <Zap className="h-3.5 w-3.5" /> Hurtige Handlinger
        </h2>
        <div className="grid gap-3">
          {[
            { label: 'Udfyld check-in', to: '/client/checkin', detail: 'Ugentlig status' },
            { label: 'Daglige habits', to: '/client/habits', detail: 'Hold kursen' },
            { label: 'Book coaching kald', to: '/client/calls', detail: 'Face-to-face' },
          ].map((link, idx) => (
            <motion.button
              key={link.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.05) }}
              onClick={() => navigate(link.to)}
              className="w-full flex items-center justify-between glass-morphism p-5 rounded-2xl group hover:bg-primary/5 transition-all duration-300"
            >
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">{link.detail}</p>
                <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{link.label}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
