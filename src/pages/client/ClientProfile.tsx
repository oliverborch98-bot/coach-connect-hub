import { User, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function ClientProfile() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setAge(profile.age?.toString() ?? '');
    }
  }, [profile]);

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile', user?.id],
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          age: age ? parseInt(age) : null,
        })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
      toast({ title: 'Profil opdateret' });
    },
    onError: (err: any) => {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Min Profil</h1>
      </div>

      {/* Avatar & name */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
          {initials}
        </div>
        <div>
          <p className="font-semibold">{profile?.full_name ?? '–'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Profile details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Oplysninger</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:underline"
            >
              Rediger
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Navn</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Telefon</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Alder</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="gold-gradient rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {updateMutation.isPending ? 'Gemmer...' : 'Gem'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-2 text-sm bg-secondary text-foreground"
              >
                Annuller
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="text-sm">{profile?.phone ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alder</p>
              <p className="text-sm">{profile?.age ? `${profile.age} år` : '–'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Program info */}
      {clientProfile && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Mit forløb</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Pakke</p>
              <p>{clientProfile.package_type ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="capitalize">{clientProfile.status ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uge</p>
              <p>{clientProfile.current_week ?? 0}/12</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fase</p>
              <p className="capitalize">{clientProfile.current_phase ?? '–'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Log ud
      </button>
    </div>
  );
}
