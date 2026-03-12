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
    <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden selection:bg-primary/30">
      {/* Cinematic Aurora Background */}
      <div className="aurora-bg" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse [animation-delay:3s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md"
          >
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/90">Premium Experience</span>
          </motion.div>

          <h1 className="text-5xl font-black tracking-tighter leading-none mb-3">
            <span className="lime-text drop-shadow-[0_0_25px_hsl(var(--primary)/40%)]">THE BUILD METHOD</span>
          </h1>
          <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.5em]">Performance Analytics</p>
        </div>

        <AnimatePresence mode="wait">
          {!showRequestForm && !showForgotPassword ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <form onSubmit={handleSubmit} className="space-y-6 liquid-glass p-10 rounded-[2.5rem] border border-white/10 shadow-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Email Identity</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-white/5 px-12 py-4 text-sm text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.08] transition-all"
                      placeholder="navn@domæne.dk"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2 relative z-10">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Security Key</label>
                  <div className="relative group/input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.08] transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold text-destructive text-center uppercase tracking-wider">{error}</motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full lime-gradient shadow-[0_15px_30px_-10px_rgba(132,255,0,0.3)] rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-3 mt-4 relative z-10"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'VERIFICERER...' : 'Enter Sanctuary'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(email); }}
                  className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all mt-4 relative z-10"
                >
                  Glemt din nøgle?
                </button>
              </form>

              <div className="mt-10 text-center">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-[11px] font-bold text-muted-foreground/40 hover:text-primary transition-colors group"
                >
                  Ny på platformen? <span className="text-primary uppercase tracking-tighter ml-1 border-b border-primary/20 group-hover:border-primary transition-all">Anmod om adgang</span>
                </button>
              </div>
            </motion.div>
          ) : showForgotPassword && !showRequestForm ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {resetSent ? (
                <div className="liquid-glass rounded-[2.5rem] border border-white/10 p-10 text-center space-y-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(132,255,0,0.2)]">
                    <Mail className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">NULSTILLING <span className="lime-text">SENDT</span></h2>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">
                      Tjek din inbox for <strong className="text-primary">{forgotEmail}</strong>. Vi har sendt dig en ny adgangsnøgle.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all border-b border-primary/20 pb-1"
                  >
                    TILBAGE TIL LOGIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6 liquid-glass rounded-[2.5rem] border border-white/10 p-10">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] lime-text">Nulstil Nøgle</h2>
                  </div>

                  <p className="text-[11px] text-muted-foreground/60 font-medium leading-relaxed">
                    Indtast din bekræftede email, så sender vi et nyt link til din digitale nøgle med det samme.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Din Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="din@email.dk"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full lime-gradient rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.2em] text-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
                  >
                    {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {isSendingReset ? 'SENDER...' : 'SEND NULSTILLING'}
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
              transition={{ duration: 0.5 }}
            >
              {requestSent ? (
                <div className="liquid-glass rounded-[2.5rem] border border-white/10 p-10 text-center space-y-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(132,255,0,0.2)]">
                    <Send className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">ANMODNING <span className="lime-text">MODTAGET</span></h2>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">
                      Vi behandler din anmodning om medlemskab. Du hører fra os indenfor kort tid.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowRequestForm(false); setRequestSent(false); }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all border-b border-primary/20 pb-1"
                  >
                    TILBAGE TIL LOGIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-5 liquid-glass rounded-[2.5rem] border border-white/10 p-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] lime-text">Anmod om Plads</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Fulde Navn</label>
                      <input
                        type="text"
                        value={reqName}
                        onChange={e => setReqName(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-3.5 text-sm"
                        placeholder="Thomas Andersen"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Email</label>
                      <input
                        type="email"
                        value={reqEmail}
                        onChange={e => setReqEmail(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-3.5 text-sm"
                        placeholder="thomas@domæne.dk"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Mobilnr.</label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={e => setReqPhone(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-3.5 text-sm"
                        placeholder="+45 00 00 00 00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Din Motivation</label>
                      <textarea
                        value={reqMessage}
                        onChange={e => setReqMessage(e.target.value)}
                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-3.5 text-sm min-h-[80px] resize-none"
                        placeholder="Hvad ønsker du at opnå med The Build Method?"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="w-full lime-gradient rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.2em] text-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 outline-none group"
                  >
                    {isSubmittingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {isSubmittingRequest ? 'SENDER...' : 'SEND ANMODNING'}
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
