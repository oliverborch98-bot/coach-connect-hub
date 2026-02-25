import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingDown, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientTransformation() {
  const { user } = useAuth();

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['my-checkins-weight', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('week_number, weight')
        .eq('client_id', clientProfile!.id)
        .in('status', ['submitted', 'reviewed'])
        .order('week_number');
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['my-transformation-photos', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('week_number');
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const startWeight = Number(clientProfile?.start_weight) || 0;
  const latestCheckin = checkins.filter(c => c.weight).at(-1);
  const currentWeight = Number(latestCheckin?.weight) || startWeight;
  const goalWeight = Number(clientProfile?.goal_weight) || 0;
  const lost = startWeight - currentWeight;

  const firstPhotos = photos.filter(p => p.week_number === 0);
  const latestWeek = Math.max(0, ...photos.map(p => p.week_number ?? 0));
  const latestPhotos = photos.filter(p => p.week_number === latestWeek && latestWeek > 0);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="text-lg font-bold">Min Transformation</h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Vægtudvikling</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-extrabold">{startWeight || '–'}</p>
            <p className="text-[10px] text-muted-foreground">Startvægt</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-primary">{currentWeight || '–'}</p>
            <p className="text-[10px] text-muted-foreground">Nuværende</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-success">{lost > 0 ? `-${lost.toFixed(1)}` : lost < 0 ? `+${Math.abs(lost).toFixed(1)}` : '0'}</p>
            <p className="text-[10px] text-muted-foreground">Ændring (kg)</p>
          </div>
        </div>
        {goalWeight > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Start: {startWeight} kg</span>
              <span>Mål: {goalWeight} kg</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full gold-gradient rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))}%` }} />
            </div>
          </div>
        )}
      </motion.div>

      {(firstPhotos.length > 0 || latestPhotos.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Før & Efter</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 text-center">Uge 0</p>
              <div className="grid gap-2">
                {firstPhotos.length > 0 ? firstPhotos.map(p => (
                  <img key={p.id} src={p.image_url} alt={p.photo_type ?? 'foto'} className="rounded-lg w-full aspect-[3/4] object-cover" />
                )) : <div className="aspect-[3/4] rounded-lg bg-secondary flex items-center justify-center"><p className="text-xs text-muted-foreground">Ingen</p></div>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 text-center">Uge {latestWeek}</p>
              <div className="grid gap-2">
                {latestPhotos.length > 0 ? latestPhotos.map(p => (
                  <img key={p.id} src={p.image_url} alt={p.photo_type ?? 'foto'} className="rounded-lg w-full aspect-[3/4] object-cover" />
                )) : <div className="aspect-[3/4] rounded-lg bg-secondary flex items-center justify-center"><p className="text-xs text-muted-foreground">Ingen</p></div>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
