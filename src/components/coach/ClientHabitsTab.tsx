import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckSquare } from 'lucide-react';

export default function ClientHabitsTab({ clientId }: { clientId: string }) {
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['client-habits-coach', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('client_id', clientId)
        .eq('active', true)
        .order('habit_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['client-habit-logs-coach', clientId],
    queryFn: async () => {
      const habitIds = habits.map(h => h.id);
      if (habitIds.length === 0) return [];
      // Last 7 days
      const from = new Date();
      from.setDate(from.getDate() - 6);
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds)
        .gte('date', from.toISOString().split('T')[0])
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: habits.length > 0,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (habits.length === 0) return <p className="text-sm text-muted-foreground">Ingen habits oprettet endnu</p>;

  // Build last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted-foreground">Habit</th>
            {days.map(d => (
              <th key={d} className="text-center py-2 font-medium text-muted-foreground w-10">
                {new Date(d).toLocaleDateString('da-DK', { weekday: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map(habit => (
            <tr key={habit.id} className="border-b border-border last:border-0">
              <td className="py-2.5 font-medium flex items-center gap-1.5">
                <CheckSquare className="h-3 w-3 text-primary" />
                {habit.habit_name}
              </td>
              {days.map(d => {
                const done = logs.some(l => l.habit_id === habit.id && l.date === d && l.completed);
                return (
                  <td key={d} className="text-center py-2.5">
                    <span className={`inline-block h-4 w-4 rounded ${done ? 'bg-success' : 'bg-secondary'}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
