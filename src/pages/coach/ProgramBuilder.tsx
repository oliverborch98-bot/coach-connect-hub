import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Search, Loader2, Save, Dumbbell, Filter, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DayDraft {
  id: string;
  day_name: string;
  exercises: ExerciseDraft[];
}

interface ExerciseDraft {
  id: string;
  exercise_id: string;
  name: string;
  sets: number;
  reps: string;
  tempo: string;
  rest_seconds: number;
  notes: string;
}

const emptyExercise = (): ExerciseDraft => ({
  id: crypto.randomUUID(),
  exercise_id: '',
  name: '',
  sets: 3,
  reps: '8-12',
  tempo: '',
  rest_seconds: 90,
  notes: '',
});

const emptyDay = (order: number): DayDraft => ({
  id: crypto.randomUUID(),
  day_name: `Dag ${order + 1}`,
  exercises: [emptyExercise()],
});

export default function ProgramBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const editId = searchParams.get('edit');
  const qc = useQueryClient();

  const [clientId, setClientId] = useState(preselectedClient);
  const [programName, setProgramName] = useState('');
  const [phase, setPhase] = useState('foundation');
  const [isTemplate, setIsTemplate] = useState(false);
  const [days, setDays] = useState<DayDraft[]>([emptyDay(0)]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [pickingForDay, setPickingForDay] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  // Load existing program for editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: prog } = await supabase.from('training_programs').select('*').eq('id', editId).single();
      if (!prog) { toast.error('Program ikke fundet'); navigate(-1); return; }
      setProgramName(prog.name);
      setPhase(prog.phase ?? 'foundation');
      setClientId(prog.client_id ?? '');
      setIsTemplate(prog.is_template ?? false);

      const { data: dbDays } = await supabase.from('training_days').select('*').eq('program_id', editId).order('day_order');
      if (dbDays && dbDays.length > 0) {
        const dayIds = dbDays.map(d => d.id);
        const { data: dbExercises } = await supabase.from('training_exercises').select('*, exercises(name)').in('training_day_id', dayIds).order('exercise_order');

        setDays(dbDays.map(d => ({
          id: d.id,
          day_name: d.day_name,
          exercises: (dbExercises ?? []).filter(e => e.training_day_id === d.id).map(e => ({
            id: e.id,
            exercise_id: e.exercise_id,
            name: (e as any).exercises?.name ?? '',
            sets: e.sets ?? 3,
            reps: e.reps ?? '8-12',
            tempo: e.tempo ?? '',
            rest_seconds: e.rest_seconds ?? 90,
            notes: e.notes ?? '',
          })),
        })));
      }
      setLoaded(true);
    })();
  }, [editId]);

  const generateWithAI = async () => {
    if (!clientId) { toast.error('Vælg en klient først'); return; }
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId, programName: programName || 'AI Program', phase }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || 'AI fejl'); }
      const result = await resp.json();
      setProgramName(result.programName ?? programName);
      if (result.days?.length) {
        setDays(result.days.map((d: any, i: number) => ({
          id: crypto.randomUUID(),
          day_name: d.dayName ?? `Dag ${i + 1}`,
          exercises: (d.exercises ?? []).map((ex: any) => ({
            id: crypto.randomUUID(),
            exercise_id: ex.exerciseId ?? '',
            name: ex.name ?? '',
            sets: ex.sets ?? 3,
            reps: ex.reps ?? '8-12',
            tempo: ex.tempo ?? '',
            rest_seconds: ex.restSeconds ?? 90,
            notes: ex.notes ?? '',
          })),
        })));
      }
      toast.success('AI-program genereret! Gennemgå og gem.');
    } catch (e: any) { toast.error(e.message); }
    setAiLoading(false);
  };

  const { data: clients = [] } = useQuery({
    queryKey: ['coach-clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_profiles').select('id, profiles!client_profiles_user_id_fkey(full_name)').eq('status', 'active');
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises-library'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const categories = [...new Set(exercises.map((e: any) => e.category).filter(Boolean))].sort();
  const equipmentList = [...new Set(exercises.flatMap((e: any) => e.equipment ?? []))].sort();

  const filteredExercises = exercises.filter((e: any) => {
    const matchesSearch = !exerciseSearch ||
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (e.name_da ?? '').toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (e.category ?? '').toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (e.muscle_groups ?? []).some((m: string) => m.toLowerCase().includes(exerciseSearch.toLowerCase()));
    const matchesCategory = !filterCategory || e.category === filterCategory;
    const matchesEquipment = !filterEquipment || (e.equipment ?? []).includes(filterEquipment);
    return matchesSearch && matchesCategory && matchesEquipment;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clientId && !isTemplate) throw new Error('Vælg en klient eller markér som skabelon');
      if (!programName.trim()) throw new Error('Angiv programnavn');

      if (editId) {
        // Update existing
        await supabase.from('training_programs').update({
          name: programName, phase, client_id: isTemplate ? null : clientId, is_template: isTemplate,
        }).eq('id', editId);

        // Delete old days & exercises (cascade via FK)
        const { data: oldDays } = await supabase.from('training_days').select('id').eq('program_id', editId);
        if (oldDays?.length) {
          await supabase.from('training_exercises').delete().in('training_day_id', oldDays.map(d => d.id));
          await supabase.from('training_days').delete().eq('program_id', editId);
        }

        // Re-insert days & exercises
        for (let di = 0; di < days.length; di++) {
          const day = days[di];
          const { data: dbDay, error: dErr } = await supabase.from('training_days').insert({ program_id: editId, day_name: day.day_name, day_order: di }).select('id').single();
          if (dErr) throw dErr;
          const exInserts = day.exercises.filter(ex => ex.exercise_id).map((ex, ei) => ({
            training_day_id: dbDay.id, exercise_id: ex.exercise_id, exercise_order: ei,
            sets: ex.sets, reps: ex.reps, tempo: ex.tempo || null, rest_seconds: ex.rest_seconds || null, notes: ex.notes || null,
          }));
          if (exInserts.length > 0) {
            const { error: eErr } = await supabase.from('training_exercises').insert(exInserts);
            if (eErr) throw eErr;
          }
        }
      } else {
        // Create new
        const { data: program, error: pErr } = await supabase.from('training_programs').insert({
          client_id: isTemplate ? null : clientId, name: programName, phase, status: 'active', is_template: isTemplate,
        }).select('id').single();
        if (pErr) throw pErr;

        for (let di = 0; di < days.length; di++) {
          const day = days[di];
          const { data: dbDay, error: dErr } = await supabase.from('training_days').insert({ program_id: program.id, day_name: day.day_name, day_order: di }).select('id').single();
          if (dErr) throw dErr;
          const exInserts = day.exercises.filter(ex => ex.exercise_id).map((ex, ei) => ({
            training_day_id: dbDay.id, exercise_id: ex.exercise_id, exercise_order: ei,
            sets: ex.sets, reps: ex.reps, tempo: ex.tempo || null, rest_seconds: ex.rest_seconds || null, notes: ex.notes || null,
          }));
          if (exInserts.length > 0) {
            const { error: eErr } = await supabase.from('training_exercises').insert(exInserts);
            if (eErr) throw eErr;
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(editId ? 'Program opdateret!' : 'Program oprettet!');
      qc.invalidateQueries({ queryKey: ['coach-clients-list'] });
      qc.invalidateQueries({ queryKey: ['coach-client-program'] });
      navigate(clientId ? `/coach/client/${clientId}` : '/coach');
    },
    onError: (err: any) => toast.error(err.message ?? 'Fejl ved oprettelse'),
  });

  const addDay = () => setDays(prev => [...prev, emptyDay(prev.length)]);
  const removeDay = (dayId: string) => setDays(prev => prev.filter(d => d.id !== dayId));
  const updateDay = (dayId: string, field: string, value: string) =>
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d));
  const addExercise = (dayId: string) =>
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));
  const removeExercise = (dayId: string, exId: string) =>
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d));
  const updateExercise = (dayId: string, exId: string, field: string, value: any) =>
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: d.exercises.map(e => e.id === exId ? { ...e, [field]: value } : e) } : d));
  const pickExercise = (dayId: string, exId: string, exercise: any) => {
    updateExercise(dayId, exId, 'exercise_id', exercise.id);
    updateExercise(dayId, exId, 'name', exercise.name);
    setPickingForDay(null);
    setExerciseSearch('');
  };

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{editId ? 'Redigér Træningsprogram' : 'Ny Træningsprogram'}</h1>
          <p className="text-sm text-muted-foreground">{editId ? 'Opdatér programmet' : 'Opret og tildel et program til en klient'}</p>
        </div>
        <button onClick={generateWithAI} disabled={aiLoading || !clientId}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50">
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {aiLoading ? 'Genererer...' : 'Generér med AI'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Klient</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} disabled={isTemplate}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50">
            <option value="">Vælg klient...</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.profiles?.full_name ?? 'Ukendt'}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Programnavn</label>
          <input value={programName} onChange={e => setProgramName(e.target.value)} placeholder="F.eks. Push/Pull/Legs"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Fase</label>
          <select value={phase} onChange={e => setPhase(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="foundation">Foundation</option>
            <option value="acceleration">Acceleration</option>
            <option value="transformation">Transformation</option>
          </select>
        </div>
        <div className="md:col-span-3 flex items-center gap-2">
          <input type="checkbox" id="is-template" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)}
            className="rounded border-border" />
          <label htmlFor="is-template" className="text-xs text-muted-foreground">Gem som skabelon (template)</label>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {days.map((day) => (
            <motion.div key={day.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-3 bg-secondary/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <input value={day.day_name} onChange={e => updateDay(day.id, 'day_name', e.target.value)}
                    className="bg-transparent text-sm font-semibold focus:outline-none border-b border-transparent focus:border-primary" />
                </div>
                {days.length > 1 && (
                  <button onClick={() => removeDay(day.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-12 md:col-span-4 relative">
                      {ex.exercise_id ? (
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{ex.name}</span>
                          <button onClick={() => updateExercise(day.id, ex.id, 'exercise_id', '')}
                            className="text-xs text-muted-foreground hover:text-foreground ml-auto">Skift</button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <input placeholder="Søg øvelse..."
                            value={pickingForDay === `${day.id}-${ex.id}` ? exerciseSearch : ''}
                            onFocus={() => { setPickingForDay(`${day.id}-${ex.id}`); setExerciseSearch(''); }}
                            onChange={e => setExerciseSearch(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs" />
                          {pickingForDay === `${day.id}-${ex.id}` && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col" style={{ minWidth: 320 }}>
                              <div className="flex gap-1.5 px-3 py-2 border-b border-border bg-secondary/20 flex-wrap">
                                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                  className="text-[10px] rounded border border-border bg-background px-1.5 py-1">
                                  <option value="">Alle kategorier</option>
                                  {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}
                                  className="text-[10px] rounded border border-border bg-background px-1.5 py-1">
                                  <option value="">Alt udstyr</option>
                                  {equipmentList.map((eq: string) => <option key={eq} value={eq}>{eq}</option>)}
                                </select>
                                {(filterCategory || filterEquipment) && (
                                  <button onClick={() => { setFilterCategory(''); setFilterEquipment(''); }} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                                    <X className="h-3 w-3" /> Nulstil
                                  </button>
                                )}
                              </div>
                              <div className="overflow-y-auto max-h-48">
                                {filteredExercises.map((exercise: any) => (
                                  <button key={exercise.id} onClick={() => pickExercise(day.id, ex.id, exercise)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors border-b border-border/30 last:border-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{exercise.name_da || exercise.name}</span>
                                      <span className="text-[10px] text-muted-foreground capitalize">{exercise.category}</span>
                                    </div>
                                    {exercise.muscle_groups && (
                                      <div className="flex gap-1 mt-0.5 flex-wrap">
                                        {exercise.muscle_groups.slice(0, 3).map((mg: string) => (
                                          <span key={mg} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{mg}</span>
                                        ))}
                                      </div>
                                    )}
                                  </button>
                                ))}
                                {filteredExercises.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground text-center">Ingen øvelser fundet</p>}
                              </div>
                              <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">{filteredExercises.length} øvelser</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="text-[10px] text-muted-foreground">Sæt</label>
                      <input type="number" value={ex.sets} onChange={e => updateExercise(day.id, ex.id, 'sets', Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center" />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="text-[10px] text-muted-foreground">Reps</label>
                      <input value={ex.reps} onChange={e => updateExercise(day.id, ex.id, 'reps', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <label className="text-[10px] text-muted-foreground">Tempo</label>
                      <input value={ex.tempo} onChange={e => updateExercise(day.id, ex.id, 'tempo', e.target.value)} placeholder="3010"
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] text-muted-foreground">Hvile</label>
                      <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(day.id, ex.id, 'rest_seconds', Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center" />
                    </div>
                    <div className="col-span-1 flex items-end pb-1">
                      <button onClick={() => removeExercise(day.id, ex.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addExercise(day.id)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2">
                  <Plus className="h-3.5 w-3.5" /> Tilføj øvelse
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button onClick={addDay}
          className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Tilføj træningsdag
        </button>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
          Annuller
        </button>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editId ? 'Opdatér program' : 'Gem program'}
        </button>
      </div>
    </div>
  );
}
