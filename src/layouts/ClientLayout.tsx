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
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <header className="flex items-center justify-between px-6 py-4 glass-dark border-b border-white/5 sticky top-0 z-50">
        <button onClick={signOut} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300">
          <LogOut className="h-5 w-5" />
        </button>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-black tracking-tighter gold-text"
        >
          THE BUILD METHOD
        </motion.h1>
        <NotificationBell />
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8 pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-dark/95 backdrop-blur-xl border-t border-white/5 flex overflow-x-auto py-3 px-4 z-50 scrollbar-hide">
        <div className="flex gap-2 min-w-max mx-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive
                  ? 'text-primary bg-primary/10 shadow-[0_0_15px_-5px_hsl(40_60%_58%_/_0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`
              }>
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground px-1 border-2 border-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="opacity-80">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
