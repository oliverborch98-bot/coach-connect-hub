import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Flame, Medal, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const levelEmoji: Record<string, string> = {
  begynder: '🌱',
  builder: '🔨',
  disciplined: '💪',
  machine: '⚙️',
  built: '🏆',
};

export default function Leaderboard() {
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-lb'],
    queryFn: async () => {
      const { data } = await supabase.from('client_profiles').select('id').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountability_scores')
        .select('client_id, total_points, current_streak, longest_streak, level')
        .order('total_points', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const myRank = scores.findIndex(s => s.client_id === clientProfile?.id) + 1;

  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      {myRank > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-full royal-blue-gradient flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">#{myRank}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Din placering</p>
            <p className="text-xs text-muted-foreground">
              {scores.find(s => s.client_id === clientProfile?.id)?.total_points ?? 0} points
              · Streak: {scores.find(s => s.client_id === clientProfile?.id)?.current_streak ?? 0}
            </p>
          </div>
        </motion.div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-2.5 border-b border-border text-[10px] font-medium text-muted-foreground uppercase">
          <span>#</span>
          <span>Level</span>
          <span className="text-right">Points</span>
          <span className="text-right">Streak</span>
        </div>

        {scores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ingen data endnu</p>
        ) : (
          scores.map((s, i) => {
            const isMe = s.client_id === clientProfile?.id;
            return (
              <motion.div
                key={s.client_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-4 py-3 items-center border-b border-border/50 last:border-0 ${
                  isMe ? 'bg-primary/5' : ''
                }`}
              >
                <span className="text-sm font-bold">
                  {i < 3 ? <Medal className={`h-4 w-4 ${medalColors[i]}`} /> : i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base">{levelEmoji[s.level ?? 'begynder'] ?? '🌱'}</span>
                  <div>
                    <p className="text-xs font-medium capitalize">
                      {isMe ? 'Dig' : `Klient ${i + 1}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">{s.level ?? 'begynder'}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-right">{s.total_points ?? 0}</p>
                <div className="flex items-center justify-end gap-1">
                  <Flame className="h-3 w-3 text-orange-400" />
                  <span className="text-xs font-medium">{s.current_streak ?? 0}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
