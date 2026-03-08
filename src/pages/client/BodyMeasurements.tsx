import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Ruler, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const fields = [
  { key: 'weight', label: 'Vægt (kg)' },
  { key: 'body_fat_pct', label: 'Fedtprocent (%)' },
  { key: 'chest_cm', label: 'Bryst (cm)' },
  { key: 'waist_cm', label: 'Talje (cm)' },
  { key: 'hips_cm', label: 'Hofter (cm)' },
  { key: 'shoulders_cm', label: 'Skuldre (cm)' },
  { key: 'left_arm_cm', label: 'Venstre arm (cm)' },
  { key: 'right_arm_cm', label: 'Højre arm (cm)' },
  { key: 'left_thigh_cm', label: 'Venstre lår (cm)' },
  { key: 'right_thigh_cm', label: 'Højre lår (cm)' },
] as const;

const chartLines = [
  { key: 'waist_cm', label: 'Talje', color: 'hsl(40, 60%, 58%)' },
  { key: 'chest_cm', label: 'Bryst', color: 'hsl(142, 60%, 45%)' },
  { key: 'hips_cm', label: 'Hofter', color: 'hsl(200, 70%, 55%)' },
  { key: 'shoulders_cm', label: 'Skuldre', color: 'hsl(280, 60%, 55%)' },
];

export default function BodyMeasurements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ['body-measurements', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const row: Record<string, any> = { client_id: clientProfile!.id, date: form.date || new Date().toISOString().slice(0, 10) };
      fields.forEach(f => { if (form[f.key]) row[f.key] = parseFloat(form[f.key]); });
      if (form.notes) row.notes = form.notes;
      const { error } = await supabase.from('body_measurements').insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['body-measurements'] });
      setForm({});
      setShowForm(false);
      toast({ title: 'Målinger gemt ✓' });
    },
    onError: () => toast({ title: 'Fejl', description: 'Kunne ikke gemme', variant: 'destructive' }),
  });

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];

  const getDelta = (key: string) => {
    if (!latest || !prev) return null;
    const l = (latest as any)[key];
    const p = (prev as any)[key];
    if (l == null || p == null) return null;
    return Number((l - p).toFixed(1));
  };

  const chartData = measurements.map(m => ({
    date: format(new Date((m as any).date), 'd/M', { locale: da }),
    ...Object.fromEntries(chartLines.map(c => [c.key, (m as any)[c.key]])),
    weight: (m as any).weight,
  }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kropsmålinger</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <Minus className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Annuller' : 'Ny måling'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-base">Registrér målinger</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Dato</Label>
                  <Input type="date" value={form.date || new Date().toISOString().slice(0, 10)} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fields.map(f => (
                    <div key={f.key}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input type="number" step="0.1" placeholder="–" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Noter</Label>
                  <Textarea placeholder="Valgfri noter..." value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Gem målinger
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 gap-3">
          {fields.slice(0, 4).map(f => {
            const val = (latest as any)[f.key];
            const delta = getDelta(f.key);
            if (val == null) return null;
            return (
              <Card key={f.key}>
                <CardContent className="p-4">
                  <p className="text-[11px] text-muted-foreground">{f.label}</p>
                  <p className="text-lg font-bold">{val}</p>
                  {delta !== null && (
                    <span className={`text-[11px] flex items-center gap-0.5 ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {delta < 0 ? <TrendingDown className="h-3 w-3" /> : delta > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Weight chart */}
      {measurements.length >= 2 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Vægtudvikling</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 12%, 25%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240, 5%, 55%)' }} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ background: 'hsl(240, 20%, 18%)', border: '1px solid hsl(240, 12%, 25%)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(40, 60%, 58%)" strokeWidth={2} dot={{ r: 3 }} name="Vægt (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Body measurements chart */}
      {measurements.length >= 2 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Kropsmål</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 12%, 25%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 55%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240, 5%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(240, 20%, 18%)', border: '1px solid hsl(240, 12%, 25%)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {chartLines.map(c => (
                  <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={{ r: 2 }} name={c.label} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Historik</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...measurements].reverse().map((m: any) => (
              <div key={m.id} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-xs font-semibold">{format(new Date(m.date), 'd. MMMM yyyy', { locale: da })}</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
                  {fields.map(f => {
                    const v = m[f.key];
                    if (v == null) return null;
                    return <span key={f.key} className="text-muted-foreground">{f.label.split(' (')[0]}: <span className="text-foreground font-medium">{v}</span></span>;
                  })}
                </div>
                {m.notes && <p className="text-[11px] text-muted-foreground italic">{m.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Ruler className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Ingen målinger endnu</p>
          <p className="text-xs mt-1">Tryk "Ny måling" for at starte</p>
        </div>
      )}
    </div>
  );
}
