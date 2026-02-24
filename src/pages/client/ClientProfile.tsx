import { User } from 'lucide-react';

export default function ClientProfile() {
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Min Profil</h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Profilredigering kommer snart...</p>
      </div>
    </div>
  );
}
