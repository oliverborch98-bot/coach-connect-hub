import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Phone, UserPlus, Settings, LogOut, Dumbbell, UtensilsCrossed, BarChart3, Library, CreditCard, Sparkles, ChefHat, MessageSquare, InboxIcon, Menu, X, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBell from '@/components/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/coach', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
  { to: '/coach/messages', icon: MessageSquare, labelKey: 'messages' },
  { to: '/coach/calls', icon: Phone, labelKey: 'calls' },
  { to: '/coach/new-client', icon: UserPlus, labelKey: 'new_client' },
  { to: '/coach/access-requests', icon: InboxIcon, labelKey: 'requests' },
  { to: '/coach/program-builder', icon: Dumbbell, labelKey: 'program' },
  { to: '/coach/nutrition-builder', icon: UtensilsCrossed, labelKey: 'nutrition' },
  { to: '/coach/habits', icon: CheckSquare, labelKey: 'habits' },
  { to: '/coach/exercises', icon: Library, labelKey: 'exercises' },
  { to: '/coach/recipes', icon: ChefHat, labelKey: 'recipes' },
  { to: '/coach/ai-program', icon: Sparkles, labelKey: 'ai_program' },
  { to: '/coach/ai-nutrition', icon: Sparkles, labelKey: 'ai_nutrition' },
  { to: '/coach/payments', icon: CreditCard, labelKey: 'payments' },
  { to: '/coach/analytics', icon: BarChart3, labelKey: 'analytics' },
  { to: '/coach/settings', icon: Settings, labelKey: 'settings' },
];

export default function CoachLayout() {
  const { signOut, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return data.length;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] transition-all duration-500 ${isActive
      ? 'bg-primary/20 text-primary font-extrabold text-glow-royal-blue shadow-[0_0_20px_-5px_hsl(var(--primary)/30%)]'
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
            <p className="text-[14px] uppercase tracking-[0.3em] text-primary/80 font-black">Coach Portal</p>
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
                <span className="tracking-tight">{t(item.labelKey)}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <NavLink to="/coach/messages" className="flex items-center justify-between px-4 py-3 glass-dark rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <NotificationBell />
                {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{t('inbox')}</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary font-black animate-pulse">
                    {unreadCount} {t('new_messages')}
                  </span>
                )}
              </div>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </NavLink>

          <button onClick={signOut} className="flex items-center gap-3 px-4 py-4 text-[14px] font-bold text-muted-foreground hover:text-destructive transition-all duration-300 w-full hover:bg-destructive/10 rounded-xl">
            <LogOut className="h-4 w-4" />
            <span>{t('end_session')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-4 glass-dark border-b border-white/5 z-20 sticky top-0 backdrop-blur-xl pt-safe">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-black tracking-tighter royal-blue-text truncate max-w-[180px]">Built By Borch</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'da' ? 'en' : 'da')}
              className="p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-95 font-black text-sm"
            >
              {language === 'da' ? '🇩🇰' : '🇬🇧'}
            </button>
            <NotificationBell />
            <button onClick={signOut} className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 active:scale-95 transition-all ml-1">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[85%] max-w-sm glass-dark border-r border-white/10 z-[70] p-6 flex flex-col md:hidden pt-safe pb-safe"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-xl font-black tracking-tighter royal-blue-text">THE BUILD METHOD</h1>
                    <p className="text-[14px] uppercase tracking-widest text-primary font-black mt-1">{t('coach_menu')}</p>
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

        <main className="flex-1 overflow-auto p-4 md:p-10 pb-32 md:pb-10 z-10">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 h-18 glass-dark rounded-[24px] flex justify-around items-center px-2 z-50 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {[
            { to: '/coach', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
            { to: '/coach/messages', icon: MessageSquare, labelKey: 'messages' },
            { to: '/coach/program-builder', icon: Dumbbell, labelKey: 'program' },
            { to: '/coach', icon: UserPlus, labelKey: 'clients' }, // Mapping Ny klient/Klienter to dashboard/client list
          ].map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-300 active:scale-90 ${isActive ? 'bg-primary/20 text-primary glow-royal-blue shadow-[0_0_15px_-5px_hsl(var(--primary)/30%)] border border-primary/20' : 'text-muted-foreground'}`
              }>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{t(item.labelKey)}</span>
            </NavLink>
          ))}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-300 active:scale-90 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{t('more')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
