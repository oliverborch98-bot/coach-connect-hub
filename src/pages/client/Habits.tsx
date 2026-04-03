import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  TrendingUp, 
  Clock, 
  Trophy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { format, startOfToday, eachDayOfInterval, subDays, isSameDay, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import PremiumCard from '@/components/PremiumCard';

export default function ClientHabits() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
  const today = startOfToday();
  const weekDays = eachDayOfInterval({
    start: subDays(today, 6),
    end: today
  });

  // 1. Fetch Client Profile (to get client_id)
  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile-habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // 2. Fetch Assigned Habits with today's logs
  const { data: habitsData, isLoading: habitsLoading } = useQuery({
    queryKey: ['client-habits-tracking', clientProfile?.id, selectedDate.toISOString()],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: assigned, error: assignedError } = await supabase
        .from('client_habits')
        .select(`
          id,
          habit_id,
          habits (
            name,
            description,
            icon,
            frequency
          )
        `)
        .eq('client_id', clientProfile!.id)
        .eq('is_active', true);

      if (assignedError) throw assignedError;

      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .in('client_habit_id', assigned.map(a => a.id))
        .eq('date', dateStr);

      if (logsError) throw logsError;

      return assigned.map(a => {
        const log = logs.find(l => l.client_habit_id === a.id);
        return {
          ...a,
          completed: log?.completed || false,
          logId: log?.id
        };
      });
    },
    enabled: !!clientProfile
  });

  // 3. Fetch Streak Data
  const { data: streakData } = useQuery({
    queryKey: ['client-habit-streak', clientProfile?.id],
    queryFn: async () => {
      // Very simple streak calculation: look at the last 30 days of logs for any habit
      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('completed', true)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const uniqueDates = Array.from(new Set(logs.map(l => l.date)));
      let streak = 0;
      let checkDate = startOfToday();

      // If nothing done today, check from yesterday
      const hasToday = uniqueDates.some(d => isSameDay(parseISO(d), today));
      if (!hasToday) {
        checkDate = subDays(today, 1);
      }

      for (let i = 0; i < uniqueDates.length; i++) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (uniqueDates.includes(dateStr)) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      return {
        currentStreak: streak,
        totalCompleted: uniqueDates.length
      };
    },
    enabled: !!clientProfile
  });

  // 4. Toggle Habit Mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ clientHabitId, completed, logId }: { clientHabitId: string, completed: boolean, logId?: string }) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      if (logId) {
        const { error } = await supabase
          .from('habit_logs')
          .update({ completed })
          .eq('id', logId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            client_habit_id: clientHabitId,
            date: dateStr,
            completed
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-habits-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['client-habit-streak'] });
      
      // Simple motivation check (just a toast for now)
      toast({
        title: "Vane opdateret!",
        description: "Godt gået! Din streak er opdateret.",
      });
    }
  });

  const completionRate = habitsData 
    ? Math.round((habitsData.filter(h => h.completed).length / habitsData.length) * 100) || 0
    : 0;

  const getAiMessage = (streak: number) => {
    if (streak === 0) return "Kom i gang i dag! Din første vane venter. 💪";
    if (streak < 3) return "God start! Hold kadencen. 🔥";
    if (streak < 7) return "Du er i gang! 3 dage i træk er stærkt. 🚀";
    if (streak >= 7) return "Fantastisk! Over en uge i træk. Du er ustoppelig! 🏆";
    return "Fortsæt det gode arbejde!";
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-32">
      {/* Header & Streak */}
      <div className="text-center space-y-4 pt-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500"
        >
          <Flame className="h-5 w-5 fill-current" />
          <span className="font-black text-lg">{streakData?.currentStreak || 0} Dage i træk!</span>
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tighter">Dine <span className="royal-blue-text">Vaner</span></h1>
        <p className="text-muted-foreground text-sm font-medium px-8">
          {getAiMessage(streakData?.currentStreak || 0)}
        </p>
      </div>

      {/* Week Selector */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
        {weekDays.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isSelected ? 'royal-blue-gradient text-white shadow-lg scale-110' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                {format(day, 'EEE', { locale: language === 'da' ? da : undefined })}
              </span>
              <span className="text-sm font-black">{format(day, 'd')}</span>
              {isToday && !isSelected && <div className="h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* Completion Progress */}
      <PremiumCard className="overflow-visible">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight">Dagens Status</h3>
              <p className="text-[10px] text-muted-foreground font-bold">{completionRate}% Gennemført</p>
            </div>
          </div>
          <div className="relative h-14 w-14">
            {/* Simple Circular Progress via SVG */}
            <svg className="h-full w-full" viewBox="0 0 36 36">
              <path
                className="stroke-white/5"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-primary transition-all duration-1000 ease-out"
                strokeWidth="3"
                strokeDasharray={`${completionRate}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.5" className="text-[8px] font-black fill-white" textAnchor="middle">{completionRate}%</text>
            </svg>
          </div>
        </div>
        <Progress value={completionRate} className="h-2 bg-white/5" />
      </PremiumCard>

      {/* Habis List */}
      <div className="space-y-4">
        {habitsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : !habitsData || habitsData.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-sm font-medium">Din coach har ikke oprettet vaner til dig endnu.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {habitsData.map((habit, idx) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => toggleHabitMutation.mutate({ 
                  clientHabitId: habit.id, 
                  completed: !habit.completed,
                  logId: habit.logId
                })}
                className={`group glass-dark border p-6 rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all active:scale-95 ${habit.completed ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/20%)]' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-4xl transition-all ${habit.completed ? 'bg-primary/20 scale-110' : 'bg-white/5 group-hover:scale-105'}`}>
                    {(habit.habits as any)?.icon || '🎯'}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black tracking-tight transition-all ${habit.completed ? 'text-primary' : ''}`}>
                      {(habit.habits as any)?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">{(habit.habits as any)?.description || 'Daglige fremskridt'}</p>
                  </div>
                </div>
                
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${habit.completed ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-muted-foreground'}`}>
                  {habit.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Rewards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-dark border border-white/5 p-8 rounded-[3rem] text-center space-y-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
        <Trophy className="h-10 w-10 text-primary mx-auto" />
        <h3 className="text-xl font-black tracking-tight">Vane Master</h3>
        <p className="text-xs text-muted-foreground font-medium px-4">Du har gennemført i alt {streakData?.totalCompleted || 0} vaner indtil nu. Fortsæt den gode stil!</p>
        <Button variant="outline" className="rounded-2xl border-white/10 text-xs font-black uppercase tracking-widest h-12 w-full">
          Se alle præstationer
        </Button>
      </motion.div>
    </div>
  );
}
