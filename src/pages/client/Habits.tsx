import { useState, useEffect } from 'react';
import { CheckSquare, Flame, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['my-habits', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('active', true)
        .order('habit_order');
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['habit-logs-today', clientProfile?.id, today],
    queryFn: async () => {
      const habitIds = habits.map(h => h.id);
      if (habitIds.length === 0) return [];
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds)
        .eq('date', today);
      if (error) throw error;
      return data;
    },
    enabled: habits.length > 0,
  });

  // Calculate streak (consecutive days with all habits completed)
  const { data: streak = 0 } = useQuery({
    queryKey: ['habit-streak', clientProfile?.id],
    queryFn: async () => {
      const habitIds = habits.map(h => h.id);
      if (habitIds.length === 0) return 0;
      // Get last 30 days of logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .in('habit_id', habitIds)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .eq('completed', true)
        .order('date', { ascending: false });
      if (error) return 0;

      // Count consecutive days
      let count = 0;
      const dateSet = new Set(logs?.map(l => l.date));
      for (let i = 1; i <= 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (dateSet.has(ds)) count++;
        else break;
      }
      return count;
    },
    enabled: habits.length > 0,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      const existing = todayLogs.find(l => l.habit_id === habitId);
      if (existing) {
        const { error } = await supabase
          .from('habit_logs')
          .update({ completed })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, date: today, completed });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs-today'] });
      queryClient.invalidateQueries({ queryKey: ['habit-streak'] });
    },
  });

  const completedToday = habits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;

  const isCompleted = (habitId: string) => todayLogs.some(l => l.habit_id === habitId && l.completed);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Daglige Habits</h1>
      </div>

      {/* Streak */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-border bg-card p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-3xl font-extrabold">{streak}</span>
        </div>
        <p className="text-xs text-muted-foreground">dages streak</p>
        <p className="text-sm font-medium mt-2">{completedToday}/{habits.length} habits i dag</p>
      </motion.div>

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Ingen habits sat op endnu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => {
            const done = isCompleted(habit.id);
            return (
              <motion.button
                key={habit.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleMutation.mutate({ habitId: habit.id, completed: !done })}
                className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-colors ${
                  done ? 'border-success/30 bg-success/5 text-foreground' : 'border-border bg-card text-foreground'
                }`}
              >
                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  done ? 'border-success bg-success' : 'border-muted-foreground'
                }`}>
                  {done && <CheckSquare className="h-3 w-3 text-success-foreground" />}
                </div>
                {habit.habit_name}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
