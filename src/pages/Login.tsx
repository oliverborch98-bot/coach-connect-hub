import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, ArrowLeft, Send, Mail } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gold-text">THE BUILD METHOD</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Coach Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {!showRequestForm ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-xl border border-border p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="din@email.dk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gold-gradient rounded-lg py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Logger ind...' : 'Log ind'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Har du ikke en konto? <span className="text-primary font-medium">Anmod om adgang</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {requestSent ? (
                <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Anmodning sendt!</h2>
                  <p className="text-sm text-muted-foreground">
                    Din anmodning er sendt til coachen. Du vil modtage dine loginoplysninger, når din profil er oprettet.
                  </p>
                  <button
                    onClick={() => { setShowRequestForm(false); setRequestSent(false); }}
                    className="text-sm text-primary hover:underline"
                  >
                    Tilbage til login
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleRequestAccess} className="space-y-4 bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h2 className="text-sm font-semibold text-foreground">Anmod om adgang</h2>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Fulde navn *</label>
                      <input
                        type="text"
                        value={reqName}
                        onChange={e => setReqName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Thomas Andersen"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Email *</label>
                      <input
                        type="email"
                        value={reqEmail}
                        onChange={e => setReqEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="din@email.dk"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Telefon</label>
                      <input
                        type="tel"
                        value={reqPhone}
                        onChange={e => setReqPhone(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">Besked til coachen</label>
                      <textarea
                        value={reqMessage}
                        onChange={e => setReqMessage(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[70px]"
                        placeholder="Fortæl lidt om dine mål..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="w-full gold-gradient rounded-lg py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isSubmittingRequest ? 'Sender...' : 'Send anmodning'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
