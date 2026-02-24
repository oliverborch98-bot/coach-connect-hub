import { Users, AlertCircle, Phone, TrendingUp, Loader2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ClientCard from '@/components/ClientCard';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type FilterType = 'all' | 'active' | 'at_risk';

interface ClientRow {
  id: string;
  current_week: number | null;
  status: string | null;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export default function CoachDashboard() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'week'>('name');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['coach-clients'],
    queryFn: async () => {
      // Fetch client profiles with their profile names
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_week, status, user_id, profiles!client_profiles_user_id_fkey(full_name)')
        .eq('status', 'active');

      if (error) throw error;

      // For each client, get latest checkin
      const clientsWithCheckins = await Promise.all(
        (data as any[]).map(async (cp) => {
          const { data: checkins } = await supabase
            .from('weekly_checkins')
            .select('date, status, submitted_at')
            .eq('client_id', cp.id)
            .eq('status', 'submitted')
            .order('week_number', { ascending: false })
            .limit(1);

          const lastCheckin = checkins?.[0];
          const name = cp.profiles?.full_name ?? 'Ukendt';
          
          // Calculate compliance: submitted checkins / total expected
          const { count: submittedCount } = await supabase
            .from('weekly_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', cp.id)
            .in('status', ['submitted', 'reviewed']);

          const week = cp.current_week ?? 0;
          const compliance = week > 0 ? Math.round(((submittedCount ?? 0) / week) * 100) : 100;

          let clientStatus: 'on_track' | 'behind' | 'at_risk' = 'on_track';
          if (compliance < 50) clientStatus = 'at_risk';
          else if (compliance < 80) clientStatus = 'behind';

          return {
            id: cp.id,
            name,
            week,
            compliance: Math.min(compliance, 100),
            lastCheckin: lastCheckin?.submitted_at
              ? new Date(lastCheckin.submitted_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
              : 'Ingen endnu',
            status: clientStatus,
          };
        })
      );

      return clientsWithCheckins;
    },
  });

  const filtered = clients
    .filter(c => {
      if (filter === 'at_risk') return c.status === 'at_risk' || c.status === 'behind';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'compliance') return b.compliance - a.compliance;
      if (sortBy === 'week') return b.week - a.week;
      return a.name.localeCompare(b.name);
    });

  const activeCount = clients.length;
  const missingCheckins = clients.filter(c => c.lastCheckin === 'Ingen endnu').length;
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Aktive klienter" value={String(activeCount)} icon={Users} />
        <StatCard label="Manglende check-ins" value={String(missingCheckins)} icon={AlertCircle} variant="warning" />
        <StatCard label="Calls denne uge" value="–" icon={Phone} />
        <StatCard label="Gns. compliance" value={`${avgCompliance}%`} icon={TrendingUp} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'at_risk'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Alle' : 'Opmærksomhed'}
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
            <option value="week">Uge</option>
          </select>
        </div>
      </div>

      {/* Client Cards */}
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
