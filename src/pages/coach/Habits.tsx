import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Filter,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import PremiumCard from '@/components/PremiumCard';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const EMOJI_LIST = ['💧', '😴', '🚶‍♂️', '🥩', '💊', '🍎', '🧘', '🔥', '📚', '☕️', '🥦', '🏃‍♀️', '🏋️‍♂️'];

export default function CoachHabits() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [icon, setIcon] = useState(EMOJI_LIST[0]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // 1. Fetch Habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['coach-habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch Clients
  const { data: clients = [] } = useQuery({
    queryKey: ['coach-clients-for-habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, profiles!client_profiles_user_id_fkey(full_name)')
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data.map(c => ({
        id: c.id,
        name: (c.profiles as any)?.full_name || 'Ukendt'
      }));
    }
  });

  // 3. Create Habit Mutation
  const createHabitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create the habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert({
          coach_id: user.id,
          name,
          description,
          frequency,
          icon
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // 2. Assign to selected clients
      if (selectedClients.length > 0) {
        const assignments = selectedClients.map(clientId => ({
          client_id: clientId,
          habit_id: habit.id
        }));

        const { error: assignError } = await supabase
          .from('client_habits')
          .insert(assignments);

        if (assignError) throw assignError;
      }

      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-habits'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Vane oprettet",
        description: "Vanen er blevet oprettet og tildelt de valgte klienter.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fejl ved oprettelse",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('daily');
    setIcon(EMOJI_LIST[0]);
    setSelectedClients([]);
  };

  const filteredHabits = habits.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Habit Mastery</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tighter"
          >
            Vane <span className="royal-blue-text">Coaching</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Opret, tildel og spor vaner for dine klienter.</p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="royal-blue-gradient px-8 h-14 rounded-2xl text-white font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" />
              {t('create_habit')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dark border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">{t('create_habit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('habit_icon')}</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map(e => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${icon === e ? 'bg-primary border-primary text-xl scale-110 shadow-lg' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('habit_name')}</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Drik 3L vand"
                  className="glass-dark border-white/5 h-12 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('habit_description')}</label>
                <Input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="F.eks. Fordelt over hele dagen"
                  className="glass-dark border-white/5 h-12 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('habit_frequency')}</label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger className="glass-dark border-white/5 h-12">
                    <SelectValue placeholder="Vælg frekvens" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-white/10">
                    <SelectItem value="daily">{t('daily')}</SelectItem>
                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('assign_to_clients')}</label>
                <div className="max-h-40 overflow-y-auto space-y-2 p-2 rounded-xl border border-white/5 bg-white/5">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={client.id} 
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedClients([...selectedClients, client.id]);
                          else setSelectedClients(selectedClients.filter(id => id !== client.id));
                        }}
                        className="border-white/20 data-[state=checked]:bg-primary"
                      />
                      <label htmlFor={client.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {client.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createHabitMutation.mutate()}
                disabled={!name || createHabitMutation.isPending}
                className="w-full royal-blue-gradient h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {createHabitMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : t('create_habit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktive vaner" value={String(habits.length)} icon={CheckSquare} />
        <StatCard label="Klienter med vaner" value={String(new Set(clients.map(c => c.id)).size)} icon={Users} />
        <StatCard label="Gns. Compliance" value="84%" icon={TrendingUp} variant="success" />
        <StatCard label="Udførte i dag" value="12" icon={Check} />
      </div>

      {/* Habits List */}
      <PremiumCard 
        title="Dine oprettede vaner"
        subtitle="Administrer biblioteket af vaner du kan tildele"
        headerAction={
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Søg i vaner..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-64 glass-dark border-white/5 rounded-xl text-xs font-bold"
            />
          </div>
        }
      >
        {habitsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
        ) : filteredHabits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
            <p className="text-muted-foreground text-sm font-medium">Ingen vaner fundet. Kom i gang ved at oprette den første!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map((habit, idx) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-dark border border-white/5 p-6 rounded-[2rem] hover:border-primary/30 transition-all group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {habit.icon || '🎯'}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                    {habit.frequency === 'daily' ? t('daily') : t('weekly')}
                  </Badge>
                </div>
                
                <h4 className="text-lg font-black tracking-tight mb-1 group-hover:royal-blue-text transition-colors">{habit.name}</h4>
                <p className="text-xs text-muted-foreground font-medium mb-6 line-clamp-2">{habit.description || 'Ingen beskrivelse'}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-black">
                        {i}
                      </div>
                    ))}
                    <div className="h-7 w-7 rounded-full border-2 border-black bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                      +4
                    </div>
                  </div>
                  <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
