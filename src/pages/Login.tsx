import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, ArrowLeft, Send, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Login() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Request form state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success('Nulstillingslink sendt!');
    } catch (err: any) {
      toast.error(err.message || 'Kunne ikke sende nulstillingslink');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase.from('access_requests' as any).insert({
        name: reqName,
        email: reqEmail,
        phone: reqPhone || null,
        message: reqMessage || null,
      } as any);
      if (error) throw error;
      setRequestSent(true);
      toast.success('Din anmodning er sendt!');
    } catch (err: any) {
      toast.error(err.message || 'Kunne ikke sende anmodning');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Premium Access</span>
          </motion.div>

          <h1 className="text-4xl font-black tracking-tighter leading-none">
            <span className="gold-text drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">THE BUILD METHOD</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Performance Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {!showRequestForm && !showForgotPassword ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <form onSubmit={handleSubmit} className="space-y-5 glass-morphism p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.08] transition-all"
                      placeholder="din@email.dk"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.08] transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] font-bold text-destructive text-center">{error}</motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gold-gradient shadow-[0_10px_20px_rgba(212,175,55,0.2)] rounded-xl py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Logger ind...' : 'Enter Platform'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(email); }}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all mt-2"
                >
                  Glemt password?
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-[11px] font-bold text-muted-foreground/60 hover:text-primary transition-colors group"
                >
                  Har du ikke en konto? <span className="text-primary uppercase tracking-tighter ml-1 border-b border-primary/20 group-hover:border-primary transition-all">Anmod om adgang</span>
                </button>
              </div>
            </motion.div>
            <motion.div
              key="forgot"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {resetSent ? (
                <div className="glass-morphism rounded-3xl border border-white/10 p-8 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                    <Mail className="h-6 w-6 text-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Tjek din <span className="gold-text">email</span></h2>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      Vi har sendt et link til <strong className="text-foreground">{forgotEmail}</strong> hvor du kan nulstille dit password.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-all border-b border-primary/20"
                  >
                    Tilbage til login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4 glass-morphism rounded-3xl border border-white/10 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-widest text-glow">Nulstil password</h2>
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed">
                    Indtast din email nedenfor, og vi sender dig et sikkert nulstillingslink med det samme.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="din@email.dk"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full gold-gradient rounded-xl py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {isSendingReset ? 'Sender...' : 'Send link'}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="request"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {requestSent ? (
                <div className="glass-morphism rounded-3xl border border-white/10 p-8 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                    <Send className="h-6 w-6 text-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Anmodning <span className="gold-text">sendt</span></h2>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      Vi behandler din anmodning hurtigst muligt. Du hører fra os på din email inden længe.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowRequestForm(false); setRequestSent(false); }}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-all border-b border-primary/20"
                  >
                    Tilbage til login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4 glass-morphism rounded-3xl border border-white/10 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-widest text-glow">Anmod om adgang</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Navn</label>
                      <input
                        type="text"
                        value={reqName}
                        onChange={e => setReqName(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                        placeholder="Thomas Andersen"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Email</label>
                      <input
                        type="email"
                        value={reqEmail}
                        onChange={e => setReqEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                        placeholder="din@email.dk"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Telefon</label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={e => setReqPhone(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">Motiv</label>
                      <textarea
                        value={reqMessage}
                        onChange={e => setReqMessage(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm min-h-[60px]"
                        placeholder="Kort besked til coachen..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="w-full gold-gradient rounded-xl py-3.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmittingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSubmittingRequest ? 'Sender...' : 'Anmod Nu'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
