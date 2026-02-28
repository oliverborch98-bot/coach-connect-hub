import { User, LogOut, Loader2, CreditCard, ExternalLink, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function ClientProfile() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setAge(profile.age?.toString() ?? '');
    }
  }, [profile]);

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['my-payments', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          age: age ? parseInt(age) : null,
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
      toast({ title: 'Profil opdateret' });
    },
    onError: (err: any) => {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    },
  });

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isPastDue = clientProfile?.subscription_status === 'past_due';

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Min Profil</h1>
      </div>

      {/* Avatar & name */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
          {initials}
        </div>
        <div>
          <p className="font-semibold">{profile?.full_name ?? '–'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Profile details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Oplysninger</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">
              Rediger
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Navn</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Telefon</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Alder</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="gold-gradient rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground">
                {updateMutation.isPending ? 'Gemmer...' : 'Gem'}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm bg-secondary text-foreground">
                Annuller
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="text-sm">{profile?.phone ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alder</p>
              <p className="text-sm">{profile?.age ? `${profile.age} år` : '–'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Program info */}
      {clientProfile && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Mit forløb</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Pakke</p>
              <p>{clientProfile.package_type === 'build_method' ? 'Build Method' : 'The System'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="capitalize">{clientProfile.status ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Periode</p>
              <p>Måned {clientProfile.current_month ?? 1}/6</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fase</p>
              <p className="capitalize">{clientProfile.current_phase ?? '–'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription & Payment */}
      {clientProfile && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Abonnement & Betaling
          </h2>

          {isPastDue && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              Din betaling er fejlet. Opdater din betalingsmetode nedenfor.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                subscription?.status === 'active' ? 'bg-success/10 text-success' :
                subscription?.status === 'past_due' ? 'bg-destructive/10 text-destructive' :
                'bg-secondary text-muted-foreground'
              }`}>
                {subscription?.status === 'active' ? 'Aktiv' : subscription?.status === 'past_due' ? 'Mangler betaling' : subscription?.status ?? 'Ingen'}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pris</p>
              <p>{clientProfile.monthly_price?.toLocaleString('da-DK')} kr/md</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Næste betaling</p>
              <p>{subscription?.current_period_end ? format(new Date(subscription.current_period_end), 'd. MMM yyyy', { locale: da }) : '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Betalingsmetode</p>
              <p className="capitalize">{subscription?.payment_method_brand ?? '–'} {subscription?.payment_method_last4 ? `•••• ${subscription.payment_method_last4}` : ''}</p>
            </div>
          </div>

          <button
            onClick={openCustomerPortal}
            disabled={portalLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary p-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Administrer abonnement
          </button>

          {clientProfile.package_type === 'the_system' && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Opgradér til Build Method</p>
              </div>
              <p className="text-xs text-muted-foreground">Få flere coaching calls, fysiske træninger og daglig WhatsApp-support for +500 kr/md.</p>
            </div>
          )}
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Betalingshistorik</h2>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {p.created_at ? format(new Date(p.created_at), 'd. MMM yyyy', { locale: da }) : '–'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{p.amount_dkk ? `${Number(p.amount_dkk).toLocaleString('da-DK')} kr` : '–'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    p.status === 'paid' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {p.status === 'paid' ? 'Betalt' : 'Fejlet'}
                  </span>
                  {p.invoice_pdf_url && (
                    <a href={p.invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Log ud
      </button>
    </div>
  );
}
