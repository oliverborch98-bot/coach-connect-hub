import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface ClientCardProps {
  id: string;
  name: string;
  month: number;
  compliance: number;
  lastCheckin: string;
  status: 'on_track' | 'behind' | 'at_risk';
  packageType?: string;
  subscriptionStatus?: string;
}

const statusColors = {
  on_track: 'bg-emerald-500/20 text-emerald-400',
  behind: 'bg-amber-500/20 text-amber-400',
  at_risk: 'bg-red-500/20 text-red-400',
};

const packageLabels: Record<string, string> = {
  the_system: 'System',
  build_method: 'Build Method',
};

const paymentDot: Record<string, string> = {
  active: 'bg-emerald-400',
  past_due: 'bg-red-400',
  paused: 'bg-amber-400',
};

export default function ClientCard({ id, name, month, compliance, lastCheckin, status, packageType, subscriptionStatus }: ClientCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const complianceColor = compliance >= 80 ? 'text-emerald-400' : compliance >= 50 ? 'text-amber-400' : 'text-red-400';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Er du sikker på, at du vil slette ${name}? Dette kan ikke fortrydes.`)) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-client', {
        body: { clientId: id }
      });

      if (error) throw error;
      toast.success(`${name} er blevet slettet`);
      window.location.reload(); // Refresh to update list
    } catch (err: any) {
      console.error('Error deleting client:', err);
      toast.error('Kunne ikke slette klient. Prøv igen senere.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="w-full premium-card glass-reflection group relative overflow-hidden"
    >
      {/* Delete Button - Absolute Positioned and Z-index fixed */}
      <div className="absolute top-3 right-3 z-50">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50 shadow-lg border border-red-500/20"
          title="Slet klient"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Main Navigation Button */}
      <button
        onClick={() => navigate(`/coach/client/${id}`)}
        className="w-full text-left p-5 flex items-center gap-4 relative z-10"
      >
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-background border border-white/5 flex items-center justify-center text-sm font-black text-foreground shrink-0 shadow-inner group-hover:border-primary/20 transition-colors">
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate group-hover:text-primary transition-colors duration-300">{name}</span>
            {packageType && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${packageType === 'build_method' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-white/5 text-muted-foreground'
                }`}>
                {packageLabels[packageType] ?? packageType}
              </span>
            )}
            {subscriptionStatus && (
              <div className={`h-1.5 w-1.5 rounded-full ${paymentDot[subscriptionStatus] ?? 'bg-muted-foreground'} shadow-[0_0_5px_currentColor]`} />
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="opacity-50">Sidst aktiv:</span>
            <span className="text-foreground/70">{lastCheckin}</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Mån {month}/6</div>
          <div className={`text-lg font-black tracking-tighter ${complianceColor} drop-shadow-sm`}>
            {compliance}%
          </div>
        </div>
      </button>

      {/* Subtle progress bar at bottom */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-primary/5 w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${compliance}%` }}
          className={`h-full ${compliance >= 80 ? 'bg-emerald-500' : compliance >= 50 ? 'bg-amber-500' : 'bg-red-500'} opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
        />
      </div>
    </motion.div>
  );
}
