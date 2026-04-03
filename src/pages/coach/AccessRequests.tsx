import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export default function AccessRequests() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as AccessRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('access_requests' as any)
        .update({ status, reviewed_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-requests'] }),
  });

  const handleApprove = async (req: AccessRequest) => {
    updateStatus.mutate({ id: req.id, status: 'approved' });

    // Send approval email to the requester
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: req.email,
          subject: 'Din adgangsanmodning er godkendt! 🎉',
          html: `
            <h2 style="color:#D4A853;font-size:18px;margin-top:0">Velkommen ombord, ${req.name}!</h2>
            <p>Din anmodning om adgang til The Build Method er blevet godkendt.</p>
            <p>Du vil snart modtage en separat email med dine login-oplysninger, så du kan komme i gang.</p>
            <p style="color:#888;font-size:13px;margin-top:24px">Vi glæder os til at hjælpe dig med at nå dine mål!</p>
          `,
        },
      });
    } catch (e) {
      console.error('Approval email failed:', e);
    }

    toast.success(`${req.name} godkendt — opret klienten nu`);
    navigate(`/coach/new-client?name=${encodeURIComponent(req.name)}&email=${encodeURIComponent(req.email)}&phone=${encodeURIComponent(req.phone || '')}`);
  };

  const handleReject = async (req: AccessRequest) => {
    updateStatus.mutate({ id: req.id, status: 'rejected' });

    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: req.email,
          subject: 'Vedrørende din anmodning',
          html: `
            <h2 style="color:#D4A853;font-size:18px;margin-top:0">Hej ${req.name},</h2>
            <p>Tak for din interesse i The Build Method.</p>
            <p>Desværre har vi ikke mulighed for at tilbyde dig en plads på nuværende tidspunkt.</p>
            <p>Det kan skyldes, at vi har fuldt booket lige nu, men du er altid velkommen til at søge igen på et senere tidspunkt.</p>
            <p style="color:#888;font-size:13px;margin-top:24px">Med venlig hilsen,<br/>Oliver Borch</p>
          `,
        },
      });
    } catch (e) {
      console.error('Rejection email failed:', e);
    }

    toast.info(`${req.name} afvist`);
  };

  const pending = requests?.filter(r => r.status === 'pending') || [];
  const handled = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <UserPlus className="h-6 w-6 text-primary text-glow-royal-blue shadow-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter royal-blue-text">Adgangs-anmodninger</h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Behandle nye klient-anmodninger</p>
          </div>
        </div>
        {pending.length > 0 && (
          <span className="w-fit bg-primary text-primary-foreground text-xs font-black px-2 py-0.5 rounded-lg shadow-lg shadow-primary/20 uppercase tracking-widest sm:ml-auto">
            {pending.length} NYE
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      ) : pending.length === 0 && handled.length === 0 ? (
        <div className="glass-morphism p-12 text-center rounded-3xl">
          <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Ingen anmodninger endnu</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/80 ml-1">Afventer ({pending.length})</h2>
              {pending.map((req, i) => (
                <motion.div 
                  key={req.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-morphism rounded-3xl p-6 space-y-4 relative overflow-hidden group hover:border-primary/20 transition-all border border-white/5"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <UserPlus className="h-12 w-12 text-primary" />
                  </div>

                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-lg font-black tracking-tight text-foreground">{req.name}</p>
                      <p className="text-sm text-muted-foreground font-medium">{req.email}</p>
                      {req.phone && <p className="text-xs text-muted-foreground/60 font-medium mt-0.5">{req.phone}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(req.created_at), 'd. MMM yyyy', { locale: da })}
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-sm text-foreground/80 bg-white/5 border border-white/5 rounded-2xl p-4 italic relative">
                      <span className="text-primary text-xl absolute -top-1 -left-1 opacity-20">"</span>
                      {req.message}
                      <span className="text-primary text-xl absolute -bottom-4 right-2 opacity-20">"</span>
                    </p>
                  )}
                  <div className="flex gap-3 pt-2 relative z-10">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 royal-blue-gradient rounded-xl py-3 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 min-h-[44px]"
                    >
                      <Check className="h-4 w-4" /> Godkend & opret
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="rounded-xl py-3 px-5 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground border border-white/5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all min-h-[44px]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {handled.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/80 ml-1">Behandlet ({handled.length})</h2>
              <div className="grid gap-3">
                {handled.map(req => (
                  <div key={req.id} className="glass-morphism rounded-2xl p-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity border border-white/5 bg-white/[0.02]">
                    <div>
                      <p className="font-black text-foreground text-sm tracking-tight">{req.name}</p>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{req.email}</p>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                      req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {req.status === 'approved' ? 'Godkendt' : 'Afvist'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
