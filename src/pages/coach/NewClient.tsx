import { UserPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CoachNewClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    age: '',
    startDate: '', startWeight: '', goalWeight: '', primaryGoal: '',
    packageType: 'the_system',
    alreadyPaid: false,
  });

  const update = (field: string, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-client', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Klient oprettet! Midlertidig adgangskode: ${data.password}`, { duration: 15000 });
      if (data.checkoutUrl) {
        toast.info('Betalingslink genereret — kopieret til udklipsholder', { duration: 5000 });
        navigator.clipboard.writeText(data.checkoutUrl).catch(() => {});
      }
      navigate('/coach');
    } catch (err: any) {
      toast.error(err.message || 'Fejl ved oprettelse af klient');
    } finally {
      setIsSubmitting(false);
    }
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
          <select
            value={formData.packageType}
            onChange={e => update('packageType', e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="the_system">The System — 1.000 kr/md</option>
            <option value="build_method">Build Method — 1.500 kr/md</option>
          </select>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3 cursor-pointer hover:border-primary/30 transition-colors">
          <input
            type="checkbox"
            checked={formData.alreadyPaid}
            onChange={e => update('alreadyPaid', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Allerede betalt</p>
            <p className="text-xs text-muted-foreground">Klienten har betalt første måned — spring første Stripe-betaling over (30 dages trial)</p>
          </div>
        </label>

        <button type="submit" disabled={isSubmitting}
          className="w-full royal-blue-gradient rounded-lg py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Opretter...' : 'Opret klient'}
        </button>
      </form>
    </div>
  );
}
