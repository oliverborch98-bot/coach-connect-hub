import { Users, AlertCircle, Phone, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ClientCard from '@/components/ClientCard';
import { useState } from 'react';
import { motion } from 'framer-motion';

const mockClients = [
  { id: '1', name: 'Thomas Andersen', week: 7, compliance: 92, lastCheckin: '22. feb', status: 'on_track' as const },
  { id: '2', name: 'Mikkel Hansen', week: 4, compliance: 67, lastCheckin: '20. feb', status: 'behind' as const },
  { id: '3', name: 'Jonas Larsen', week: 11, compliance: 95, lastCheckin: '23. feb', status: 'on_track' as const },
  { id: '4', name: 'Frederik Nielsen', week: 2, compliance: 45, lastCheckin: '15. feb', status: 'at_risk' as const },
  { id: '5', name: 'Kasper Møller', week: 9, compliance: 88, lastCheckin: '22. feb', status: 'on_track' as const },
  { id: '6', name: 'Emil Christensen', week: 6, compliance: 73, lastCheckin: '21. feb', status: 'behind' as const },
  { id: '7', name: 'Oliver Pedersen', week: 1, compliance: 100, lastCheckin: '24. feb', status: 'on_track' as const },
  { id: '8', name: 'Noah Rasmussen', week: 8, compliance: 81, lastCheckin: '23. feb', status: 'on_track' as const },
];

type FilterType = 'all' | 'active' | 'at_risk';

export default function CoachDashboard() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'week'>('name');

  const filtered = mockClients
    .filter(c => {
      if (filter === 'at_risk') return c.status === 'at_risk' || c.status === 'behind';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'compliance') return b.compliance - a.compliance;
      if (sortBy === 'week') return b.week - a.week;
      return a.name.localeCompare(b.name);
    });

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
        <StatCard label="Aktive klienter" value="8" icon={Users} subtitle="+2 denne måned" />
        <StatCard label="Manglende check-ins" value="3" icon={AlertCircle} subtitle="Denne uge" variant="warning" />
        <StatCard label="Calls denne uge" value="2" icon={Phone} subtitle="Næste: I morgen kl. 10" />
        <StatCard label="Gns. compliance" value="87%" icon={TrendingUp} subtitle="+3% fra sidste uge" variant="success" />
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
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((client, i) => (
          <motion.div key={client.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ClientCard {...client} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
