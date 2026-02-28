import { Users, AlertCircle, Phone, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ClientCard from '@/components/ClientCard';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type FilterType = 'all' | 'at_risk' | 'past_due';

export default function CoachDashboard() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'month'>('name');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['coach-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_month, current_phase, status, user_id, package_type, subscription_status, monthly_price, profiles!client_profiles_user_id_fkey(full_name)')
        .eq('status', 'active');

      if (error) throw error;

      const clientsWithData = await Promise.all(
        (data as any[]).map(async (cp) => {
          const { data: checkins } = await supabase
            .from('weekly_checkins')
            .select('date, status, submitted_at')
            .eq('client_id', cp.id)
            .eq('status', 'submitted')
            .order('checkin_number', { ascending: false })
            .limit(1);

          const lastCheckin = checkins?.[0];
          const name = cp.profiles?.full_name ?? 'Ukendt';

          const { count: submittedCount } = await supabase
            .from('weekly_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', cp.id)
            .in('status', ['submitted', 'reviewed']);

          const month = cp.current_month ?? 1;
          const expectedCheckins = month * 4; // ~4 check-ins per month
          const compliance = expectedCheckins > 0 ? Math.round(((submittedCount ?? 0) / expectedCheckins) * 100) : 100;

          let clientStatus: 'on_track' | 'behind' | 'at_risk' = 'on_track';
          if (compliance < 50) clientStatus = 'at_risk';
          else if (compliance < 80) clientStatus = 'behind';

          return {
            id: cp.id,
            name,
            month,
            compliance: Math.min(compliance, 100),
            lastCheckin: lastCheckin?.submitted_at
              ? new Date(lastCheckin.submitted_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
              : 'Ingen endnu',
            status: clientStatus,
            packageType: cp.package_type as string,
            subscriptionStatus: cp.subscription_status as string,
          };
        })
      );

      return clientsWithData;
    },
  });

  const filtered = clients
    .filter(c => {
      if (filter === 'at_risk') return c.status === 'at_risk' || c.status === 'behind';
      if (filter === 'past_due') return c.subscriptionStatus === 'past_due';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'compliance') return b.compliance - a.compliance;
      if (sortBy === 'month') return b.month - a.month;
      return a.name.localeCompare(b.name);
    });

  const activeCount = clients.length;
  const missingCheckins = clients.filter(c => c.lastCheckin === 'Ingen endnu').length;
  const pastDueCount = clients.filter(c => c.subscriptionStatus === 'past_due').length;
  const avgCompliance = clients.length > 0
    ? Math.round(clients.reduce((sum, c) => sum + c.compliance, 0) / clients.length)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold"
      >
        Oversigt
      </motion.h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Aktive klienter" value={String(activeCount)} icon={Users} />
        <StatCard label="Manglende check-ins" value={String(missingCheckins)} icon={AlertCircle} variant="warning" />
        <StatCard label="Calls denne uge" value="–" icon={Phone} />
        <StatCard label="Gns. compliance" value={`${avgCompliance}%`} icon={TrendingUp} variant="success" />
        <StatCard label="Manglende betaling" value={String(pastDueCount)} icon={CreditCard} variant={pastDueCount > 0 ? 'warning' : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'at_risk', 'past_due'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Alle' : f === 'at_risk' ? 'Opmærksomhed' : 'Manglende betaling'}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
          >
            <option value="name">Navn</option>
            <option value="compliance">Compliance</option>
            <option value="month">Måned</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Ingen klienter fundet</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((client, i) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ClientCard {...client} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
