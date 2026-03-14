import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Adgangsanmodninger</h1>
        {pending.length > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {pending.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 && handled.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Ingen anmodninger endnu</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Afventer ({pending.length})</h2>
              {pending.map(req => (
                <div key={req.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{req.name}</p>
                      <p className="text-sm text-muted-foreground">{req.email}</p>
                      {req.phone && <p className="text-xs text-muted-foreground">{req.phone}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(req.created_at), 'd. MMM yyyy', { locale: da })}
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-sm text-foreground/80 bg-secondary rounded-lg p-3">"{req.message}"</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 royal-blue-gradient rounded-lg py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Godkend & opret
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="rounded-lg py-2 px-4 text-sm font-medium text-muted-foreground border border-border hover:bg-secondary transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {handled.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Behandlet ({handled.length})</h2>
              {handled.map(req => (
                <div key={req.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between opacity-60">
                  <div>
                    <p className="font-medium text-foreground text-sm">{req.name}</p>
                    <p className="text-xs text-muted-foreground">{req.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    req.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {req.status === 'approved' ? 'Godkendt' : 'Afvist'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
