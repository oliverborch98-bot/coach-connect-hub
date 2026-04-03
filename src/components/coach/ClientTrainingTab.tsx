import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Dumbbell, ChevronDown, ChevronUp, Trophy, TrendingUp, Pencil, Trash2, Copy, Archive } from 'lucide-react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseLog {
  date: string;
  weight_used: number | null;
  reps_completed: number | null;
  set_number: number;
  training_exercise_id: string;
}

interface PRRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export default function ClientTrainingTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['coach-client-programs-all', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const program = programs.find(p => p.status === 'active') ?? programs[0];

  const { data: days = [] } = useQuery({
    queryKey: ['coach-client-training-days', program?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_days').select('*').eq('program_id', program!.id).order('day_order');
      if (error) throw error;
      return data;
    },
    enabled: !!program,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['coach-client-exercises', days.map(d => d.id).join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_exercises').select('*, exercises(name, muscle_groups)').in('training_day_id', days.map(d => d.id)).order('exercise_order');
      if (error) throw error;
      return data as any[];
    },
    enabled: days.length > 0,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['coach-client-workout-logs', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true })
        .limit(20);
      if (error) throw error;
      return data as ExerciseLog[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (programId: string) => {
      const { data: oldDays } = await supabase.from('training_days').select('id').eq('program_id', programId);
      if (oldDays?.length) {
        await supabase.from('training_exercises').delete().in('training_day_id', oldDays.map(d => d.id));
        await supabase.from('training_days').delete().eq('program_id', programId);
      }
      await supabase.from('training_programs').delete().eq('id', programId);
    },
    onSuccess: () => {
      toast.success('Program slettet');
      qc.invalidateQueries({ queryKey: ['coach-client-programs-all', clientId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (programId: string) => {
      await supabase.from('training_programs').update({ status: 'archived' }).eq('id', programId);
    },
    onSuccess: () => {
      toast.success('Program arkiveret');
      qc.invalidateQueries({ queryKey: ['coach-client-programs-all', clientId] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (programId: string) => {
      const src = programs.find(p => p.id === programId);
      if (!src) return;
      const { data: newProg } = await supabase.from('training_programs').insert({
        client_id: clientId, name: `${src.name} (kopi)`, phase: src.phase, status: 'active', is_template: false,
      }).select('id').single();
      if (!newProg) return;
      const { data: srcDays } = await supabase.from('training_days').select('*').eq('program_id', programId).order('day_order');
      if (!srcDays) return;
      for (const d of srcDays) {
        const { data: newDay } = await supabase.from('training_days').insert({ program_id: newProg.id, day_name: d.day_name, day_order: d.day_order }).select('id').single();
        if (!newDay) continue;
        const { data: srcEx } = await supabase.from('training_exercises').select('*').eq('training_day_id', d.id).order('exercise_order');
        if (srcEx?.length) {
          await supabase.from('training_exercises').insert(srcEx.map(e => ({
            training_day_id: newDay.id, exercise_id: e.exercise_id, exercise_order: e.exercise_order,
            sets: e.sets, reps: e.reps, tempo: e.tempo, rest_seconds: e.rest_seconds, notes: e.notes,
          })));
        }
      }
    },
    onSuccess: () => {
      toast.success('Program duplikeret');
      qc.invalidateQueries({ queryKey: ['coach-client-programs-all', clientId] });
    },
  });

  const { prs, exerciseProgressData, volumeData } = useMemo(() => {
    const prMap = new Map<string, PRRecord>();
    const progressMap = new Map<string, { date: string; weight: number }[]>();
    const volumeByWeek = new Map<string, number>();
    for (const log of logs) {
      if (!log.weight_used || !log.reps_completed) continue;
      const ex = exercises.find(e => e.id === log.training_exercise_id);
      const name = ex?.exercises?.name ?? 'Ukendt';
      const existing = prMap.get(log.training_exercise_id);
      if (!existing || log.weight_used > existing.weight) {
        prMap.set(log.training_exercise_id, { exerciseName: name, weight: log.weight_used, reps: log.reps_completed, date: log.date });
      }
      const key = log.training_exercise_id;
      if (!progressMap.has(key)) progressMap.set(key, []);
      const arr = progressMap.get(key)!;
      const existingDate = arr.find(p => p.date === log.date);
      if (!existingDate) arr.push({ date: log.date, weight: log.weight_used });
      else if (log.weight_used > existingDate.weight) existingDate.weight = log.weight_used;
      const d = new Date(log.date);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      volumeByWeek.set(weekKey, (volumeByWeek.get(weekKey) ?? 0) + log.weight_used * log.reps_completed);
    }
    return {
      prs: Array.from(prMap.values()).sort((a, b) => b.weight - a.weight),
      exerciseProgressData: progressMap,
      volumeData: Array.from(volumeByWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([week, volume]) => ({
        week: new Date(week).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }), volume: Math.round(volume),
      })),
    };
  }, [logs, exercises]);

  const selectedProgressData = useMemo(() => {
    if (!selectedExercise) return [];
    return (exerciseProgressData.get(selectedExercise) ?? []).map(d => ({
      date: new Date(d.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }), kg: d.weight,
    }));
  }, [selectedExercise, exerciseProgressData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Henter træningsdata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive font-medium">Der opstod en fejl ved hentning af træningsdata.</p>
        <button 
          onClick={() => qc.invalidateQueries({ queryKey: ['coach-client-programs-all', clientId] })}
          className="mt-3 text-xs underline hover:text-destructive/80"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Intet aktivt program tildelt</p>
      </div>
    );
  }

  const otherPrograms = programs.filter(p => p.id !== program.id);

  return (
    <div className="space-y-8">
      {/* Program Header with actions */}
      <div className="premium-card p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Dumbbell className="h-12 w-12 text-primary" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Aktivt Program</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            </div>
            <h3 className="text-xl font-black tracking-tighter royal-blue-text">{program.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
              Fase {program.phase ?? '–'} · {days.length} Træningsdage
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: Pencil, onClick: () => navigate(`/coach/program-builder?edit=${program.id}`), label: 'Redigér' },
              { icon: Copy, onClick: () => duplicateMutation.mutate(program.id), label: 'Duplikér' },
              { icon: Archive, onClick: () => archiveMutation.mutate(program.id), label: 'Arkivér' },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-300" title={btn.label}>
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
            <button onClick={() => { if (confirm('Slet program permanent?')) deleteMutation.mutate(program.id); }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-destructive/30 hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all duration-300" title="Slet">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PR Records */}
      {prs.length > 0 && (
        <div className="glass-morphism p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary text-glow-royal-blue shadow-primary" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">Personal Records (PR)</h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {prs.slice(0, 8).map((pr, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-glow-royal-blue">{pr.exerciseName}</p>
                  <p className="text-xs font-black text-foreground">{pr.weight}kg <span className="text-muted-foreground font-medium">× {pr.reps}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {volumeData.length > 1 && (
          <div className="glass-morphism p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">Ugentlig Volumen</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} axisLine={false} tickLine={false} iconType="star" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'hsl(225 73% 57%)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="volume" fill="hsl(225 73% 57%)" radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedExercise && selectedProgressData.length > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-morphism p-6 rounded-2xl relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">Vægt Progression</h4>
              <button onClick={() => setSelectedExercise(null)} className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-muted-foreground">×</button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedProgressData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis unit="kg" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  />
                  <Line type="monotone" dataKey="kg" stroke="hsl(225 73% 57%)" strokeWidth={3} dot={{ r: 4, fill: 'hsl(225 73% 57%)', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {days.map((day, idx) => {
        const dayExercises = exercises.filter(e => e.training_day_id === day.id);
        const isOpen = expandedDay === day.id;
        return (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (idx * 0.05) }}
            className="glass-morphism rounded-2xl overflow-hidden group"
          >
            <button
              onClick={() => setExpandedDay(isOpen ? null : day.id)}
              className="w-full flex items-center justify-between p-5 text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-primary/5 transition-all text-muted-foreground/60 hover:text-primary"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isOpen ? 'royal-blue-gradient' : 'bg-white/10'} transition-all`} />
                {day.day_name}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 space-y-3"
                >
                  {dayExercises.map(ex => {
                    const exLogs = logs.filter(l => l.training_exercise_id === ex.id);
                    const latestLog = exLogs[exLogs.length - 1];
                    const pr = prs.find(p => p.exerciseName === ex.exercises?.name);
                    const hasProgressData = (exerciseProgressData.get(ex.id)?.length ?? 0) > 1;
                    return (
                      <div key={ex.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group/row">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black uppercase tracking-tight group-hover/row:text-primary transition-colors">{ex.exercises?.name}</p>
                            {pr && latestLog && latestLog.weight_used === pr.weight && (
                              <div className="p-1 rounded bg-yellow-500/10">
                                <Trophy className="h-3 w-3 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {ex.sets} × {ex.reps} <span className="text-[8px] opacity-40 mx-1">·</span> {ex.tempo || '3010'}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          {hasProgressData && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedExercise(ex.id); }}
                              className="text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors border border-primary/10 px-2 py-1 rounded-lg"
                            >
                              Analyse
                            </button>
                          )}
                          {latestLog && (
                            <div className="text-right">
                              <p className="text-xs font-black text-foreground">{latestLog.weight_used}<span className="text-[9px] ml-0.5 text-muted-foreground">kG</span> × {latestLog.reps_completed}</p>
                              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">{new Date(latestLog.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Other programs */}
      {otherPrograms.length > 0 && (
        <div>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-muted-foreground hover:text-foreground mb-2">
            {showAll ? 'Skjul' : `Vis ${otherPrograms.length} andre programmer`}
          </button>
          {showAll && (
            <div className="space-y-2">
              {otherPrograms.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.phase ?? '–'} · {p.status}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/coach/program-builder?edit=${p.id}`)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => duplicateMutation.mutate(p.id)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Copy className="h-3 w-3" /></button>
                    <button onClick={() => { if (confirm('Slet?')) deleteMutation.mutate(p.id); }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
