import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Phone, UserPlus, Settings, LogOut, Dumbbell, UtensilsCrossed, BarChart3, Library, CreditCard, Sparkles, ChefHat, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/coach', icon: LayoutDashboard, label: 'Oversigt', end: true },
  { to: '/coach/calls', icon: Phone, label: 'Calls' },
  { to: '/coach/new-client', icon: UserPlus, label: 'Ny klient' },
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
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card/50 p-5 shrink-0">
        <div className="mb-8">
          <h1 className="text-lg font-extrabold tracking-tight gold-text">THE BUILD METHOD</h1>
          <p className="text-xs text-muted-foreground mt-1">{user?.fullName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkClass(isActive)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 px-3 py-2">
          <NotificationBell />
          {unreadCount > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {unreadCount} ulæst{unreadCount !== 1 ? 'e' : ''} besked{unreadCount !== 1 ? 'er' : ''}
            </span>
          )}
        </div>
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
          Log ud
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-base font-bold gold-text">THE BUILD METHOD</h1>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={signOut}><LogOut className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around py-2 z-50">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
