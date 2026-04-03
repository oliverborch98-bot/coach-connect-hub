import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardCheck, CheckSquare, MessageSquare, User, Dumbbell, Utensils, Layers, Target, Camera, BookOpen, Sparkles, Bot, Ruler, LogOut, Trophy, HelpCircle, Menu, X, Phone, Library } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/client', icon: LayoutDashboard, labelKey: 'home', end: true },
  { to: '/client/training', icon: Dumbbell, labelKey: 'training' },
  { to: '/client/nutrition', icon: Utensils, labelKey: 'food' },
  { to: '/client/phases', icon: Layers, labelKey: 'phases' },
  { to: '/client/goals', icon: Target, labelKey: 'goals' },
  { to: '/client/checkin', icon: ClipboardCheck, labelKey: 'checkin' },
  { to: '/client/habits', icon: CheckSquare, labelKey: 'habits' },
  { to: '/client/photos', icon: Camera, labelKey: 'photos' },
  { to: '/client/measurements', icon: Ruler, labelKey: 'measurements' },
  { to: '/client/resources', icon: BookOpen, labelKey: 'resources' },
  { to: '/client/exercises', icon: Library, labelKey: 'exercises' },
  { to: '/client/transformation', icon: Sparkles, labelKey: 'transformation' },
  { to: '/client/ai', icon: Bot, labelKey: 'ai_chat' },
  { to: '/client/ai-assistant', icon: Bot, labelKey: 'ai_assistant' },
  { to: '/client/calls', icon: Phone, labelKey: 'calls' },
  { to: '/client/leaderboard', icon: Trophy, labelKey: 'leaderboard' },
  { to: '/client/guide', icon: HelpCircle, labelKey: 'guide' },
  { to: '/client/messages', icon: MessageSquare, labelKey: 'messages', badge: true },
  { to: '/client/profile', icon: User, labelKey: 'profile' },
];

export default function ClientLayout() {
  const { signOut, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 ${isActive
      ? 'bg-primary/20 text-primary text-glow-royal-blue shadow-[0_0_20px_-5px_hsl(var(--primary)/20%)]'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-primary/30 relative">
      <div className="aurora-bg" />
      
      <header className="flex items-center justify-between px-4 py-4 glass-dark border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl pt-safe">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-black tracking-tighter royal-blue-text md:text-xl"
          >
            THE BUILD METHOD
          </motion.h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'da' ? 'en' : 'da')}
            className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-95 font-black text-sm"
          >
            {language === 'da' ? '🇩🇰' : '🇬🇧'}
          </button>
          <NotificationBell />
          <button onClick={signOut} className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive active:scale-95 transition-all">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm glass-dark border-r border-white/10 z-[70] p-6 flex flex-col pt-safe pb-safe"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-xl font-black tracking-tighter royal-blue-text">THE BUILD METHOD</h1>
                  <p className="text-[14px] uppercase tracking-widest text-primary font-black mt-1">{t('client_menu')}</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide -mx-2 px-2">
                {navItems.map((item, idx) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) => linkClass(isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="tracking-tight">{t(item.labelKey)}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button onClick={signOut} className="flex items-center gap-3 px-4 py-4 text-[14px] font-bold text-muted-foreground hover:text-destructive transition-all w-full hover:bg-destructive/10 rounded-xl">
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-auto p-4 md:p-10 pb-32 z-10">
        <Outlet />
      </main>

      <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 h-18 glass-dark rounded-[24px] flex justify-around items-center px-2 z-50 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {[
          { to: '/client', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
          { to: '/client/training', icon: Dumbbell, labelKey: 'training' },
          { to: '/client/nutrition', icon: Utensils, labelKey: 'food' },
          { to: '/client/habits', icon: CheckSquare, labelKey: 'habits' },
          { to: '/client/messages', icon: MessageSquare, labelKey: 'chat', badge: true },
        ].map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-300 active:scale-90 ${isActive
                ? 'text-primary bg-primary/20 glow-royal-blue border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`
            }>
            <div className="relative flex flex-col items-center gap-0.5">
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{t(item.labelKey)}</span>
              {item.badge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-3 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground px-1 border border-black">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
