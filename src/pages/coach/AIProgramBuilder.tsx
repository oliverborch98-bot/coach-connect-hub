import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sparkles, Loader2, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AIProgramBuilder() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [programType, setProgramType] = useState('');
  const [weeks, setWeeks] = useState('12');
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [previewProgram, setPreviewProgram] = useState<any>(null);

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

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Vælg en klient');
      if (!programType) throw new Error('Vælg en programtype');
      if (!description.trim()) throw new Error('Beskriv programmet');
      if (!weeks || !daysPerWeek) throw new Error('Udfyld antal uger og dage');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session udløbet. Prøv at logge ind igen.');

      console.log('Genererer program for:', { clientId, programType, weeks, daysPerWeek });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-program-builder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            clientId, 
            type: programType, 
            weeks: parseInt(weeks, 10), 
            daysPerWeek: parseInt(daysPerWeek, 10), 
            description 
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        console.error('AI Builder Error:', result);
        throw new Error(result.error || result.message || 'Der skete en fejl ved AI-generering');
      }

      if (!result.program || !result.program.days) {
        throw new Error('AI returnerede et tomt program. Prøv at uddybe din beskrivelse.');
      }

      return result.program;
    },
    onSuccess: (data) => {
      setPreviewProgram(data);
      toast.success('Program genereret! Du kan nu gennemgå og gemme det.');
    },
    onError: (err: any) => {
      console.error('Mutation Error:', err);
      toast.error(err.message || 'Fejl ved AI-generering');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!previewProgram || !clientId) throw new Error('Manglende program eller klient');
      
      const { data: client } = await supabase.from("client_profiles").select("current_phase").eq("id", clientId).single();

      // Gem til training_programs
      const { data: dbProgram, error: pErr } = await supabase
        .from("training_programs")
        .insert({ 
          client_id: clientId, 
          name: previewProgram.programName, 
          phase: client?.current_phase || "foundation", 
          status: "active" 
        })
        .select("id")
        .single();
        
      if (pErr) throw pErr;

      // Gem til training_days og training_exercises
      for (let di = 0; di < (previewProgram.days ?? []).length; di++) {
        const day = previewProgram.days[di];
        const { data: dbDay, error: dErr } = await supabase
          .from("training_days")
          .insert({ program_id: dbProgram.id, day_name: day.dayName, day_order: di })
          .select("id")
          .single();
          
        if (dErr) throw dErr;

        const exInserts = (day.exercises ?? [])
          .filter((ex: any) => ex.exerciseId)
          .map((ex: any, ei: number) => ({
            training_day_id: dbDay.id,
            exercise_id: ex.exerciseId,
            exercise_order: ei,
            sets: ex.sets ?? 3,
            reps: ex.reps ?? "8-12",
            rest_seconds: ex.restSeconds ?? 90,
            notes: ex.notes || null,
          }));

        if (exInserts.length > 0) {
          const { error: eErr } = await supabase.from("training_exercises").insert(exInserts);
          if (eErr) throw eErr;
        }
      }

      return previewProgram.programName;
    },
    onSuccess: (programName) => {
      const clientName = clients.find(c => c.id === clientId)?.profiles?.full_name ?? 'klienten';
      toast.success(`Program gemt til ${clientName}`);
      navigate(`/coach/client/${clientId}`);
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved gemning af program'),
  });

  return (
    <div className="space-y-6 max-w-5xl pb-12 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coach')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-2">
            <Sparkles className="h-7 w-7" />
            AI Program Builder
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Beskriv formålet og lad Claude AI generere et komplet program.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-800/50">
              <CardTitle className="text-base font-semibold text-zinc-100">1. Klient & Programtype</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2.5">
                <Label className="text-zinc-300 font-medium">Klient</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-black border-zinc-700 h-11">
                    <SelectValue placeholder="Vælg klient fra ruden..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="text-zinc-100 focus:bg-zinc-800">
                        {c.profiles?.full_name ?? 'Unavngivet'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-zinc-300 font-medium">Programtype</Label>
                <Select value={programType} onValueChange={setProgramType}>
                  <SelectTrigger className="bg-black border-zinc-700 h-11">
                    <SelectValue placeholder="Vælg primært fokus..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="Styrke" className="text-zinc-100 focus:bg-zinc-800 py-2">Styrke</SelectItem>
                    <SelectItem value="Hypertrofi" className="text-zinc-100 focus:bg-zinc-800 py-2">Hypertrofi</SelectItem>
                    <SelectItem value="Kondition" className="text-zinc-100 focus:bg-zinc-800 py-2">Kondition</SelectItem>
                    <SelectItem value="Vægttab" className="text-zinc-100 focus:bg-zinc-800 py-2">Vægttab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-800/50">
              <CardTitle className="text-base font-semibold text-zinc-100">2. Længde & Frekvens</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-5 pt-5">
              <div className="space-y-2.5">
                <Label className="text-zinc-300 font-medium">Antal Uger</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="52" 
                  value={weeks} 
                  onChange={(e) => setWeeks(e.target.value)} 
                  className="bg-black border-zinc-700 h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-zinc-300 font-medium">Dage om ugen</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="7" 
                  value={daysPerWeek} 
                  onChange={(e) => setDaysPerWeek(e.target.value)} 
                  className="bg-black border-zinc-700 h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-zinc-800/50">
              <CardTitle className="text-base font-semibold text-zinc-100">3. Beskrivelse & Instruktioner</CardTitle>
              <CardDescription className="text-zinc-400">
                Giv AI'en specifikke instruktioner (f.eks. udstyrsbegrænsninger, specifikke øvelsesfokuser mv.)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <Textarea
                placeholder="F.eks. 12-ugers styrkeprogram, 3 dage om ugen, fokus på hypertrofi, masser af baseøvelser og hvile..."
                className="min-h-[140px] bg-black border-zinc-700 resize-none text-zinc-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:bg-blue-600 shadow-md shadow-blue-900/20"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !clientId || !programType || !description.trim() || !weeks || !daysPerWeek}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Claude tænker...
              </>
            ) : generateMutation.isSuccess && previewProgram ? (
              <>
                <CheckCircle className="h-6 w-6" />
                Regenerer Program
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                Generer Program via AI
              </>
            )}
          </Button>
        </div>

        <div className="h-full">
          <Card className={`bg-zinc-950 transition-colors duration-300 shadow-sm sticky top-6 h-fit max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden ${previewProgram ? 'border-amber-500/50 shadow-amber-900/10' : 'border-zinc-800'}`}>
            <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/30 shrink-0 py-4">
              <CardTitle className={`flex items-center justify-between text-base ${previewProgram ? 'text-amber-500' : 'text-zinc-500'}`}>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Program Preview
                </span>
                {previewProgram && (
                   <span className="text-xs text-zinc-300 font-medium px-2.5 py-1 bg-zinc-800 rounded-md border border-zinc-700">
                     {previewProgram.days?.length} dages struktur
                   </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto grow custom-scrollbar min-h-[400px]">
              {previewProgram ? (
                <div className="p-5 space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-100 mb-2">{previewProgram.programName}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{previewProgram.description}</p>
                  </div>
                  
                  <div className="space-y-5">
                    {previewProgram.days?.map((day: any, dIdx: number) => (
                      <div key={dIdx} className="rounded-xl overflow-hidden bg-black/60 border border-zinc-800/80">
                        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800/80">
                          <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">Dag {dIdx + 1}</span>
                            {day.dayName}
                          </h4>
                        </div>
                        <div className="p-3 space-y-2">
                          {day.exercises?.map((ex: any, eIdx: number) => (
                            <div key={eIdx} className="bg-zinc-950/50 p-3.5 rounded-lg border border-zinc-800/50 text-sm hover:border-zinc-700 transition-colors">
                              <div className="font-semibold text-zinc-200">{ex.name}</div>
                              <div className="text-zinc-400 mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800">
                                  {ex.sets} sæt x {ex.reps} reps
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800">
                                  {ex.restSeconds}s hvile
                                </span>
                                {ex.notes && (
                                  <span className="text-amber-500/90 w-full mt-1.5 px-2 py-1.5 bg-amber-500/5 rounded-md border border-amber-500/10 block font-normal">
                                    <span className="font-medium mr-1">Coach Note:</span> {ex.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm p-8 text-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="max-w-xs text-zinc-400">
                    Udfyld alle felter til venstre og klik "Generer Program" for at se og godkende programmet her før du gemmer.
                  </p>
                </div>
              )}
            </CardContent>
            {previewProgram && (
              <div className="p-4 border-t border-zinc-800/80 shrink-0 bg-zinc-900/50 backdrop-blur-sm">
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 text-base shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02]"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Gemmer til database...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      Godkend & Gem til klient
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
