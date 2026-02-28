import { CreditCard, AlertTriangle, ExternalLink, Loader2, Pause, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Props {
  clientId: string;
}

export default function ClientPaymentTab({ clientId }: Props) {
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['client-subscription', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ['client-payments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile-payment', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*, profiles!client_profiles_user_id_fkey(full_name, phone)')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  if (subLoading || payLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const isPastDue = clientProfile?.subscription_status === 'past_due';
  const statusLabel = subscription?.status === 'active' ? 'Aktiv' :
    subscription?.status === 'past_due' ? 'Mangler betaling' :
    subscription?.status === 'canceled' ? 'Annulleret' : 'Ingen abonnement';
  const statusColor = subscription?.status === 'active' ? 'text-success bg-success/10' :
    subscription?.status === 'past_due' ? 'text-destructive bg-destructive/10' :
    'text-muted-foreground bg-secondary';

  return (
    <div className="space-y-4">
      {/* Past due warning */}
      {isPastDue && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Betaling mangler</p>
            <p className="text-xs text-muted-foreground mt-1">Klienten har en mislykket betaling. Kontakt klienten for at løse problemet.</p>
            <a href={`tel:${clientProfile?.profiles?.phone}`} className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
              Ring op
            </a>
          </div>
        </div>
      )}

      {/* Subscription status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Abonnement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Produkt</p>
            <p className="mt-1">{subscription?.product_name ?? (clientProfile?.package_type === 'build_method' ? 'Build Method' : 'The System')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pris</p>
            <p className="mt-1">{clientProfile?.monthly_price?.toLocaleString('da-DK')} kr/md</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Næste betaling</p>
            <p className="mt-1">{subscription?.current_period_end ? format(new Date(subscription.current_period_end), 'd. MMM yyyy', { locale: da }) : '–'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Betalingsmetode</p>
            <p className="mt-1 capitalize">{subscription?.payment_method_brand ?? '–'} {subscription?.payment_method_last4 ? `•••• ${subscription.payment_method_last4}` : ''}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Binding udløber</p>
            <p className="mt-1">{clientProfile?.binding_end ? format(new Date(clientProfile.binding_end), 'd. MMM yyyy', { locale: da }) : '–'}</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Betalingshistorik</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen betalinger registreret endnu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-left font-medium">Dato</th>
                  <th className="py-2 text-left font-medium">Type</th>
                  <th className="py-2 text-right font-medium">Beløb</th>
                  <th className="py-2 text-right font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Faktura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">{p.created_at ? format(new Date(p.created_at), 'd. MMM yyyy', { locale: da }) : '–'}</td>
                    <td className="py-2.5 text-muted-foreground">{p.event_type?.replace('invoice.', '').replace('checkout.session.', '') ?? '–'}</td>
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
