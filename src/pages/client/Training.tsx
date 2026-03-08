import { Dumbbell, ChevronDown, Loader2, Save, Check } from 'lucide-react';
import RestTimer from '@/components/RestTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  training_exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: number | null;
}

export default function ClientTraining() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [localLogs, setLocalLogs] = useState<Record<string, LogEntry>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [activeTimer, setActiveTimer] = useState<{ exId: string; seconds: number } | null>(null);

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-training', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_phase, current_month')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: program, isLoading } = useQuery({
    queryKey: ['active-program', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: trainingDays = [] } = useQuery({
    queryKey: ['training-days', program?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_days')
        .select('*')
        .eq('program_id', program!.id)
        .order('day_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!program,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['training-exercises', program?.id],
    queryFn: async () => {
      const dayIds = trainingDays.map(d => d.id);
      if (dayIds.length === 0) return [];
      const { data, error } = await supabase
        .from('training_exercises')
        .select('*, exercises(name, category, muscle_groups, instructions, video_url)')
        .in('training_day_id', dayIds)
        .order('exercise_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: trainingDays.length > 0,
  });

  // Fetch today's existing logs
  const today = new Date().toISOString().split('T')[0];
  const { data: existingLogs = [] } = useQuery({
    queryKey: ['workout-logs-today', clientProfile?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('date', today);
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const saveLog = useMutation({
    mutationFn: async (entry: LogEntry) => {
      const existing = existingLogs.find(
        l => l.training_exercise_id === entry.training_exercise_id && l.set_number === entry.set_number
      );
      if (existing) {
        const { error } = await supabase.from('workout_logs').update({
          reps_completed: entry.reps_completed,
          weight_used: entry.weight_used,
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workout_logs').insert({
          client_id: clientProfile!.id,
          training_exercise_id: entry.training_exercise_id,
          set_number: entry.set_number,
          reps_completed: entry.reps_completed,
          weight_used: entry.weight_used,
          date: today,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, entry) => {
      const key = `${entry.training_exercise_id}_${entry.set_number}`;
      setSavedKeys(prev => new Set(prev).add(key));
      queryClient.invalidateQueries({ queryKey: ['workout-logs-today'] });
      // Find the exercise to get rest_seconds and start timer
      const ex = exercises.find(e => e.id === entry.training_exercise_id);
      if (ex?.rest_seconds) {
        setActiveTimer({ exId: ex.id, seconds: ex.rest_seconds });
      }
      setTimeout(() => setSavedKeys(prev => { const n = new Set(prev); n.delete(key); return n; }), 1500);
    },
  });

  const getLogValue = (exId: string, setNum: number, field: 'reps_completed' | 'weight_used') => {
    const key = `${exId}_${setNum}`;
    if (localLogs[key]) return localLogs[key][field];
    const existing = existingLogs.find(l => l.training_exercise_id === exId && l.set_number === setNum);
    return existing?.[field] ?? null;
  };

  const updateLocal = (exId: string, setNum: number, field: 'reps_completed' | 'weight_used', value: number | null) => {
    const key = `${exId}_${setNum}`;
    setLocalLogs(prev => ({
      ...prev,
      [key]: {
        training_exercise_id: exId,
        set_number: setNum,
        reps_completed: field === 'reps_completed' ? value : (prev[key]?.reps_completed ?? getLogValue(exId, setNum, 'reps_completed')),
        weight_used: field === 'weight_used' ? value : (prev[key]?.weight_used ?? getLogValue(exId, setNum, 'weight_used')),
      },
    }));
  };

  const toggleDay = (dayId: string) => {
    setExpandedDay(prev => (prev === dayId ? null : dayId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Træningsprogram</h1>
      </div>

      {!program ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Du har intet aktivt træningsprogram endnu. Din coach opretter det snart.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">{program.name}</h2>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {program.phase && <span>Fase {program.phase}</span>}
              <span className="capitalize">{program.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            {trainingDays.map((day, idx) => {
              const dayExercises = exercises.filter(e => e.training_day_id === day.id);
              const isExpanded = expandedDay === day.id;

              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button onClick={() => toggleDay(day.id)} className="w-full flex items-center justify-between p-4 text-left">
                    <div>
                      <p className="font-semibold text-sm">{day.day_name}</p>
                      <p className="text-xs text-muted-foreground">{dayExercises.length} øvelser</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {dayExercises.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Ingen øvelser tilføjet endnu.</p>
                          ) : (
                            dayExercises.map((ex, i) => (
                              <div key={ex.id} className="rounded-lg bg-secondary/50 p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium">{i + 1}. {(ex as any).exercises?.name ?? 'Øvelse'}</p>
                                    {(ex as any).exercises?.category && (
                                      <p className="text-[10px] text-muted-foreground capitalize">{(ex as any).exercises.category}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>{ex.sets} sæt</span>
                                  <span>{ex.reps} reps</span>
                                  {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                                  {ex.rest_seconds && <span>Hvile: {ex.rest_seconds}s</span>}
                                </div>

                                {/* Workout log inputs */}
                                <div className="space-y-1.5 mt-2">
                                  {Array.from({ length: ex.sets }, (_, s) => s + 1).map(setNum => {
                                    const key = `${ex.id}_${setNum}`;
                                    const isSaved = savedKeys.has(key);
                                    return (
                                      <div key={setNum} className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-10">Sæt {setNum}</span>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          placeholder="kg"
                                          value={getLogValue(ex.id, setNum, 'weight_used') ?? ''}
                                          onChange={e => updateLocal(ex.id, setNum, 'weight_used', e.target.value ? Number(e.target.value) : null)}
                                          className="w-16 rounded bg-background border border-border px-2 py-1 text-xs text-center"
                                        />
                                        <span className="text-[10px] text-muted-foreground">×</span>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          placeholder="reps"
                                          value={getLogValue(ex.id, setNum, 'reps_completed') ?? ''}
                                          onChange={e => updateLocal(ex.id, setNum, 'reps_completed', e.target.value ? Number(e.target.value) : null)}
                                          className="w-16 rounded bg-background border border-border px-2 py-1 text-xs text-center"
                                        />
                                        <button
                                          onClick={() => {
                                            const entry = localLogs[key] ?? {
                                              training_exercise_id: ex.id,
                                              set_number: setNum,
                                              reps_completed: getLogValue(ex.id, setNum, 'reps_completed'),
                                              weight_used: getLogValue(ex.id, setNum, 'weight_used'),
                                            };
                                            saveLog.mutate(entry);
                                          }}
                                          className="p-1 rounded hover:bg-secondary transition-colors"
                                        >
                                          {isSaved ? <Check className="h-3.5 w-3.5 text-success" /> : <Save className="h-3.5 w-3.5 text-muted-foreground" />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Rest Timer */}
                                {activeTimer?.exId === ex.id && (
                                  <div className="mt-2">
                                    <RestTimer
                                      seconds={activeTimer.seconds}
                                      autoStart
                                      onComplete={() => setActiveTimer(null)}
                                    />
                                  </div>
                                )}

                                {ex.notes && <p className="text-xs text-muted-foreground italic">{ex.notes}</p>}
                                {(ex as any).exercises?.instructions && (
                                  <details className="mt-1">
                                    <summary className="text-[10px] text-primary cursor-pointer">Instruktioner</summary>
                                    <p className="text-xs text-muted-foreground mt-1">{(ex as any).exercises.instructions}</p>
                                  </details>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
