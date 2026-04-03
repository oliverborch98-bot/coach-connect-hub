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
    <div className="premium-card p-6 overflow-x-auto scrollbar-hide">
      <table className="w-full text-[10px] uppercase font-black tracking-widest border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="text-left py-4 px-3 text-muted-foreground/60">Habit</th>
            {days.map(d => (
              <th key={d} className="text-center py-4 px-1 text-muted-foreground/60 w-12">
                {new Date(d).toLocaleDateString('da-DK', { weekday: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map(habit => (
            <tr key={habit.id} className="group transition-all duration-300">
              <td className="py-4 px-3 bg-white/5 rounded-l-2xl border-l border-t border-b border-white/5 font-bold flex items-center gap-2 group-hover:bg-primary/5 transition-colors">
                <div className="p-1 rounded bg-primary/10">
                  <CheckSquare className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <span className="truncate max-w-[120px]">{habit.habit_name}</span>
              </td>
              {days.map((d, idx) => {
                const done = logs.some(l => l.habit_id === habit.id && l.date === d && l.completed);
                const isLast = idx === days.length - 1;
                return (
                  <td key={d} className={`text-center py-4 bg-white/5 border-t border-b border-white/5 group-hover:bg-primary/5 transition-all ${isLast ? 'rounded-r-2xl border-r' : ''}`}>
                    <div className="flex justify-center">
                      <div className={`h-5 w-5 rounded-lg transition-all duration-500 shadow-sm ${done
                          ? 'royal-blue-gradient shadow-primary/20 scale-110'
                          : 'bg-background/40 border border-white/5 opacity-40'
                        }`} />
                    </div>
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
