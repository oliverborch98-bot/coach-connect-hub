import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, CheckSquare, MessageSquare, User, Dumbbell, Utensils, Layers, Target, Camera, BookOpen, Sparkles, Bot, Ruler, LogOut, Trophy } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Hjem', end: true },
  { to: '/client/training', icon: Dumbbell, label: 'Træning' },
  { to: '/client/nutrition', icon: Utensils, label: 'Kost' },
  { to: '/client/phases', icon: Layers, label: 'Faser' },
  { to: '/client/goals', icon: Target, label: 'Mål' },
  { to: '/client/checkin', icon: ClipboardCheck, label: 'Check-in' },
  { to: '/client/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/client/photos', icon: Camera, label: 'Billeder' },
  { to: '/client/measurements', icon: Ruler, label: 'Målinger' },
  { to: '/client/resources', icon: BookOpen, label: 'Ressourcer' },
  { to: '/client/transformation', icon: Sparkles, label: 'Transformation' },
  { to: '/client/ai', icon: Bot, label: 'AI Chat' },
  { to: '/client/leaderboard', icon: Trophy, label: 'Rangliste' },
  { to: '/client/messages', icon: MessageSquare, label: 'Beskeder', badge: true },
  { to: '/client/profile', icon: User, label: 'Profil' },
];

export default function ClientLayout() {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-base font-bold gold-text">THE BUILD METHOD</h1>
        <NotificationBell />
      </header>

      <main className="flex-1 overflow-auto p-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex overflow-x-auto py-2 z-50 scrollbar-hide">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 min-w-[4rem] px-2 py-1.5 text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }>
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
