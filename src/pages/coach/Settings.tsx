import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, Bell, CheckSquare, Loader2, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function CoachSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('profile');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [newHabit, setNewHabit] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['coach-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: defaultHabits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['coach-default-habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_default_habits')
        .select('*')
        .eq('coach_id', user!.id)
        .order('habit_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-profile'] });
      toast({ title: 'Profil opdateret' });
    },
  });

  const addHabit = useMutation({
    mutationFn: async (name: string) => {
      const nextOrder = defaultHabits.length + 1;
      await supabase.from('coach_default_habits').insert({
        coach_id: user!.id,
        habit_name: name,
        habit_order: nextOrder,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-default-habits'] });
      setNewHabit('');
      toast({ title: 'Habit tilføjet' });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('coach_default_habits').delete().eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-default-habits'] });
      toast({ title: 'Habit fjernet' });
    },
  });

  const updateHabitName = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase.from('coach_default_habits').update({ habit_name: name }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-default-habits'] }),
  });

  const sections = [
    { id: 'profile', label: 'Min profil', icon: User },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'habits', label: 'Standard habits', icon: CheckSquare },
  ];

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Indstillinger</h1>

      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}>
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fulde navn</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Telefon</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <p className="text-sm mt-1">{user?.email}</p>
          </div>
          <button onClick={() => updateProfile.mutate()} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Save className="h-3.5 w-3.5" /> Gem ændringer
          </button>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs text-muted-foreground">Notifikationstyper der sendes automatisk:</p>
          {[
            'Check-in mangler (24 timer efter deadline)',
            'Habits ikke logget i 2 dage',
            'Coaching call i morgen',
            'Milestone nået',
            'Ny fase ulåst',
            'Ny besked fra klient',
            'Program opdateret',
          ].map(text => (
            <div key={text} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{text}</span>
              <div className="w-10 h-5 rounded-full bg-primary/20 flex items-center justify-end px-0.5">
                <div className="w-4 h-4 rounded-full bg-primary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'habits' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Standard habits for nye klienter</p>
            <p className="text-[11px] text-muted-foreground/70">Disse habits tildeles automatisk når du opretter en ny klient.</p>
          </div>

          {habitsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : defaultHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Ingen standard habits endnu. Tilføj nedenfor — ellers bruges systemstandard.</p>
          ) : (
            <div className="space-y-1">
              {defaultHabits.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-secondary/50 group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <input
                    defaultValue={h.habit_name}
                    onBlur={e => {
                      if (e.target.value !== h.habit_name) {
                        updateHabitName.mutate({ id: h.id, name: e.target.value });
                      }
                    }}
                    className="flex-1 bg-transparent text-sm border-none outline-none focus:bg-secondary rounded px-1"
                  />
                  <button onClick={() => deleteHabit.mutate(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              placeholder="Ny habit navn..."
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter' && newHabit.trim()) addHabit.mutate(newHabit.trim());
              }}
            />
            <button
              onClick={() => newHabit.trim() && addHabit.mutate(newHabit.trim())}
              disabled={!newHabit.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Tilføj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
