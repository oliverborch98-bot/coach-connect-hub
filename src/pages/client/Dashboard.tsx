import { motion } from 'framer-motion';
import { Target, Zap, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockGoals = [
  { title: 'Tab 8 kg', current: 5.5, target: 8, unit: 'kg' },
  { title: 'Squat 120 kg', current: 105, target: 120, unit: 'kg' },
  { title: '12 uger gennemført', current: 7, target: 12, unit: 'uger' },
];

export default function ClientDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Din fase</p>
            <p className="text-lg font-bold text-primary">Acceleration</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">7<span className="text-sm font-normal text-muted-foreground">/12</span></p>
            <p className="text-xs text-muted-foreground">uger</p>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full gold-gradient rounded-full transition-all" style={{ width: '58%' }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Næste check-in: <span className="text-foreground font-medium">Søndag 1. mar</span>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Dine mål
        </h2>
        {mockGoals.map((goal, i) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{goal.title}</span>
                <span className="text-muted-foreground">{goal.current}/{goal.target} {goal.unit}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gold-gradient rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Links */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Hurtige handlinger
        </h2>
        {[
          { label: 'Udfyld check-in', to: '/client/checkin' },
          { label: 'Se faseplan', to: '/client/phases' },
          { label: 'Daglige habits', to: '/client/habits' },
        ].map(link => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium hover:border-primary/30 transition-colors"
          >
            {link.label}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>
    </div>
  );
}
