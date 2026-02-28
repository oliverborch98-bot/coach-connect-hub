import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, TrendingUp, Award, AlertCircle, BarChart3, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { da } from 'date-fns/locale';
import { useMemo } from 'react';

export default function CoachAnalytics() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['analytics-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, status, current_month, start_weight, goal_weight, user_id, monthly_price, subscription_start, binding_end, subscription_status, profiles!client_profiles_user_id_fkey(full_name)');
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

  const { data: paymentEvents = [] } = useQuery({
    queryKey: ['analytics-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('amount_dkk, created_at, status')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });

  // MRR over time (last 6 months)
  const mrrData = useMemo(() => {
    const months: { month: string; mrr: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const label = format(d, 'MMM yy', { locale: da });
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);
      
      // Count clients active during this month
      const activeInMonth = clients.filter(c => {
        const start = new Date(c.subscription_start);
        return start <= monthEnd && (c.status === 'active' || start <= monthEnd);
      });
      const mrr = activeInMonth.reduce((sum, c) => sum + (c.monthly_price || 0), 0);
      months.push({ month: label, mrr });
    }
    return months;
  }, [clients]);

  // Churn / Retention
  const retentionData = useMemo(() => {
    const total = clients.length;
    if (total === 0) return { churnRate: 0, retentionRate: 100, churned: 0 };
    const churned = clients.filter(c => c.subscription_status === 'cancelled' || c.status === 'completed').length;
    const churnRate = Math.round((churned / total) * 100);
    return { churnRate, retentionRate: 100 - churnRate, churned };
  }, [clients]);

  // Revenue per month (from payment_events)
  const revenueData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      byMonth[format(d, 'yyyy-MM')] = 0;
    }
    paymentEvents.filter(p => p.status === 'paid').forEach(p => {
      if (!p.created_at) return;
      const key = format(new Date(p.created_at), 'yyyy-MM');
      if (key in byMonth) byMonth[key] += Number(p.amount_dkk) || 0;
    });
    return Object.entries(byMonth).map(([key, revenue]) => ({
      month: format(new Date(key + '-01'), 'MMM', { locale: da }),
      revenue,
    }));
  }, [paymentEvents]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const active = clients.filter(c => c.status === 'active');
  const completed = clients.filter(c => c.status === 'completed');
  const completionRate = clients.length > 0 ? Math.round((completed.length / clients.length) * 100) : 0;
  const currentMrr = active.reduce((sum, c) => sum + (c.monthly_price || 0), 0);

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

  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' };

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Analytics
      </motion.h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'MRR', value: `${currentMrr.toLocaleString('da-DK')} kr`, icon: DollarSign },
          { label: 'Aktive klienter', value: active.length, icon: Users },
          { label: 'Retention', value: `${retentionData.retentionRate}%`, icon: TrendingUp },
          { label: 'Churn', value: `${retentionData.churnRate}%`, icon: AlertCircle },
          { label: 'Gns. vægttab', value: `${avgWeightLoss} kg`, icon: Award },
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

      {/* MRR + Revenue charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">MRR udvikling</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mrrData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString('da-DK')} kr`, 'MRR']} />
              <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Omsætning per måned</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString('da-DK')} kr`, 'Omsætning']} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Compliance per måned</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
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
