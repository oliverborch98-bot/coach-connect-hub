import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AINutritionBuilder() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [pastedPlan, setPastedPlan] = useState('');
  const [coachPrompt, setCoachPrompt] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['coach-clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, profiles!client_profiles_user_id_fkey(full_name)')
        .eq('status', 'active');
      if (error) throw error;
      return data as any[];
    },
  });

  const buildMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Vælg en klient');
      if (!pastedPlan.trim()) throw new Error('Indsæt en kostplan');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Ikke logget ind');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-build-nutrition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ clientId, pastedPlan, coachPrompt }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Fejl');
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Kostplan "${data.planName}" oprettet og tildelt klienten!`);
      navigate(`/coach/client/${clientId}`);
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved AI-opbygning'),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/coach')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Kostplan Builder</h1>
            <p className="text-sm text-muted-foreground">Indsæt din kostplan – AI strukturerer og gemmer den</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Vælg klient</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Vælg klient..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.profiles?.full_name ?? 'Unavngivet'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Indsæt din kostplan</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Indsæt din kostplan her... F.eks:&#10;Måltid 1 - Morgenmad&#10;4 æg, 2 skiver rugbrød, avocado&#10;&#10;Måltid 2 - Frokost&#10;200g kylling, 150g ris, grøntsager&#10;..."
            className="min-h-[200px] font-mono text-sm"
            value={pastedPlan}
            onChange={(e) => setPastedPlan(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Ekstra instruktioner (valgfrit)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="F.eks: Beregn makroer, juster til 2200 kcal, tilføj et snack-måltid..."
            className="min-h-[80px]"
            value={coachPrompt}
            onChange={(e) => setCoachPrompt(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full h-12 text-base gap-2"
        onClick={() => buildMutation.mutate()}
        disabled={buildMutation.isPending || !clientId || !pastedPlan.trim()}
      >
        {buildMutation.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            AI arbejder...
          </>
        ) : buildMutation.isSuccess ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Kostplan oprettet!
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Byg & gem kostplan med AI
          </>
        )}
      </Button>
    </div>
  );
}
