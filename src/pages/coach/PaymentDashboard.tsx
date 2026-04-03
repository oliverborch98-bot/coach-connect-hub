import { CreditCard, AlertTriangle, TrendingUp, Loader2, ExternalLink, DollarSign, Users, XCircle, Link as LinkIcon, CheckCircle2, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

export default function PaymentDashboard() {
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-clients'],
    queryFn: async () => {
      // First get all client profiles and basic info
      const { data: cpData, error: cpError } = await supabase
        .from('client_profiles')
        .select('*, profiles!client_profiles_user_id_fkey(full_name, phone)')
        .order('created_at', { ascending: false });
      
      if (cpError) throw cpError;

      // Then get all subscriptions
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subError) throw subError;

      // Merge them
      return cpData.map(client => ({
        ...client,
        active_subscription: subData.find(s => s.client_id === client.id)
      })) as any[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('*, client_profiles!payment_events_client_id_fkey(id, profiles!client_profiles_user_id_fkey(full_name))')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const handleCreateCheckout = async (userId: string, packageType: string) => {
    setGeneratingLink(userId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { userId, package: packageType }
      });

      if (error) throw error;
      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success('Betalingslink kopieret til udklipsholder!');
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Kunne ikke generere betalingslink: ' + err.message);
    } finally {
      setGeneratingLink(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeClients = clients.filter(c => c.active_subscription?.status === 'active');
  const pastDueClients = clients.filter(c => c.active_subscription?.status === 'past_due');
  const cancelledClients = clients.filter(c => c.active_subscription?.status === 'canceled');
  const mrr = clients.reduce((sum, c) => {
    if (c.active_subscription?.status !== 'active') return sum;
    const price = c.active_subscription.package === 'build_method' ? 1500 : 1000;
    return sum + price;
  }, 0);

  // Upcoming payments (next 30 days)
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const upcoming = clients
    .filter(c => {
      const sub = c.active_subscription;
      if (!sub?.current_period_end) return false;
      const end = new Date(sub.current_period_end);
      return end >= now && end <= in30Days && sub.status === 'active';
    })
    .sort((a, b) => {
      const aEnd = new Date(a.active_subscription.current_period_end);
      const bEnd = new Date(b.active_subscription.current_period_end);
      return aEnd.getTime() - bEnd.getTime();
    });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Betalingsoversigt</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Månedlig indkomst (MRR)', value: `${mrr.toLocaleString('da-DK')} kr`, icon: DollarSign, color: 'text-primary' },
          { label: 'Aktive abonnementer', value: activeClients.length, icon: Users, color: 'text-success' },
          { label: 'Manglende betaling', value: pastDueClients.length, icon: AlertTriangle, color: pastDueClients.length > 0 ? 'text-destructive' : 'text-muted-foreground' },
          { label: 'Annulleret', value: cancelledClients.length, icon: XCircle, color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Client Subscriptions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Klient abonnementer
          </h2>
        </div>
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-sm min-w-[700px] md:min-w-0">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Klient</th>
                <th className="px-5 py-3 font-medium">Pakke</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Næste betaling</th>
                <th className="px-5 py-3 text-right font-medium">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map(c => {
                const sub = c.active_subscription;
                const pkg = sub?.package || c.package_type;
                const status = sub?.status || 'inactive';
                
                return (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium">{c.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.profiles?.phone || 'Intet nummer'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        pkg === 'build_method' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/10 text-secondary border border-secondary/20'
                      }`}>
                        {pkg === 'build_method' ? 'Build Method' : 'The System'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          status === 'active' ? 'bg-success animate-pulse' :
                          status === 'past_due' ? 'bg-destructive' :
                          'bg-muted-foreground'
                        }`} />
                        <span className="text-xs capitalize">{status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {sub?.current_period_end ? format(new Date(sub.current_period_end), 'd. MMMM yyyy', { locale: da }) : '–'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleCreateCheckout(c.user_id, pkg)}
                        disabled={generatingLink === c.user_id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {generatingLink === c.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LinkIcon className="h-3.5 w-3.5" />
                        )}
                        Send betalingslink
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Betalingshistorik</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen betalinger endnu</p>
        ) : (
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full text-xs min-w-[600px] md:min-w-0">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-left font-medium">Dato</th>
                  <th className="py-2 text-left font-medium">Klient</th>
                  <th className="py-2 text-right font-medium">Beløb</th>
                  <th className="py-2 text-right font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Faktura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">
                      {p.created_at ? format(new Date(p.created_at), 'd. MMM yyyy', { locale: da }) : '–'}
                    </td>
                    <td className="py-2.5">{p.client_profiles?.profiles?.full_name ?? '–'}</td>
                    <td className="py-2.5 text-right font-medium">{p.amount_dkk ? `${Number(p.amount_dkk).toLocaleString('da-DK')} kr` : '–'}</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        p.status === 'paid' ? 'bg-success/10 text-success' :
                        p.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {p.status === 'paid' ? 'Betalt' : p.status === 'failed' ? 'Fejlet' : p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {p.invoice_pdf_url ? (
                        <a href={p.invoice_pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          PDF <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
