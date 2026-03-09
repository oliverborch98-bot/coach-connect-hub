import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success';
}

export default function StatCard({ label, value, icon: Icon, subtitle, variant = 'default' }: StatCardProps) {
  const iconColor = variant === 'warning' ? 'text-destructive' : variant === 'success' ? 'text-success' : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <div className={`p-1.5 rounded-lg bg-primary/5 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-1 font-medium">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
