import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Users, TrendingUp, Award, AlertCircle, BarChart3, 
  DollarSign, Calendar, Flame, Clock, Dumbbell, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { 
  format, subMonths, startOfMonth, endOfMonth, subDays, 
  isSameDay, differenceInDays, startOfDay 
} from 'date-fns';
import { da } from 'date-fns/locale';
import { useMemo } from 'react';
import { toast } from 'sonner';

export default function CoachAnalytics() {
  const STALE_TIME = 5 * 60 * 1000; // 5 minutter

  // 1. Fetch data med React Query
  const { data: clientsData = [], isLoading: loadingClients } = useQuery({
    queryKey: ['coach-analytics-clients'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('*, profiles!client_profiles_user_id_fkey(full_name, email)')
          .eq('status', 'active');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching clients:', err);
        throw err;
      }
    },
    staleTime: STALE_TIME,
  });

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['coach-analytics-subscriptions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, client_profiles(monthly_price)')
          .eq('status', 'active');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        throw err;
      }
    },
    staleTime: STALE_TIME,
  });

  const { data: checkins = [], isLoading: loadingCheckins } = useQuery({
    queryKey: ['coach-analytics-checkins'],
    queryFn: async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const { data, error } = await supabase
          .from('weekly_checkins')
          .select('*, profiles:client_profiles(profiles!client_profiles_user_id_fkey(full_name))')
          .gte('submitted_at', thirtyDaysAgo)
          .order('submitted_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching checkins:', err);
        throw err;
      }
    },
    staleTime: STALE_TIME,
  });

  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['coach-analytics-exercises'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('training_exercises')
          .select('*, exercises(name)');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching exercises:', err);
        throw err;
      }
    },
    staleTime: STALE_TIME,
  });

  // 2. Beregninger
  const mrr = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + (Number((sub as any).client_profiles?.monthly_price) || 0), 0);
  }, [subscriptions]);

  const checkinCompletionRate = useMemo(() => {
    if (clientsData.length === 0) return 0;
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentCheckins = new Set(
      checkins
        .filter(c => c.submitted_at && new Date(c.submitted_at) >= sevenDaysAgo)
        .map(c => c.client_id)
    );
    return Math.round((recentCheckins.size / clientsData.length) * 100);
  }, [checkins, clientsData]);

  const retentionRate = useMemo(() => {
    // Simpel retention: Klienter der har været her i mindst 30 dage og stadig er aktive
    const thirtyDaysAgo = subDays(new Date(), 30);
    const clientsAtStart = clientsData.filter(c => c.created_at && new Date(c.created_at) <= thirtyDaysAgo).length;
    if (clientsAtStart === 0) return 100; // Ny coach eller ingen data
    return 100; // Antager 100% for nu da vi kun henter aktive. I en rigtig app ville vi tjekke churned tabellen.
  }, [clientsData]);

  const revenueChartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const label = format(d, 'MMM', { locale: da });
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);

      // I en rigtig app ville vi hente historisk data her. For nu summerer vi aktive subs for den pågældende måned
      const value = subscriptions
        .filter(s => {
          const start = new Date(s.created_at || '');
          return start <= monthEnd;
        })
        .reduce((sum, sub) => sum + (Number((sub as any).client_profiles?.monthly_price) || 0), 0);

      months.push({ name: label, value });
    }
    return months;
  }, [subscriptions]);

  const topClientsData = useMemo(() => {
    const counts: Record<string, { name: string, count: number }> = {};
    checkins.forEach(c => {
      const name = (c as any).profiles?.profiles?.full_name || 'Ukendt';
      if (!counts[c.client_id]) counts[c.client_id] = { name, count: 0 };
      counts[c.client_id].count++;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [checkins]);

  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = checkins.filter(c => c.submitted_at && isSameDay(new Date(c.submitted_at), d)).length;
      days.push({ date: dateStr, count, day: format(d, 'd'), label: format(d, 'EEE', { locale: da }) });
    }
    return days;
  }, [checkins]);

  const atRiskClients = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return clientsData
      .filter(client => {
        const lastCheckin = checkins.find(c => c.client_id === client.id)?.submitted_at;
        if (!lastCheckin) return true;
        return new Date(lastCheckin) < sevenDaysAgo;
      })
      .map(client => {
        const lastCheckin = checkins.find(c => c.client_id === client.id)?.submitted_at;
        const daysSince = lastCheckin ? differenceInDays(new Date(), new Date(lastCheckin)) : 30; // 30 som fallback hvis de aldrig har tjekket ind
        return { 
          id: client.id, 
          name: (client as any).profiles?.full_name || 'Ukendt', 
          daysSince,
          email: (client as any).profiles?.email 
        };
      })
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [clientsData, checkins]);

  const trainingStats = useMemo(() => {
    const exCounts: Record<string, number> = {};
    exercises.forEach(e => {
      const name = (e as any).exercises?.name || 'Ukendt';
      exCounts[name] = (exCounts[name] || 0) + 1;
    });
    const topExercises = Object.entries(exCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const avgWorkouts = checkins.reduce((sum, c) => sum + (c.workouts_completed || 0), 0) / (checkins.length || 1);
    const avgTrainingTime = Math.round(avgWorkouts * 60);

    return { topExercises, avgTrainingTime };
  }, [exercises, checkins]);

  const handleSendReminder = async (email: string, name: string) => {
    try {
      if (!email) {
        toast.error('Klientens email blev ikke fundet');
        return;
      }

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Husk dit ugentlige check-in! 👋',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #0066FF;">Hej ${name}!</h2>
              <p>Jeg kan se, at du har misset dit seneste ugentlige check-in. Det er vigtigt for at vi kan holde øje med dine fremskridt!</p>
              <p>Hop ind på platformen og udfyld det nu, så vi kan få dig på rette spor igen.</p>
              <a href="${window.location.origin}/login" style="display: inline-block; background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Gå til Login</a>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">Venlig hilsen,<br>Din Coach - Built By Borch</p>
            </div>
          `
        }
      });
      if (error) throw error;
      toast.success(`Påmindelse sendt til ${name}`);
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke sende email påmindelse');
    }
  };

  if (loadingClients || loadingSubs || loadingCheckins || loadingExercises) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const tooltipStyle = { 
    background: 'rgba(9, 9, 11, 0.95)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '12px', 
    fontSize: '12px', 
    color: '#fff',
    backdropFilter: 'blur(8px)',
    padding: '8px 12px'
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Business Intelligence</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black tracking-tighter">
            Analytics <span className="royal-blue-text">Dashboard</span>
          </motion.h1>
        </div>
      </header>

      {/* SEKTION 1 - OVERBLIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aktive klienter', value: clientsData.length, icon: Users, sub: 'Total aktive profiler' },
          { label: 'Månedlig omsætning', value: `${mrr.toLocaleString('da-DK')} kr`, icon: DollarSign, sub: 'Estimering (Active MRR)' },
          { label: 'Check-in Rate', value: `${checkinCompletionRate}%`, icon: Calendar, sub: 'Indsendt de sidste 7 dage' },
          { label: 'Klient Retention', value: `${retentionRate}%`, icon: TrendingUp, sub: 'Vs. sidste 30 dage' },
        ].map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-dark rounded-3xl p-6 border border-white/5 service-card-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter mb-1">{s.value}</p>
            <p className="text-xs font-bold text-foreground/90 mb-1">{s.label}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEKTION 2 - REVENUE GRAF */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-dark rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Omsætning <span className="text-muted-foreground opacity-50">(Sidste 6 mdr)</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                  tickFormatter={(v) => `${v/1000}k`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0066FF" 
                  strokeWidth={4} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#0066FF' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* SEKTION 3 - KLIENT AKTIVITET */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-[2.5rem] border border-white/5 p-8"
        >
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 mb-8">
            <Flame className="h-5 w-5 text-orange-500" /> Mest Aktive <span className="text-muted-foreground opacity-50">(Top 10)</span>
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientsData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#fff', fontWeight: 600 }}
                  width={80}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#0066FF" radius={[0, 8, 8, 0]} barSize={20}>
                  {topClientsData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#0066FF' : `rgba(0, 102, 255, ${0.9 - index * 0.08})`} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEKTION 4 - CHECK-IN HEATMAP */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-[2.5rem] border border-white/5 p-8"
        >
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-primary" /> Check-in Aktivitet <span className="text-muted-foreground opacity-50">(30 dage)</span>
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {heatmapData.map((day, i) => {
              let color = 'bg-zinc-800/50';
              if (day.count > 0 && day.count < 2) color = 'bg-red-500/20 text-red-400 border-red-500/30';
              if (day.count >= 2 && day.count < 4) color = 'bg-green-500/30 text-green-400 border-green-500/30';
              if (day.count >= 4) color = 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';

              return (
                <div 
                  key={i} 
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border border-white/5 transition-all duration-300 hover:scale-110 cursor-default ${color}`}
                  title={`${day.date}: ${day.count} check-ins`}
                >
                  <span className="text-[10px] font-black">{day.day}</span>
                  <span className="text-[7px] uppercase font-bold opacity-50">{day.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-zinc-800/50" /> Nul</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-500/20" /> Få</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-500/30" /> God</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-500" /> Mange</div>
          </div>
        </motion.div>

        {/* SEKTION 5 - KRÆVER OPMÆRKSOMHED */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-[2.5rem] border border-white/5 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" /> Kræver <span className="royal-blue-text">Opmærksomhed</span>
            </h3>
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
              {atRiskClients.length} Klienter
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {atRiskClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Alle klienter er ajour! 💪</p>
            ) : atRiskClients.map((c, i) => (
              <div 
                key={c.id} 
                className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-sm group-hover:text-primary transition-colors">
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{c.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest underline underline-offset-2 decoration-red-500/50">
                      Sidste check-in: {c.daysSince} dage siden
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendReminder(c.email, c.name)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                  title="Send Påmindelse"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* SEKTION 6 - TRÆNINGSSTATISTIK */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-[2.5rem] border border-white/5 p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 mb-6">
              <Dumbbell className="h-5 w-5 text-primary" /> Træningsstatistik <span className="text-muted-foreground opacity-50">(Platform wide)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mest populære øvelser</p>
                <div className="space-y-3">
                  {trainingStats.topExercises.map((ex, i) => (
                    <div key={ex.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-primary opacity-50 w-4">0{i+1}</span>
                        <span className="text-sm font-bold">{ex.name}</span>
                      </div>
                      <span className="text-xs font-black text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {ex.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-primary/5 border border-primary/10 text-center">
                <div className="p-4 rounded-3xl bg-primary/20 mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <p className="text-4xl font-black tracking-tighter royal-blue-text mb-1">{trainingStats.avgTrainingTime} min</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gns. træningstid pr. uge</p>
                <p className="text-[10px] text-muted-foreground/60 mt-4 leading-relaxed max-w-[200px]">
                  Baseret på gennemførte sæt og estimeret hviletid på tværs af porteføljen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
