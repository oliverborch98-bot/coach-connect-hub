import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestTimerProps {
  seconds: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

export default function RestTimer({ seconds, autoStart = false, onComplete }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const [visible, setVisible] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) { clear(); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clear();
          setRunning(false);
          // Vibrate if available
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear, onComplete]);

  // Auto-start when seconds prop changes (new set logged)
  useEffect(() => {
    setRemaining(seconds);
    if (autoStart && seconds > 0) {
      setRunning(true);
      setVisible(true);
    }
  }, [seconds, autoStart]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (!visible) {
    return (
      <button
        onClick={() => { setVisible(true); setRemaining(seconds); setRunning(true); }}
        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
      >
        <Timer className="h-3 w-3" /> Start timer ({seconds}s)
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2"
      >
        <div className="relative h-8 w-8">
          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary" />
            <circle
              cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${pct * 0.94} 100`}
              strokeLinecap="round"
            />
          </svg>
          <Timer className="absolute inset-0 m-auto h-3 w-3 text-primary" />
        </div>

        <span className={`text-sm font-mono font-bold tabular-nums ${remaining === 0 ? 'text-success' : 'text-foreground'}`}>
          {remaining === 0 ? 'GO!' : `${mins}:${secs.toString().padStart(2, '0')}`}
        </span>

        <div className="flex gap-1 ml-auto">
          <button onClick={() => setRunning(!running)} className="p-1 rounded hover:bg-secondary">
            {running ? <Pause className="h-3 w-3 text-muted-foreground" /> : <Play className="h-3 w-3 text-muted-foreground" />}
          </button>
          <button onClick={() => { setRemaining(seconds); setRunning(false); }} className="p-1 rounded hover:bg-secondary">
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
