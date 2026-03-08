import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fields = [
  { key: 'weight', label: 'Vægt (kg)' },
  { key: 'body_fat_pct', label: 'Fedtprocent (%)' },
  { key: 'chest_cm', label: 'Bryst (cm)' },
  { key: 'waist_cm', label: 'Talje (cm)' },
  { key: 'hips_cm', label: 'Hofter (cm)' },
  { key: 'shoulders_cm', label: 'Skuldre (cm)' },
  { key: 'left_arm_cm', label: 'V. arm (cm)' },
  { key: 'right_arm_cm', label: 'H. arm (cm)' },
  { key: 'left_thigh_cm', label: 'V. lår (cm)' },
  { key: 'right_thigh_cm', label: 'H. lår (cm)' },
];

const chartLines = [
  { key: 'weight', label: 'Vægt', color: 'hsl(40, 60%, 58%)' },
  { key: 'waist_cm', label: 'Talje', color: 'hsl(0, 70%, 50%)' },
  { key: 'chest_cm', label: 'Bryst', color: 'hsl(142, 60%, 45%)' },
  { key: 'hips_cm', label: 'Hofter', color: 'hsl(200, 70%, 55%)' },
];

interface Props { clientId: string; }

export default function ClientMeasurementsTab({ clientId }: Props) {
  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ['body-measurements-coach', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ruler className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Ingen kropsmålinger endnu</p>
      </div>
    );
  }

  const chartData = measurements.map((m: any) => ({
    date: format(new Date(m.date), 'd/M', { locale: da }),
    ...Object.fromEntries(fields.map(f => [f.key, m[f.key]])),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Udvikling</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="text-sm">Alle målinger</CardTitle></CardHeader>
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
    </div>
  );
}
