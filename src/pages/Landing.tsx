import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  Brain, 
  BarChart3, 
  Users, 
  Calendar, 
  Zap, 
  Trophy, 
  Layout, 
  Activity,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Globe,
  Plus,
  ArrowUpRight,
  MessageSquare,
  Utensils
} from "lucide-react";

// --- HELPERS & STYLES ---

const GLASS_CARD = "bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden";
const ROYAL_BLUE = "#2563eb";
const GOLD = "#D4A853";

// --- SUB-COMPONENTS ---

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <button 
      onClick={() => setLanguage(language === 'da' ? 'en' : 'da')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <Globe className="w-4 h-4 text-[#2563eb]" />
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">
        {language === 'da' ? '🇩🇰 DA' : '🇬🇧 EN'}
      </span>
    </button>
  );
};

const DashboardMockup = () => (
  <div className="w-full aspect-video bg-[#0d0d1a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative group">
    <div className="absolute inset-0 bg-gradient-to-tr from-[#2563eb]/10 to-transparent pointer-events-none" />
    
    {/* Sidebar */}
    <div className="absolute top-0 left-0 bottom-0 w-[15%] border-r border-white/5 bg-[#0a0a0f] p-4 hidden md:block">
      <div className="w-8 h-8 rounded-lg bg-[#2563eb] mb-8" />
      <div className="space-y-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-2 rounded-full w-full ${i === 1 ? 'bg-[#2563eb]' : 'bg-white/5'}`} />
        ))}
      </div>
    </div>

    {/* Header */}
    <div className="absolute top-0 right-0 left-0 md:left-[15%] h-14 border-b border-white/5 bg-[#0a0a0f] px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-32 h-2 bg-white/5 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-white/5" />
        <div className="w-8 h-8 rounded-full bg-[#2563eb]/20" />
      </div>
    </div>

    {/* Body */}
    <div className="absolute top-14 bottom-0 left-0 md:left-[15%] right-0 p-6 grid grid-cols-12 gap-6 overflow-hidden">
      {/* Metric Cards */}
      <div className="col-span-12 md:col-span-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
              <div className="w-1/2 h-2 bg-white/10 rounded-full mb-2" />
              <div className="w-2/3 h-4 bg-white/20 rounded-full" />
              {i === 2 && <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-[#2563eb]/20 blur-xl rounded-full" />}
            </div>
          ))}
        </div>
        
        {/* Graph Card */}
        <div className="h-48 bg-white/5 rounded-3xl border border-white/5 p-6 relative">
          <div className="w-1/4 h-2 bg-white/10 rounded-full mb-8" />
          <div className="absolute bottom-6 left-6 right-6 h-20 flex items-end gap-2">
            {[40, 70, 50, 90, 60, 80, 45, 100, 70, 90, 110, 85].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1 + (i * 0.05), duration: 1 }}
                className={`flex-1 rounded-t-sm ${i > 7 ? 'bg-[#2563eb]' : 'bg-[#2563eb]/30'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Side Content */}
      <div className="col-span-12 md:col-span-4 space-y-6">
        <div className="h-full bg-white/5 rounded-3xl border border-white/5 p-6">
          <div className="w-1/2 h-2 bg-white/10 rounded-full mb-6" />
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="w-full h-1.5 bg-white/5 rounded-full" />
                  <div className="w-2/3 h-1.5 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- INTERNAL COMPONENTS ---

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`${GLASS_CARD} !rounded-3xl`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left group"
      >
        <span className="font-bold text-lg text-white group-hover:text-[#2563eb] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-[#2563eb] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 text-[#94a3b8] text-sm leading-relaxed font-medium">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'coach' ? '/coach' : '/client'} replace />;

  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NavLinks = () => (
    <>
      <a href="#features" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">{t('nav_features')}</a>
      <a href="#saadan-virker-det" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">{t('nav_how_it_works')}</a>
      <a href="#faq" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">{t('nav_faq')}</a>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-[#2563eb]/30 overflow-x-hidden font-inter">
      {/* Background Animated Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#2563eb]/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#2563eb]/5 blur-[150px] rounded-full animate-pulse [animation-delay:3s]" />
      </div>

      {/* --- NAVBAR --- */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
          scrolled 
            ? "py-3 bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5 translate-y-0" 
            : "py-6 bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-white">
              BUILT BY <span className="text-[#2563eb]">BORCH</span>
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <Link 
              to="/login" 
              className="px-6 py-2.5 rounded-xl border border-[#2563eb]/50 text-[#2563eb] text-sm font-black uppercase tracking-widest hover:bg-[#2563eb] hover:text-white transition-all active:scale-95"
            >
              {t('nav_login')}
            </Link>
            <button 
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[110] bg-[#0a0a0f]/95 backdrop-blur-2xl p-6 flex flex-col pt-24"
          >
            <button 
              className="absolute top-6 right-6 p-2 text-gray-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <div className="flex flex-col gap-8 items-center text-center">
              <NavLinks />
              <div className="pt-8 border-t border-white/5 w-full flex justify-center">
                <LanguageToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative pt-40 pb-20 px-6 lg:pt-60 lg:pb-32 z-10">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-[#2563eb] animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2563eb]">
              {t('hero_badge')}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.85] mb-8"
          >
            <span className="text-[#D4A853] block drop-shadow-[0_0_30px_rgba(212,168,83,0.2)]">
              {t('hero_title').split('. ')[0]}.
            </span>
            <span className="text-white block mt-2">
              {t('hero_title').split('. ')[1]}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[#94a3b8] text-lg lg:text-2xl max-w-3xl mx-auto mb-16 font-medium leading-relaxed"
          >
            {t('hero_subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-24"
          >
            <Link 
              to="/login"
              className="px-10 py-5 rounded-2xl bg-[#2563eb] text-white font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#2563eb]/40"
            >
              {t('hero_cta_start')}
            </Link>
            <button 
              onClick={() => document.getElementById('saadan-virker-det')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 transition-all"
            >
              {t('hero_cta_demo')}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="relative lg:max-w-6xl mx-auto"
          >
             <DashboardMockup />
             {/* Abstract floating elements */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#2563eb]/20 blur-[60px] rounded-full pointer-events-none" />
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D4A853]/10 blur-[60px] rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: SOCIAL PROOF BAR --- */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t('stats_exercises'), val: "50+" },
              { label: t('stats_ai'), val: "AI" },
              { label: t('stats_danish'), val: "100%" },
              { label: t('stats_clients'), val: "∞" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-5xl font-black text-[#D4A853] mb-2 tracking-tighter flex items-center justify-center gap-2">
                  {stat.val === 'AI' && <Zap className="w-6 h-6 text-[#2563eb]" />}
                  {stat.val}
                </div>
                <div className="text-[#94a3b8] text-[10px] uppercase font-black tracking-widest leading-tight">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: FEATURES GRID --- */}
      <section id="features" className="py-24 lg:py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'ai', icon: Brain, title: t('feature_ai_title'), desc: t('feature_ai_desc') },
              { id: 'macro', icon: Utensils, title: t('feature_macro_title'), desc: t('feature_macro_desc') },
              { id: 'group', icon: Users, title: t('feature_group_title'), desc: t('feature_group_desc') },
              { id: 'calls', icon: Calendar, title: t('feature_calls_title'), desc: t('feature_calls_desc') },
              { id: 'habits', icon: Zap, title: t('feature_habits_title'), desc: t('feature_habits_desc') },
              { id: 'analytics', icon: BarChart3, title: t('feature_analytics_title'), desc: t('feature_analytics_desc') },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`${GLASS_CARD} p-8 group transition-all duration-500 hover:border-[#2563eb]/40 hover:bg-[#2563eb]/[0.02]`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563eb]/20 transition-all duration-500">
                  <feature.icon className="w-6 h-6 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-black mb-4 tracking-tight text-white group-hover:text-[#2563eb] transition-colors">{feature.title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-6 font-medium">
                  {feature.desc}
                </p>
                <div className="pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2563eb]">
                     Deep dive <ArrowUpRight className="w-3 h-3" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: SÅDAN VIRKER DET --- */}
      <section id="saadan-virker-det" className="py-24 lg:py-40 px-6 bg-white/[0.01] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-16">
            {[
              { title: t('how_step_1_title'), desc: t('how_step_1_desc'), icon: Users },
              { title: t('how_step_2_title'), desc: t('how_step_2_desc'), icon: Brain },
              { title: t('how_step_3_title'), desc: t('how_step_3_desc'), icon: Activity },
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="text-[120px] font-black text-[#2563eb]/5 absolute -top-16 -left-4 pointer-events-none select-none">
                  0{i + 1}
                </div>
                <div className="relative z-10">
                   <div className="w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black mb-6 shadow-xl shadow-[#2563eb]/20">
                     <step.icon className="w-5 h-5" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
                   <p className="text-[#94a3b8] text-sm leading-relaxed font-medium mb-8">
                     {step.desc}
                   </p>
                   {/* Mini CSS Mockup for each step */}
                   <div className="h-32 bg-white/5 rounded-2xl border border-white/5 overflow-hidden p-4 relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {i === 0 && (
                        <div className="space-y-3">
                          <div className="flex gap-2 items-center">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="flex-1 h-2 bg-white/10 rounded-full" />
                          </div>
                          <div className="w-full h-8 bg-[#2563eb]/20 rounded-lg flex items-center px-3">
                            <div className="w-1/2 h-1.5 bg-[#2563eb]/50 rounded-full" />
                          </div>
                        </div>
                      )}
                      {i === 1 && (
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                             {[1,2,3].map(j => <div key={j} className="w-full h-1.5 bg-white/5 rounded-full" />)}
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-[#2563eb]/20 flex items-center justify-center border border-[#2563eb]/30">
                            <Brain className="w-6 h-6 text-[#2563eb]" />
                          </div>
                        </div>
                      )}
                      {i === 2 && (
                        <div className="flex items-end gap-1 h-full">
                          {[30, 60, 45, 80, 50, 90].map((h, j) => (
                            <div key={j} className="flex-1 bg-[#2563eb]/30 rounded-t-sm" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: FEATURE DEEP-DIVE --- */}
      <section className="py-24 lg:py-48 px-6 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto space-y-32 lg:space-y-64">
          {/* Deep Dive A */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 mb-8 text-[#2563eb] text-[10px] font-black uppercase tracking-widest">
                <Brain className="w-3.5 h-3.5" /> Intelligence
              </div>
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9] mb-8">
                <span className="text-[#D4A853] block mb-2">{t('deep_ai_title').split(' ')[0]}</span>
                <span className="text-white">{t('deep_ai_title').split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-[#94a3b8] text-lg leading-relaxed mb-10 font-medium max-w-xl">
                {t('deep_ai_desc')}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: MessageSquare, label: "AI Translation" },
                  { icon: Utensils, label: "Smart Recipes" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                      <item.icon className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <span className="font-bold text-sm text-white/80">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="aspect-square rounded-[3rem] bg-gradient-to-tr from-[#2563eb]/20 to-transparent p-1">
                <div className="w-full h-full bg-[#0d0d1a] rounded-[2.8rem] border border-white/10 p-12 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2563eb]/10 via-transparent to-transparent group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative z-10 w-full space-y-6">
                    <div className="h-12 bg-white/5 rounded-2xl border border-white/5 p-4 flex items-center gap-3">
                      <Plus className="w-4 h-4 text-[#2563eb]" />
                      <div className="flex-1 h-2 bg-white/10 rounded-full" />
                    </div>
                    <div className="h-32 bg-[#2563eb]/10 rounded-3xl border border-[#2563eb]/20 p-6 flex flex-col justify-center gap-3">
                       <div className="w-2/3 h-2 bg-[#2563eb]/40 rounded-full" />
                       <div className="w-full h-2 bg-[#2563eb]/40 rounded-full" />
                       <div className="w-1/2 h-2 bg-[#2563eb]/40 rounded-full" />
                    </div>
                    <div className="flex justify-end">
                      <div className="w-32 h-10 rounded-xl bg-[#2563eb] shadow-lg shadow-[#2563eb]/20 flex items-center justify-center text-[10px] font-black uppercase tracking-widest">
                        Process with AI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Deep Dive B - Automated Onboarding */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-32">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 mb-8 text-[#2563eb] text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5" /> Efficiency
              </div>
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9] mb-8">
                <span className="text-[#D4A853] block mb-2">{t('deep_onboard_title').split(' ')[0]}</span>
                <span className="text-white">{t('deep_onboard_title').split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-[#94a3b8] text-lg leading-relaxed mb-10 font-medium max-w-xl">
                {t('deep_onboard_desc')}
              </p>
              <ul className="space-y-4">
                {[
                  "Automatiske velkomstmails",
                  "Digital kontrakt signering",
                  "6-trins wizard til dataindsamling"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-[#2563eb]" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="aspect-video rounded-[3rem] bg-gradient-to-tl from-[#2563eb]/20 to-transparent p-1">
                <div className="w-full h-full bg-[#0d0d1a] rounded-[2.8rem] border border-white/10 p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="w-full flex justify-between mb-8 px-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i <= 3 ? 'bg-[#2563eb]' : 'bg-white/5'}`} />
                    ))}
                  </div>
                  <div className="w-full space-y-4">
                    <div className="text-center mb-8">
                      <div className="w-32 h-2 bg-white/10 rounded-full mx-auto mb-2" />
                      <div className="w-24 h-2 bg-white/5 rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[1,2,3,4].map(i => (
                         <div key={i} className={`h-12 rounded-xl border border-white/5 flex items-center px-4 ${i === 1 ? 'bg-[#2563eb]/10 border-[#2563eb]/30' : 'bg-white/5'}`}>
                           <div className="w-1/2 h-1.5 bg-white/10 rounded-full" />
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 6: TESTIMONIALS --- */}
      <section className="py-24 lg:py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { text: t('testimonial_1'), name: "Marcus", title: "Fitness Client" },
              { text: t('testimonial_2'), name: "Sofie", title: "Online Coach" },
              { text: t('testimonial_3'), name: "Andreas", title: "Personal Trainer" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${GLASS_CARD} p-10 relative group hover:border-[#2563eb]/30 transition-all duration-500`}
              >
                <div className="flex gap-1 mb-8 text-[#2563eb]">
                  {[1,2,3,4,5].map(j => <Trophy key={j} className="w-4 h-4 shadow-[0_0_10px_rgba(37,99,235,0.3)]" />)}
                </div>
                <p className="text-xl italic text-white/90 font-medium leading-relaxed mb-10">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center font-black text-[#2563eb]">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-black text-white">{t.name}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">
                      {t.title}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 7: FAQ ACCORDION --- */}
      <section id="faq" className="py-24 lg:py-40 px-6 bg-white/[0.01] border-y border-white/5 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-[#D4A853] mb-6 uppercase">FAQ</h2>
          </motion.div>

          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <FaqItem 
                key={i} 
                question={t(`faq_q${i}` as any)} 
                answer={t(`faq_a${i}` as any)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 8: FINAL CTA --- */}
      <section className="py-24 lg:py-48 px-6 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
           <div className="relative rounded-[3.5rem] bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] p-12 lg:p-24 overflow-hidden shadow-2xl shadow-[#2563eb]/30">
              <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 skew-x-[30deg] translate-x-1/2" />
              <div className="relative z-10 text-center">
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-none"
                 >
                    {t('cta_title')}
                 </motion.h2>
                 <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-white/80 text-lg lg:text-xl font-medium mb-12 max-w-2xl mx-auto"
                 >
                    {t('cta_subtitle')}
                 </motion.p>
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                 >
                    <Link 
                      to="/login"
                      className="inline-flex px-12 py-6 rounded-2xl bg-white text-[#0a0a0f] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      {t('cta_button')}
                    </Link>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* --- SECTION 9: FOOTER --- */}
      <footer className="py-24 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-8">
                <span className="text-xl font-black tracking-tighter text-[#D4A853]">BUILT BY BORCH</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
              </div>
              <p className="text-[#94a3b8] text-xs font-medium leading-relaxed max-w-[200px]">
                Den mest avancerede platform til online fitness coaches.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#2563eb] mb-6">{t('footer_platform')}</h4>
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Features</a>
                <a href="#saadan-virker-det" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Process</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#2563eb] mb-6">{t('footer_account')}</h4>
              <div className="flex flex-col gap-4">
                <Link to="/login" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Log ind</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#2563eb] mb-6">{t('footer_contact')}</h4>
              <div className="flex flex-col gap-4">
                <a href="mailto:contact@builtbyborch.dk" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Email</a>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:row items-center justify-between gap-8">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              {t('footer_rights')}
            </div>
            <LanguageToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
