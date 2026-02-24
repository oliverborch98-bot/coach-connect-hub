import { Dumbbell, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientTraining() {
  const { user } = useAuth();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-training', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_phase, current_week')
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
        .select('*, exercises(name, muscle_group, instructions, video_url)')
        .in('training_day_id', dayIds)
        .order('exercise_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: trainingDays.length > 0,
  });

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
          {/* Program header */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">{program.name}</h2>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {program.phase && (
                <span>Fase {program.phase}</span>
              )}
              <span className="capitalize">{program.status}</span>
            </div>
          </div>

          {/* Training days */}
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
                  <button
                    onClick={() => toggleDay(day.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <p className="font-semibold text-sm">{day.day_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayExercises.length} øvelser
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
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
                        <div className="px-4 pb-4 space-y-3">
                          {dayExercises.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Ingen øvelser tilføjet endnu.
                            </p>
                          ) : (
                            dayExercises.map((ex, i) => (
                              <div
                                key={ex.id}
                                className="rounded-lg bg-secondary/50 p-3 space-y-1"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {i + 1}. {(ex as any).exercises?.name ?? 'Øvelse'}
                                    </p>
                                    {(ex as any).exercises?.muscle_group && (
                                      <p className="text-[10px] text-muted-foreground capitalize">
                                        {(ex as any).exercises.muscle_group}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  <span>{ex.sets} sæt</span>
                                  <span>{ex.reps} reps</span>
                                  {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                                  {ex.rest_seconds && <span>Hvile: {ex.rest_seconds}s</span>}
                                </div>
                                {ex.notes && (
                                  <p className="text-xs text-muted-foreground italic">
                                    {ex.notes}
                                  </p>
                                )}
                                {(ex as any).exercises?.instructions && (
                                  <details className="mt-1">
                                    <summary className="text-[10px] text-primary cursor-pointer">
                                      Instruktioner
                                    </summary>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {(ex as any).exercises.instructions}
                                    </p>
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
