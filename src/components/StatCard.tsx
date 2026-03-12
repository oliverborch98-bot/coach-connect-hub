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
  const iconColor = variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="premium-card p-6 space-y-4 border-white/5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">{label}</span>
        <div className={`p-2 rounded-xl bg-white/5 ${iconColor} glow-lime transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-3xl font-black tracking-tighter text-glow-lime-lime">{value}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
