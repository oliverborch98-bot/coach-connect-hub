import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function ClientTrainingTab({ clientId }: { clientId: string }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

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
        .select('*, exercises(name, muscle_group)')
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
        .order('date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

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
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">{program.name}</h3>
        <p className="text-xs text-muted-foreground">Fase {program.phase ?? '–'} · {days.length} dage</p>
      </div>

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
                  const latestLog = exLogs[0];
                  return (
                    <div key={ex.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{ex.exercises?.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.sets} sæt × {ex.reps} reps {ex.tempo ? `· ${ex.tempo}` : ''}</p>
                      </div>
                      {latestLog && (
                        <div className="text-right">
                          <p className="text-xs font-medium">{latestLog.weight_used} kg × {latestLog.reps_completed}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(latestLog.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      )}
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
