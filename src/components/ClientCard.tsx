import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const complianceColor = compliance >= 80 ? 'text-emerald-400' : compliance >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => navigate(`/coach/client/${id}`)}
      className="w-full text-left rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:card-glow"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{name}</span>
            {packageType && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                packageType === 'build_method' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {packageLabels[packageType] ?? packageType}
              </span>
            )}
            {subscriptionStatus && (
              <span className={`h-2 w-2 rounded-full ${paymentDot[subscriptionStatus] ?? 'bg-muted-foreground'}`} />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Seneste check-in: {lastCheckin}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Måned {month}/6</div>
          <div className={`text-sm font-semibold ${complianceColor}`}>{compliance}%</div>
        </div>
      </div>
    </motion.button>
  );
}
