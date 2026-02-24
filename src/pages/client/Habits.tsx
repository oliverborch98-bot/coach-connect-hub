import { useState } from 'react';
import { CheckSquare, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultHabits = [
  { id: '1', name: 'Drak 3L vand', completed: true },
  { id: '2', name: 'Fulgte kostplan', completed: true },
  { id: '3', name: 'Trænede i dag', completed: false },
  { id: '4', name: '8 timers søvn', completed: true },
  { id: '5', name: 'Supplement taget', completed: false },
];

export default function ClientHabits() {
  const [habits, setHabits] = useState(defaultHabits);
  const streak = 14;
  const completed = habits.filter(h => h.completed).length;
  const total = habits.length;

  const toggle = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Daglige Habits</h1>
      </div>

      {/* Streak */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-border bg-card p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-3xl font-extrabold">{streak}</span>
        </div>
        <p className="text-xs text-muted-foreground">dages streak</p>
        <p className="text-sm font-medium mt-2">{completed}/{total} habits i dag</p>
      </motion.div>

      {/* Habit List */}
      <div className="space-y-2">
        {habits.map(habit => (
          <motion.button
            key={habit.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggle(habit.id)}
            className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-colors ${
              habit.completed ? 'border-success/30 bg-success/5 text-foreground' : 'border-border bg-card text-foreground'
            }`}
          >
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              habit.completed ? 'border-success bg-success' : 'border-muted-foreground'
            }`}>
              {habit.completed && <CheckSquare className="h-3 w-3 text-success-foreground" />}
            </div>
            {habit.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
