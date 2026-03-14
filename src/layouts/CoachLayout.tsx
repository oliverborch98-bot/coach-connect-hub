import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Phone, UserPlus, Settings, LogOut, Dumbbell, UtensilsCrossed, BarChart3, Library, CreditCard, Sparkles, ChefHat, MessageSquare, InboxIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/coach', icon: LayoutDashboard, label: 'Oversigt', end: true },
  { to: '/coach/calls', icon: Phone, label: 'Calls' },
  { to: '/coach/new-client', icon: UserPlus, label: 'Ny klient' },
  { to: '/coach/access-requests', icon: InboxIcon, label: 'Anmodninger' },
  { to: '/coach/program-builder', icon: Dumbbell, label: 'Program' },
  { to: '/coach/nutrition-builder', icon: UtensilsCrossed, label: 'Kostplan' },
  { to: '/coach/exercises', icon: Library, label: 'Øvelser' },
  { to: '/coach/recipes', icon: ChefHat, label: 'Opskrifter' },
  { to: '/coach/ai-program', icon: Sparkles, label: 'AI Program' },
  { to: '/coach/ai-nutrition', icon: Sparkles, label: 'AI Kost' },
  { to: '/coach/payments', icon: CreditCard, label: 'Betaling' },
  { to: '/coach/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/coach/settings', icon: Settings, label: 'Indstillinger' },
];

export default function CoachLayout() {
  const { signOut, user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-500 ${isActive
      ? 'bg-primary/20 text-primary font-bold text-glow-royal-blue shadow-[0_0_20px_-5px_hsl(var(--primary)/30%)]'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen flex w-full bg-black selection:bg-primary/30 relative">
      <div className="aurora-bg" />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col glass-dark border-r border-white/5 p-8 shrink-0 z-20">
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black tracking-tighter royal-blue-text"
          >
            THE BUILD METHOD
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 font-black">Coach Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide pr-2">
          {navItems.map((item, idx) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <NavLink to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive)}>
                <item.icon className="h-4 w-4" />
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center justify-between px-4 py-3 glass-dark rounded-2xl border-white/5">
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Inbox</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-primary font-black animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
            </div>
          </div>

          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-destructive transition-all duration-300 w-full hover:bg-destructive/10 rounded-xl">
            <LogOut className="h-4 w-4" />
            <span>Afbryd session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-5 glass-dark border-b border-white/5 z-20">
          <h1 className="text-lg font-black tracking-tighter royal-blue-text">THE BUILD METHOD</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={signOut} className="p-2 rounded-lg bg-white/5 text-muted-foreground"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-10 pb-24 md:pb-10 z-10">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-dark rounded-2xl flex justify-around items-center px-4 z-50 border border-white/10 shadow-2xl">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/20 text-primary glow-royal-blue' : 'text-muted-foreground'}`
              }>
              <item.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
