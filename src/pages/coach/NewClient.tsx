import { UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function CoachNewClient() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '',
    startDate: '', startWeight: '', goalWeight: '', primaryGoal: '',
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will integrate with Supabase
    alert('Klient oprettet! (Demo)');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Ny klient</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Fulde navn', field: 'name', type: 'text', placeholder: 'Thomas Andersen' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'thomas@email.dk' },
            { label: 'Telefon', field: 'phone', type: 'tel', placeholder: '+45 12 34 56 78' },
            { label: 'Alder', field: 'age', type: 'number', placeholder: '28' },
            { label: 'Startdato', field: 'startDate', type: 'date', placeholder: '' },
            { label: 'Startvægt (kg)', field: 'startWeight', type: 'number', placeholder: '92' },
            { label: 'Målvægt (kg)', field: 'goalWeight', type: 'number', placeholder: '84' },
          ].map(f => (
            <div key={f.field} className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{f.label}</label>
              <input
                type={f.type}
                value={(formData as any)[f.field]}
                onChange={e => update(f.field, e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={f.placeholder}
                required
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Primært mål</label>
          <textarea
            value={formData.primaryGoal}
            onChange={e => update('primaryGoal', e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            placeholder="Tab fedt, opbyg muskelmasse, forbedre energiniveau..."
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Pakke</label>
          <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option>The Build Method 12 uger</option>
          </select>
        </div>

        <button type="submit" className="w-full gold-gradient rounded-lg py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          Opret klient
        </button>
      </form>
    </div>
  );
}
