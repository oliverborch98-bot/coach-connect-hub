import { Settings } from 'lucide-react';

export default function CoachSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Indstillinger</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Profil og indstillinger kommer snart...</p>
      </div>
    </div>
  );
}
