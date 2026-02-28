import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, TrendingUp, Award, AlertCircle, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CoachAnalytics() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['analytics-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, status, current_month, start_weight, goal_weight, user_id, profiles!client_profiles_user_id_fkey(full_name)');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: allCheckins = [] } = useQuery({
    queryKey: ['analytics-checkins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('client_id, checkin_number, weight, status')
        .in('status', ['submitted', 'reviewed'])
        .order('checkin_number');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const active = clients.filter(c => c.status === 'active');
  const completed = clients.filter(c => c.status === 'completed');
  const completionRate = clients.length > 0 ? Math.round((completed.length / clients.length) * 100) : 0;

  const weightLosses = clients.map(c => {
    const sw = Number(c.start_weight) || 0;
    const clientCheckins = allCheckins.filter(ci => ci.client_id === c.id && ci.weight);
    const latest = clientCheckins.at(-1);
    return sw && latest ? sw - Number(latest.weight) : 0;
  }).filter(x => x !== 0);
  const avgWeightLoss = weightLosses.length > 0 ? (weightLosses.reduce((a, b) => a + b, 0) / weightLosses.length).toFixed(1) : '–';

  // Compliance per month
  const monthData: Record<number, { total: number; submitted: number }> = {};
  for (let m = 1; m <= 6; m++) monthData[m] = { total: 0, submitted: 0 };
  active.forEach(c => {
    const month = c.current_month ?? 1;
    for (let m = 1; m <= month; m++) {
      monthData[m].total++;
      const expectedCheckins = m * 4;
      const actualCheckins = allCheckins.filter(ci => ci.client_id === c.id && ci.checkin_number <= expectedCheckins).length;
      if (actualCheckins >= expectedCheckins * 0.8) monthData[m].submitted++;
    }
  });
  const chartData = Object.entries(monthData).map(([m, d]) => ({
    month: `Md ${m}`,
    compliance: d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0,
  }));

  const clientRanking = active.map(c => {
    const clientCheckins = allCheckins.filter(ci => ci.client_id === c.id);
    const month = c.current_month ?? 1;
    const expected = month * 4;
    const compliance = expected > 0 ? Math.round((clientCheckins.length / expected) * 100) : 100;
    return { name: c.profiles?.full_name ?? 'Ukendt', compliance: Math.min(compliance, 100), month };
  }).sort((a, b) => b.compliance - a.compliance);

  const topPerformers = clientRanking.filter(c => c.compliance >= 80);
  const needAttention = clientRanking.filter(c => c.compliance < 60);

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Analytics
      </motion.h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Aktive klienter', value: active.length, icon: Users },
          { label: 'Afsluttede', value: completed.length, icon: Award },
          { label: 'Gennemførelsesrate', value: `${completionRate}%`, icon: TrendingUp },
          { label: 'Gns. vægttab', value: `${avgWeightLoss} kg`, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Compliance per måned</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="compliance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Top performers</h3>
          {topPerformers.length === 0 ? <p className="text-xs text-muted-foreground">Ingen endnu</p> : (
            <div className="space-y-2">
              {topPerformers.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-primary font-semibold">{c.compliance}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Kræver opmærksomhed</h3>
          {needAttention.length === 0 ? <p className="text-xs text-muted-foreground">Alle på sporet 💪</p> : (
            <div className="space-y-2">
              {needAttention.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-destructive font-semibold">{c.compliance}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
