import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Dumbbell, ChevronDown, ChevronUp, Trophy, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';

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
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data: program, isLoading } = useQuery({
    queryKey: ['coach-client-program', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: days = [] } = useQuery({
    queryKey: ['coach-client-training-days', program?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_days')
        .select('*')
        .eq('program_id', program!.id)
        .order('day_order');
      if (error) throw error;
      return data;
    },
    enabled: !!program,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['coach-client-exercises', days.map(d => d.id).join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_exercises')
        .select('*, exercises(name, muscle_groups)')
        .in('training_day_id', days.map(d => d.id))
        .order('exercise_order');
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
        .limit(500);
      if (error) throw error;
      return data as ExerciseLog[];
    },
  });

  // Compute PRs (highest weight per exercise)
  const { prs, exerciseProgressData, volumeData } = useMemo(() => {
    const prMap = new Map<string, PRRecord>();
    const progressMap = new Map<string, { date: string; weight: number }[]>();
    const volumeByWeek = new Map<string, number>();

    for (const log of logs) {
      if (!log.weight_used || !log.reps_completed) continue;

      // Find exercise name
      const ex = exercises.find(e => e.id === log.training_exercise_id);
      const name = ex?.exercises?.name ?? 'Ukendt';

      // PR detection
      const existing = prMap.get(log.training_exercise_id);
      if (!existing || log.weight_used > existing.weight) {
        prMap.set(log.training_exercise_id, {
          exerciseName: name,
          weight: log.weight_used,
          reps: log.reps_completed,
          date: log.date,
        });
      }

      // Progress over time (best set per date)
      const key = log.training_exercise_id;
      if (!progressMap.has(key)) progressMap.set(key, []);
      const arr = progressMap.get(key)!;
      const existingDate = arr.find(p => p.date === log.date);
      if (!existingDate) {
        arr.push({ date: log.date, weight: log.weight_used });
      } else if (log.weight_used > existingDate.weight) {
        existingDate.weight = log.weight_used;
      }

      // Volume by week (weight × reps)
      const d = new Date(log.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      volumeByWeek.set(weekKey, (volumeByWeek.get(weekKey) ?? 0) + log.weight_used * log.reps_completed);
    }

    const prs = Array.from(prMap.values()).sort((a, b) => b.weight - a.weight);

    const volumeData = Array.from(volumeByWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, volume]) => ({
        week: new Date(week).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
        volume: Math.round(volume),
      }));

    return { prs, exerciseProgressData: progressMap, volumeData };
  }, [logs, exercises]);

  const selectedProgressData = useMemo(() => {
    if (!selectedExercise) return [];
    const data = exerciseProgressData.get(selectedExercise) ?? [];
    return data.map(d => ({
      date: new Date(d.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
      kg: d.weight,
    }));
  }, [selectedExercise, exerciseProgressData]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (!program) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Intet aktivt program tildelt</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">{program.name}</h3>
        <p className="text-xs text-muted-foreground">Fase {program.phase ?? '–'} · {days.length} dage</p>
      </div>

      {/* PR Records */}
      {prs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <h4 className="text-sm font-semibold">Personal Records</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {prs.slice(0, 8).map((pr, i) => (
              <Badge key={i} variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 gap-1.5 py-1.5">
                <Trophy className="h-3 w-3" />
                {pr.exerciseName}: {pr.weight}kg × {pr.reps}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Volume Over Time */}
      {volumeData.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Ugentlig volumen (kg × reps)</h4>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Progressive Overload Graph */}
      {selectedExercise && selectedProgressData.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Vægt over tid</h4>
            <button onClick={() => setSelectedExercise(null)} className="text-xs text-muted-foreground hover:text-foreground">Luk</button>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedProgressData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="kg" />
                <Tooltip />
                <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Training Days */}
      {days.map(day => {
        const dayExercises = exercises.filter(e => e.training_day_id === day.id);
        const isOpen = expandedDay === day.id;
        return (
          <div key={day.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button onClick={() => setExpandedDay(isOpen ? null : day.id)} className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-secondary/50 transition-colors">
              {day.day_name}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {dayExercises.map(ex => {
                  const exLogs = logs.filter(l => l.training_exercise_id === ex.id);
                  const latestLog = exLogs[exLogs.length - 1];
                  const pr = prs.find(p => p.exerciseName === ex.exercises?.name);
                  const hasProgressData = (exerciseProgressData.get(ex.id)?.length ?? 0) > 1;
                  return (
                    <div key={ex.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{ex.exercises?.name}</p>
                          {pr && latestLog && latestLog.weight_used === pr.weight && (
                            <Trophy className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{ex.sets} sæt × {ex.reps} reps {ex.tempo ? `· ${ex.tempo}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasProgressData && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedExercise(ex.id); }}
                            className="text-xs text-primary hover:underline"
                          >
                            Graf
                          </button>
                        )}
                        {latestLog && (
                          <div className="text-right">
                            <p className="text-xs font-medium">{latestLog.weight_used} kg × {latestLog.reps_completed}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(latestLog.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
