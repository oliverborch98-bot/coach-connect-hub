import { Dumbbell, ChevronDown, Loader2, Save, Check, Video, Brain, AlertCircle, X } from 'lucide-react';
import RestTimer from '@/components/RestTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [analyzingEx, setAnalyzingEx] = useState<{ id: string; name: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeForm = useMutation({
    mutationFn: async ({ exerciseName, file }: { exerciseName: string; file: File }) => {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke('analyze-form', {
        body: { exerciseName, frameData: base64 }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast.success("AI Analyse fuldført!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Kunne ikke analysere form. Prøv igen.");
      setIsAnalyzing(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, exName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeForm.mutate({ exerciseName: exName, file });
    }
  };

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

  const todayStr = new Date().toISOString().split('T')[0];
  const isFutureProgram = (program as any)?.start_date && (program as any).start_date > todayStr;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24 md:pb-12 px-4">
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
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <h2 className="font-semibold text-lg">{program.name}</h2>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground items-center">
              {program.phase && <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground">Fase {program.phase}</span>}
              <span className="capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">{program.status}</span>
              {isFutureProgram && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                  Starter {new Date((program as any).start_date).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </div>

          {isFutureProgram ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center mt-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-amber-500 mb-2">Program låst</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Dette program starter først den <strong className="text-foreground">{new Date((program as any).start_date).toLocaleDateString('da-DK', { weekday: 'long', day: '2-digit', month: 'long' })}</strong>.
                Dine træninger vil blive vist her på selve dagen.
              </p>
            </div>
          ) : (
          <div className="space-y-3 mt-4">
            {trainingDays.map((day, idx) => {
              const dayExercises = exercises.filter(e => e.training_day_id === day.id);
              const isExpanded = expandedDay === day.id;

              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-white/5 glass-morphism overflow-hidden group hover:border-primary/20 transition-all duration-500"
                >
                  <button onClick={() => toggleDay(day.id)} className="w-full flex items-center justify-between p-5 text-left transition-colors">
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{day.day_name}</p>
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{dayExercises.length} øvelser</p>
                    </div>
                    <div className={`p-2 rounded-xl bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
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
                                      <p className="text-xs text-muted-foreground capitalize">{(ex as any).exercises.category}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setAnalyzingEx({ id: ex.id, name: (ex as any).exercises?.name ?? 'Øvelse' });
                                          fileInputRef.current?.click();
                                        }}
                                        className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2 group min-h-[44px]"
                                        title="AI Biomekanik Analyse"
                                      >
                                        <Brain className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Analyse</span>
                                      </button>
                                  </div>
                                </div>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="video/*,image/*"
                                  onChange={(e) => handleFileChange(e, (ex as any).exercises?.name ?? 'Øvelse')}
                                />
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
                                        <span className="text-xs text-muted-foreground w-12">Sæt {setNum}</span>
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
                                            inputMode="decimal"
                                            placeholder="reps"
                                            value={getLogValue(ex.id, setNum, 'reps_completed') ?? ''}
                                            onChange={e => updateLocal(ex.id, setNum, 'reps_completed', e.target.value ? Number(e.target.value) : null)}
                                            className="w-16 rounded-xl bg-background border border-border px-2 py-2 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
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
                                          className="p-2 rounded-lg hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                                    <summary className="text-xs text-primary cursor-pointer font-bold uppercase tracking-widest">Instruktioner</summary>
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
          )}
        </>
      )}
      {/* AI Analysis Dialog */}
      <Dialog open={!!analyzingEx && (isAnalyzing || !!analysisResult)} onOpenChange={() => {
        if (!isAnalyzing) {
          setAnalyzingEx(null);
          setAnalysisResult(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Form Analyse: {analyzingEx?.name}
            </DialogTitle>
            <DialogDescription>
              Gemini 2.0 Flash analyserer din teknik...
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium animate-pulse">Studerer biomekanik...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
                <Button className="w-full royal-blue-gradient text-white" onClick={() => {
                  setAnalyzingEx(null);
                  setAnalysisResult(null);
                }}>
                  Modtaget!
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
