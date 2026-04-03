import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Camera } from 'lucide-react';
import { useState } from 'react';

export default function ClientPhotosTab({ clientId }: { clientId: string }) {
  const [compareWeeks, setCompareWeeks] = useState<[number | null, number | null]>([null, null]);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['client-photos-coach', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('month_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Ingen billeder uploadet endnu</p>
      </div>
    );
  }

  // Group by week
  const byWeek = photos.reduce<Record<number, typeof photos>>((acc, p) => {
    const w = p.month_number ?? 0;
    if (!acc[w]) acc[w] = [];
    acc[w].push(p);
    return acc;
  }, {});
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => b - a);

  const [weekA, weekB] = compareWeeks;
  const photosA = weekA != null ? byWeek[weekA] ?? [] : [];
  const photosB = weekB != null ? byWeek[weekB] ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Compare selector */}
      {weeks.length >= 2 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold mb-2">Sammenlign uger</h4>
          <div className="flex gap-3">
            <select value={weekA ?? ''} onChange={e => setCompareWeeks([Number(e.target.value) || null, weekB])} className="rounded-lg bg-secondary px-3 py-1.5 text-xs border-0">
              <option value="">Vælg uge</option>
              {weeks.map(w => <option key={w} value={w}>Uge {w}</option>)}
            </select>
            <span className="text-xs text-muted-foreground self-center">vs</span>
            <select value={weekB ?? ''} onChange={e => setCompareWeeks([weekA, Number(e.target.value) || null])} className="rounded-lg bg-secondary px-3 py-1.5 text-xs border-0">
              <option value="">Vælg uge</option>
              {weeks.map(w => <option key={w} value={w}>Uge {w}</option>)}
            </select>
          </div>
          {weekA != null && weekB != null && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-medium mb-2">Uge {weekA}</p>
                <div className="grid grid-cols-3 gap-1">
                  {photosA.map(p => (
                    <img key={p.id} src={p.image_url} alt={p.photo_type ?? ''} className="rounded-lg aspect-[3/4] object-cover w-full" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Uge {weekB}</p>
                <div className="grid grid-cols-3 gap-1">
                  {photosB.map(p => (
                    <img key={p.id} src={p.image_url} alt={p.photo_type ?? ''} className="rounded-lg aspect-[3/4] object-cover w-full" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All photos by week */}
      {weeks.map(w => (
        <div key={w} className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold mb-3">Uge {w}</h4>
          <div className="grid grid-cols-3 gap-2">
            {byWeek[w].map(p => (
              <div key={p.id} className="space-y-1">
                <img src={p.image_url} alt={p.photo_type ?? ''} className="rounded-lg aspect-[3/4] object-cover w-full" />
                <p className="text-[10px] text-muted-foreground text-center capitalize">{p.photo_type}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
