import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ClientCardProps {
  id: string;
  name: string;
  week: number;
  compliance: number;
  lastCheckin: string;
  status: 'on_track' | 'behind' | 'at_risk';
}

export default function ClientCard({ id, name, week, compliance, lastCheckin, status }: ClientCardProps) {
  const navigate = useNavigate();

  const statusColor = status === 'on_track' ? 'bg-success' : status === 'behind' ? 'bg-warning' : 'bg-destructive';
  const complianceColor = compliance >= 80 ? 'text-success' : compliance >= 50 ? 'text-warning' : 'text-destructive';

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);

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
            <span className={`h-2 w-2 rounded-full ${statusColor} shrink-0`} />
          </div>
          <p className="text-xs text-muted-foreground">Seneste check-in: {lastCheckin}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Uge {week}/12</div>
          <div className={`text-sm font-semibold ${complianceColor}`}>{compliance}%</div>
        </div>
      </div>
    </motion.button>
  );
}
