import { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const PHOTO_TYPES = ['front', 'side', 'back'] as const;

export default function ProgressPhotos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-photos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, current_month')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['my-progress-photos', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('month_number', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: string) => {
    const file = e.target.files?.[0];
    if (!file || !clientProfile) return;

    const month = selectedMonth || clientProfile.current_month || 1;
    setUploading(true);

    try {
      const filePath = `${clientProfile.id}/${month}/${photoType}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('progress-photos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(filePath);

      await supabase.from('progress_photos').insert({
        client_id: clientProfile.id,
        month_number: Number(month),
        photo_type: photoType as any,
        image_url: publicUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['my-progress-photos', clientProfile.id] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const byMonth = photos.reduce<Record<number, typeof photos>>((acc, p) => {
    const m = p.month_number ?? 0;
    if (!acc[m]) acc[m] = [];
    acc[m].push(p);
    return acc;
  }, {});
  const months = Object.keys(byMonth).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Progress Billeder</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Upload nye billeder</h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Måned:</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs border-0"
          >
            <option value="">Nuværende ({clientProfile?.current_month ?? 1})</option>
            {Array.from({ length: 7 }, (_, i) => i).map(m => (
              <option key={m} value={m}>Måned {m}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PHOTO_TYPES.map(type => (
            <label key={type} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs capitalize">{type}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, type)} disabled={uploading} />
            </label>
          ))}
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploader...
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : months.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Ingen billeder uploadet endnu.</p>
        </div>
      ) : (
        months.map(m => (
          <motion.div key={m} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-semibold mb-3">Måned {m}</h4>
            <div className="grid grid-cols-3 gap-2">
              {byMonth[m].map(p => (
                <div key={p.id} className="space-y-1">
                  <img src={p.image_url} alt={p.photo_type ?? ''} className="rounded-lg aspect-[3/4] object-cover w-full" />
                  <p className="text-[10px] text-muted-foreground text-center capitalize">{p.photo_type}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
