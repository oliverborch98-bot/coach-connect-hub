import { Users, AlertCircle, Phone, TrendingUp, CreditCard, Loader2, Sparkles, Filter, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import StatCard from '@/components/StatCard';
import ClientCard from '@/components/ClientCard';
import PremiumCard from '@/components/PremiumCard';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { subDays, startOfToday } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type ClientRow = Database['public']['Tables']['client_profiles']['Row'] & {
  profiles: { full_name: string | null } | null;
};

interface ClientWithData {
  id: string;
  name: string;
  month: number;
  compliance: number;
  lastCheckin: string;
  status: 'on_track' | 'behind' | 'at_risk';
  packageType: string;
  subscriptionStatus: string;
}

type FilterType = 'all' | 'at_risk' | 'past_due';

export default function CoachDashboard() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'month'>('name');
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['coach-dashboard-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('client_profiles')
        .select(`
          id, current_month, current_phase, status, user_id, package_type, subscription_status, monthly_price, onboarding_completed,
          profiles!client_profiles_user_id_fkey(full_name)
        `)
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      // 2. Fetch check-ins from the last 7 days
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: recentCheckins } = await supabase
        .from('weekly_checkins')
        .select('client_id, created_at, status')
        .gte('created_at', sevenDaysAgo);

      // 3. Fetch pending payments for coach's clients
      const clientIds = (clientsData as ClientRow[]).map(c => c.id);
      const { data: pendingPayments } = await supabase
        .from('payment_events')
        .select('id, client_id')
        .eq('status', 'pending')
        .in('client_id', clientIds);

      // 4. Process and compute stats
      const clientsWithData: ClientWithData[] = (clientsData as ClientRow[]).map((cp) => {
        const hasCheckin = recentCheckins?.some(checkin => checkin.client_id === cp.id);
        const name = cp.profiles?.full_name ?? 'Ukendt';
        const compliance = hasCheckin ? 100 : 0;
        
        let clientStatus: 'on_track' | 'behind' | 'at_risk' = 'on_track';
        if (!hasCheckin) clientStatus = 'at_risk';

        return {
          id: cp.id,
          name,
          month: cp.current_month ?? 1,
          compliance,
          lastCheckin: hasCheckin ? 'Gennemført' : 'Mangler',
          status: clientStatus,
          packageType: cp.package_type || 'Custom',
          subscriptionStatus: cp.subscription_status || 'active',
        };
      });

      const activeCount = clientsWithData.length;
      const missingCheckins = clientsWithData.filter(c => c.compliance === 0).length;
      const pastDueCount = pendingPayments?.length ?? 0;
      const avgCompliance = activeCount > 0
        ? Math.round(clientsWithData.reduce((sum, c) => sum + c.compliance, 0) / activeCount)
        : 0;

      const newClients = (clientsData as any[])
        .filter(cp => !cp.onboarding_completed)
        .map(cp => ({
          id: cp.id,
          name: cp.profiles?.full_name ?? 'Ukendt'
        }));

      return {
        clients: clientsWithData,
        newClients,
        stats: {
          activeCount,
          missingCheckins,
          avgCompliance,
          pastDueCount
        }
      };
    },
  });

  const handleSendReminder = async (clientId: string, clientName: string) => {
    try {
      const { data: cp } = await supabase
        .from('client_profiles')
        .select('profiles!client_profiles_user_id_fkey(email)')
        .eq('id', clientId)
        .single();
      
      const email = (cp as any)?.profiles?.email;
      if (!email) throw new Error('Client email not found');

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Påmindelse: Gennemfør din onboarding',
          html: `<p>Hej ${clientName},</p><p>Husk at gennemføre din onboarding profil hos Built By Borch, så vi kan komme rigtigt i gang!</p><p><a href="${window.location.origin}/login">Log ind her</a></p>`
        }
      });

      if (error) throw error;
      toast.success(`Påmindelse sendt til ${clientName}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Kunne ikke sende påmindelse");
    }
  };

  const clients = dashboardData?.clients ?? [];
  const stats = dashboardData?.stats ?? {
    activeCount: 0,
    missingCheckins: 0,
    avgCompliance: 0,
    pastDueCount: 0
  };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_read', false);
      if (error) throw error;
      return data?.length ?? 0;
    },
    refetchInterval: 30000,
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

  const { activeCount, missingCheckins, pastDueCount, avgCompliance } = stats;

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Premium Dashboard</span>
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
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 min-h-[44px] ${filter === f
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

      {/* AI Morning Briefing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-dark rounded-[2.5rem] border border-white/5 p-6 sm:p-8 relative overflow-hidden group shadow-2xl shadow-primary/5"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Intelligence Briefing</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Godmorgen Borch. <br />
              Her er din <span className="royal-blue-text">action plan</span> for i dag.
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-xl border border-white/5">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">{unreadCount > 0 ? `${unreadCount} ulæste beskeder` : 'Ingen nye beskeder'}</span>
              </div>
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-xl border border-white/5">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold">{clients.filter((c) => c.status === 'at_risk').length} klienter under observation</span>
              </div>
              <div className="flex items-center gap-2 glass-dark px-4 py-2 rounded-xl border border-white/5">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold">{avgCompliance}% gennemsnitlig compliance</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => unreadCount > 0 ? navigate('/coach/messages') : setFilter('at_risk')}
            className="royal-blue-gradient px-8 py-4.5 rounded-2xl text-primary-foreground font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 shrink-0 min-h-[44px]"
          >
            {unreadCount > 0 ? 'Bevar overblikket' : 'Se detaljeret status'}
          </button>
        </div>
      </motion.div>

      {/* New Clients Widget */}
      <AnimatePresence>
        {dashboardData?.newClients && dashboardData.newClients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-dark rounded-[2rem] border border-primary/20 p-6 sm:p-8 relative overflow-hidden group shadow-2xl shadow-primary/5 mb-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] -translate-y-1/2 -translate-x-1/2 rounded-full" />
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                       <Users className="h-3 w-3 text-primary" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Onboarding Status</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Nye <span className="royal-blue-text">klienter</span></h2>
                    <p className="text-muted-foreground text-xs font-medium mt-1">Disse klienter har endnu ikke gennemført deres onboarding profil.</p>
                  </div>
                  <div className="bg-primary/20 text-primary px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-[0.2em]">
                    {dashboardData.newClients.length} afventer
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.newClients.map((client) => (
                    <div 
                      key={client.id}
                      className="glass-morphism rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4 hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[120px]">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Afventer profil</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendReminder(client.id, client.name)}
                        className="bg-white/5 hover:bg-primary/20 text-foreground hover:text-primary p-2.5 rounded-xl transition-all border border-white/5 hover:border-primary/30"
                        title="Send påmindelse"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 focus:ring-0 cursor-pointer min-h-[44px]"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
