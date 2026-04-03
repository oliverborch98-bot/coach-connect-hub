import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingDown, Camera, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { jsPDF } from 'jspdf';

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export default function ClientTransformation() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile-pdf'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
        .select('checkin_number, weight')
        .eq('client_id', clientProfile!.id)
        .in('status', ['submitted', 'reviewed'])
        .order('checkin_number');
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
        .order('month_number');
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: score } = useQuery({
    queryKey: ['my-score-pdf', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('accountability_scores').select('*').eq('client_id', clientProfile!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['my-milestones-pdf', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*, goals!inner(client_id)')
        .eq('goals.client_id', clientProfile!.id)
        .eq('achieved', true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clientProfile,
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['my-measurements-pdf', clientProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clientProfile,
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const startWeight = Number(clientProfile?.start_weight) || 0;
  const latestCheckin = checkins.filter(c => c.weight).at(-1);
  const currentWeight = Number(latestCheckin?.weight) || startWeight;
  const goalWeight = Number(clientProfile?.goal_weight) || 0;
  const lost = startWeight - currentWeight;

  const firstPhotos = photos.filter(p => p.month_number === 0);
  const latestMonth = Math.max(0, ...photos.map(p => p.month_number ?? 0));
  const latestPhotos = photos.filter(p => p.month_number === latestMonth && latestMonth > 0);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();
      let y = 0;

      // Header
      doc.setFillColor(26, 26, 46);
      doc.rect(0, 0, w, 45, 'F');
      doc.setFillColor(212, 168, 83);
      doc.rect(0, 43, w, 2, 'F');
      doc.setTextColor(212, 168, 83);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('THE BUILD METHOD', w / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(200, 200, 200);
      doc.text('Min Rejse', w / 2, 30, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`${profile?.full_name ?? 'Klient'} · ${new Date().toLocaleDateString('da-DK')}`, w / 2, 38, { align: 'center' });
      y = 55;

      // Weight stats
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Vægtudvikling', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Startvægt: ${startWeight || '–'} kg`, 20, y);
      doc.text(`Nuværende: ${currentWeight || '–'} kg`, 80, y);
      doc.text(`Ændring: ${lost > 0 ? '-' : '+'}${Math.abs(lost).toFixed(1)} kg`, 140, y);
      y += 6;
      if (goalWeight) {
        doc.text(`Målvægt: ${goalWeight} kg`, 20, y);
        const pct = Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100));
        doc.text(`Progress: ${pct.toFixed(0)}%`, 80, y);
        y += 4;
        // Progress bar
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(20, y, 120, 4, 2, 2, 'F');
        doc.setFillColor(212, 168, 83);
        doc.roundedRect(20, y, 120 * (pct / 100), 4, 2, 2, 'F');
        y += 10;
      } else {
        y += 6;
      }

      // Body measurements
      if (measurements.length >= 2) {
        const first = measurements[0];
        const last = measurements[measurements.length - 1];
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Kropsmålinger', 20, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const fields = [
          { label: 'Talje', key: 'waist_cm' },
          { label: 'Bryst', key: 'chest_cm' },
          { label: 'Hofte', key: 'hips_cm' },
          { label: 'Skuldre', key: 'shoulders_cm' },
        ] as const;
        for (const f of fields) {
          const v1 = first[f.key] != null ? Number(first[f.key]) : null;
          const v2 = last[f.key] != null ? Number(last[f.key]) : null;
          if (v1 != null && v2 != null) {
            const diff = v2 - v1;
            doc.text(`${f.label}: ${v1} → ${v2} cm (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`, 20, y);
            y += 5;
          }
        }
        y += 4;
      }

      // Gamification
      if (score) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Accountability', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Points: ${score.total_points ?? 0}`, 20, y);
        doc.text(`Level: ${score.level ?? 'begynder'}`, 70, y);
        doc.text(`Longest streak: ${score.longest_streak ?? 0} uger`, 120, y);
        y += 10;
      }

      // Milestones
      if (milestones.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Milepæle nået', 20, y);
        y += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        for (const m of milestones.slice(0, 8)) {
          doc.text(`✓ ${m.title}`, 22, y);
          y += 5;
          if (y > 260) { doc.addPage(); y = 20; }
        }
        y += 4;
      }

      // Before/After photos
      if (firstPhotos.length > 0 || latestPhotos.length > 0) {
        if (y > 180) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Før & Efter', 20, y);
        y += 8;

        const photoWidth = 60;
        const photoHeight = 80;

        // Before
        if (firstPhotos.length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text('Start', 20, y);
          y += 4;
          for (const p of firstPhotos.slice(0, 2)) {
            const b64 = await imageUrlToBase64(p.image_url);
            if (b64) {
              doc.addImage(b64, 'JPEG', 20, y, photoWidth, photoHeight);
              doc.addImage(b64, 'JPEG', 20 + photoWidth + 10, y, 0, 0); // skip second slot
            }
            break; // just first photo
          }
          y += photoHeight + 6;
        }

        // After
        if (latestPhotos.length > 0 && latestMonth > 0) {
          if (y > 200) { doc.addPage(); y = 20; }
          doc.text(`Måned ${latestMonth}`, 20, y);
          y += 4;
          for (const p of latestPhotos.slice(0, 2)) {
            const b64 = await imageUrlToBase64(p.image_url);
            if (b64) {
              doc.addImage(b64, 'JPEG', 20, y, photoWidth, photoHeight);
            }
            break;
          }
          y += photoHeight + 6;
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Built By Borch · The Build Method Platform', w / 2, 290, { align: 'center' });
      }

      doc.save(`min-rejse-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Min Transformation</h1>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {generating ? 'Genererer...' : 'Eksportér PDF'}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Vægtudvikling</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div><p className="text-xl md:text-2xl font-extrabold">{startWeight || '–'}</p><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Startvægt</p></div>
          <div><p className="text-xl md:text-2xl font-extrabold text-primary">{currentWeight || '–'}</p><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Nuværende</p></div>
          <div className="col-span-2 md:col-span-1 mt-2 md:mt-0 p-3 rounded-xl bg-white/5 md:bg-transparent border border-white/5 md:border-0">
            <p className="text-xl md:text-2xl font-extrabold text-primary shadow-primary/20">{lost > 0 ? `-${lost.toFixed(1)}` : lost < 0 ? `+${Math.abs(lost).toFixed(1)}` : '0'}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Samlet Ændring (kg)</p>
          </div>
        </div>
        {goalWeight > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Start: {startWeight} kg</span><span>Mål: {goalWeight} kg</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full royal-blue-gradient rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))}%` }} />
            </div>
          </div>
        )}
      </motion.div>

      {(firstPhotos.length > 0 || latestPhotos.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /><span className="text-sm font-semibold">Før & Efter</span></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 text-center font-bold uppercase tracking-widest">Start</p>
              <div className="grid gap-2">
                {firstPhotos.length > 0 ? firstPhotos.map(p => (
                  <img key={p.id} src={p.image_url} alt={p.photo_type ?? 'foto'} className="rounded-2xl w-full aspect-[3/4] object-cover border border-white/5 shadow-2xl" />
                )) : <div className="aspect-[3/4] rounded-2xl bg-secondary/30 border border-dashed border-white/10 flex items-center justify-center"><p className="text-xs text-muted-foreground">Ingen</p></div>}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 text-center font-bold uppercase tracking-widest">Måned {latestMonth}</p>
              <div className="grid gap-2">
                {latestPhotos.length > 0 ? latestPhotos.map(p => (
                  <img key={p.id} src={p.image_url} alt={p.photo_type ?? 'foto'} className="rounded-2xl w-full aspect-[3/4] object-cover border border-white/5 shadow-2xl" />
                )) : <div className="aspect-[3/4] rounded-2xl bg-secondary/30 border border-dashed border-white/10 flex items-center justify-center"><p className="text-xs text-muted-foreground">Ingen</p></div>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
