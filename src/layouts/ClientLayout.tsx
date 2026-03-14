import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ClipboardCheck, CheckSquare, MessageSquare, User, Dumbbell, Utensils, Layers, Target, Camera, BookOpen, Sparkles, Bot, Ruler, LogOut, Trophy, HelpCircle } from 'lucide-react';
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
  { to: '/client/guide', icon: HelpCircle, label: 'Guide' },
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
    <div className="min-h-screen flex flex-col bg-black selection:bg-primary/30 relative">
      <div className="aurora-bg" />
      
      <header className="flex items-center justify-between px-6 py-5 glass-dark border-b border-white/5 sticky top-0 z-50">
        <button onClick={signOut} className="p-2.5 rounded-xl bg-white/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300">
          <LogOut className="h-5 w-5" />
        </button>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xl font-black tracking-tighter royal-blue-text"
        >
          THE BUILD METHOD
        </motion.h1>
        <NotificationBell />
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-10 pb-32 z-10">
        <Outlet />
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 glass-dark rounded-3xl flex overflow-x-auto items-center py-2 px-6 z-50 scrollbar-hide border border-white/10 shadow-2xl">
        <div className="flex gap-4 min-w-max mx-auto h-full items-center">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1.5 px-5 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isActive
                  ? 'text-primary bg-primary/20 glow-royal-blue'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`
              }>
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground px-1 border-2 border-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="opacity-90">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
