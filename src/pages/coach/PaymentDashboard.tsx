import { CreditCard, AlertTriangle, TrendingUp, Loader2, ExternalLink, DollarSign, Users, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function PaymentDashboard() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['payment-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*, profiles!client_profiles_user_id_fkey(full_name, phone), subscriptions(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeClients = clients.filter(c => c.subscription_status === 'active');
  const pastDueClients = clients.filter(c => c.subscription_status === 'past_due');
  const cancelledClients = clients.filter(c => c.subscription_status === 'cancelled');
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_price || 0), 0);

  // Upcoming payments (next 30 days)
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const upcoming = clients
    .filter(c => {
      const sub = c.subscriptions?.[0] || c.subscriptions;
      if (!sub?.current_period_end) return false;
      const end = new Date(sub.current_period_end);
      return end >= now && end <= in30Days && c.subscription_status === 'active';
    })
    .sort((a, b) => {
      const aEnd = new Date(a.subscriptions?.[0]?.current_period_end || a.subscriptions?.current_period_end || 0);
      const bEnd = new Date(b.subscriptions?.[0]?.current_period_end || b.subscriptions?.current_period_end || 0);
      return aEnd.getTime() - bEnd.getTime();
    });

  return (
    <div className="space-y-6 max-w-5xl">
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

      {/* Past due clients */}
      {pastDueClients.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Klienter med manglende betaling
          </h2>
          <div className="space-y-2">
            {pastDueClients.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-destructive/10 last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.profiles?.full_name ?? 'Ukendt'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.package_type === 'build_method' ? 'Build Method' : 'The System'} — {c.monthly_price?.toLocaleString('da-DK')} kr/md
                  </p>
                </div>
                <a
                  href={`tel:${c.profiles?.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                >
                  Kontakt
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming payments */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Kommende betalinger (30 dage)
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen kommende betalinger</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(c => {
              const sub = c.subscriptions?.[0] || c.subscriptions;
              const nextDate = sub?.current_period_end ? new Date(sub.current_period_end) : null;
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                  <div>
                    <span className="font-medium">{c.profiles?.full_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {c.package_type === 'build_method' ? 'Build Method' : 'The System'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{c.monthly_price?.toLocaleString('da-DK')} kr</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {nextDate ? format(nextDate, 'd. MMM', { locale: da }) : '–'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Betalingshistorik</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen betalinger endnu</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
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
