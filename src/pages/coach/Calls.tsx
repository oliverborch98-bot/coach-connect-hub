import { Phone } from 'lucide-react';

export default function CoachCalls() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Phone className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Coaching Calls</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Kalendervisning og call-administration kommer snart...</p>
      </div>
    </div>
  );
}
