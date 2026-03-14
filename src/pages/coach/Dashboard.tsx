import { Users, AlertCircle, Phone, TrendingUp, CreditCard, Loader2, Sparkles, Filter } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ClientCard from '@/components/ClientCard';
import PremiumCard from '@/components/PremiumCard';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="space-y-10 max-w-7xl pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Premium Dashboard</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tighter"
          >
            Performance <span className="royal-blue-text">Oversigt</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Velkommen tilbage. Her er status på dine klienter.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-morphism rounded-2xl p-1 flex gap-1">
            {(['all', 'at_risk', 'past_due'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === f
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
              >
                {f === 'all' ? 'Alle' : f === 'at_risk' ? 'Risk' : 'Betaling'}
              </button>
            ))}
          </div>
          <div className="glass-morphism p-2.5 rounded-2xl">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Aktive klienter" value={String(activeCount)} icon={Users} />
        <StatCard label="Manglende check-ins" value={String(missingCheckins)} icon={AlertCircle} variant="warning" />
        <StatCard label="Calls denne uge" value="–" icon={Phone} />
        <StatCard label="Gns. compliance" value={`${avgCompliance}%`} icon={TrendingUp} variant="success" />
        <StatCard label="Manglende betaling" value={String(pastDueCount)} icon={CreditCard} variant={pastDueCount > 0 ? 'warning' : undefined} />
      </div>

      <PremiumCard
        title="Klientportefølje"
        subtitle="Administrer og spor din klientbase i realtid"
        headerAction={
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/80 focus:ring-0 cursor-pointer"
          >
            <option value="name">Sorter: Navn</option>
            <option value="compliance">Sorter: Compliance</option>
            <option value="month">Sorter: Måned</option>
          </select>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
            <p className="text-muted-foreground text-sm font-medium">Ingen klienter matcher de valgte kriterier.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((client, i) => (
                <motion.div
                  key={client.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ClientCard {...client} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
