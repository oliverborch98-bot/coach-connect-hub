import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Send, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ClientCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ weight: '', bodyFat: '', calories: '', workoutsDone: '', workoutsTarget: '4', energy: 7, sleep: 7, notes: '' });
  const update = (f: string, v: string | number) => setForm(prev => ({ ...prev, [f]: v }));

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Find next pending checkin
  const { data: pendingCheckin } = useQuery({
    queryKey: ['pending-checkin', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .eq('status', 'pending')
        .order('week_number', { ascending: true })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!pendingCheckin) throw new Error('Ingen ventende check-in');
      const { error } = await supabase
        .from('weekly_checkins')
        .update({
          weight: parseFloat(form.weight) || null,
          body_fat_pct: parseFloat(form.bodyFat) || null,
          avg_calories: parseInt(form.calories) || null,
          workouts_completed: parseInt(form.workoutsDone) || null,
          workouts_target: parseInt(form.workoutsTarget) || 4,
          energy_level: form.energy,
          sleep_quality: form.sleep,
          client_notes: form.notes || null,
          status: 'submitted' as const,
          submitted_at: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        })
        .eq('id', pendingCheckin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Check-in indsendt!');
      queryClient.invalidateQueries({ queryKey: ['pending-checkin'] });
      setForm({ weight: '', bodyFat: '', calories: '', workoutsDone: '', workoutsTarget: '4', energy: 7, sleep: 7, notes: '' });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const week = pendingCheckin?.week_number ?? clientProfile?.current_week ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  if (!pendingCheckin && clientProfile) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Ugentlig Check-in</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Ingen ventende check-ins lige nu 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Ugentlig Check-in</h1>
      </div>
      <p className="text-sm text-muted-foreground">Uge {week} af 12</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Vægt (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => update('weight', e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Fedt % (valgfrit)</label>
              <input type="number" step="0.1" value={form.bodyFat} onChange={e => update('bodyFat', e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Gns. daglige kalorier</label>
            <input type="number" value={form.calories} onChange={e => update('calories', e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Træninger gennemført</label>
              <input type="number" value={form.workoutsDone} onChange={e => update('workoutsDone', e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Af mål</label>
              <input type="number" value={form.workoutsTarget} onChange={e => update('workoutsTarget', e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Sliders */}
          {['energy', 'sleep'].map(field => (
            <div key={field} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium">{field === 'energy' ? 'Energi' : 'Søvnkvalitet'}</label>
                <span className="text-xs text-primary font-semibold">{(form as any)[field]}/10</span>
              </div>
              <input type="range" min={1} max={10} value={(form as any)[field]} onChange={e => update(field, parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Noter til coach</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Hvordan har ugen været?" />
          </div>
        </div>

        <button type="submit" disabled={submitMutation.isPending}
          className="w-full gold-gradient rounded-lg py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50">
          {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitMutation.isPending ? 'Indsender...' : 'Indsend check-in'}
        </button>
      </form>
    </div>
  );
}
