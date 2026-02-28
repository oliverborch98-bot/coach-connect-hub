import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ClientResources() {
  const { user } = useAuth();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('resources').select('*').eq('published', true).order('drip_unlock_month');
      if (error) throw error;
      return data;
    },
  });

  const currentMonth = clientProfile?.current_month ?? 1;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const openResource = resources.find(r => r.slug === openSlug);

  if (openResource) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button onClick={() => setOpenSlug(null)} className="text-sm text-primary">← Tilbage</button>
        <h1 className="text-lg font-bold">{openResource.title}</h1>
        <div className="rounded-xl border border-border bg-card p-5 text-sm whitespace-pre-wrap leading-relaxed">
          {openResource.content || 'Intet indhold endnu.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Ressourcer</h1>
      {resources.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Ingen ressourcer tilgængelige endnu</p>
        </div>
      ) : (
        resources.map((r, i) => {
          const unlocked = currentMonth >= (r.drip_unlock_month ?? 0);
          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              disabled={!unlocked}
              onClick={() => unlocked && setOpenSlug(r.slug)}
              className={`w-full text-left rounded-xl border bg-card p-4 flex items-center gap-4 transition-colors ${unlocked ? 'border-border hover:border-primary/30' : 'border-border opacity-60'}`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${unlocked ? 'bg-primary/10' : 'bg-secondary'}`}>
                {unlocked ? (r.icon || '📖') : <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{r.title}</p>
                {!unlocked && <p className="text-[10px] text-muted-foreground">Låses op i måned {r.drip_unlock_month}</p>}
                {r.category && unlocked && <p className="text-[10px] text-muted-foreground">{r.category}</p>}
              </div>
            </motion.button>
          );
        })
      )}
    </div>
  );
}
