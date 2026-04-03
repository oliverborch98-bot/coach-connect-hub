import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, User, Target, Dumbbell, Utensils, Activity, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STEPS = [
  { icon: Globe, label: 'Velkommen' },
  { icon: User, label: 'Personligt' },
  { icon: Target, label: 'Mål & Erfaring' },
  { icon: Utensils, label: 'Kost & Livsstil' },
  { icon: Activity, label: 'Helbred' },
  { icon: Check, label: 'Bekræftelse' },
];

const GOALS = [
  { value: 'Vægttab', emoji: '🔥' },
  { value: 'Muskelvækst', emoji: '💪' },
  { value: 'Vedligehold', emoji: '🔄' },
  { value: 'Styrke', emoji: '🏋️' },
  { value: 'Kondition', emoji: '⚡' },
];

const TRAINING_HOURS = [
  { value: 2, label: '1-2 timer' },
  { value: 4, label: '3-4 timer' },
  { value: 5, label: '5+ timer' },
];

const EXPERIENCE = [
  { value: 'Begynder', label: 'Begynder', desc: 'Ny til træning eller tilbage efter lang pause' },
  { value: 'Øvet', label: 'Øvet', desc: 'Træner regelmæssigt og forstår basis teknikker' },
  { value: 'Erfaren', label: 'Erfaren', desc: 'Trænet i flere år med god struktur og teknik' },
];

const DIET_TYPES = [
  { value: 'Ingen restriktioner' },
  { value: 'Vegetar' },
  { value: 'Veganer' },
  { value: 'Laktosefri' },
  { value: 'Glutenfri' },
];

const MEALS_PER_DAY = [2, 3, 4, 5];

interface FormData {
  full_name: string;
  birth_date: string;
  gender: string;
  height_cm: string;
  weight_kg: string;

  goal: string;
  training_hours: number | null;
  experience_level: string;

  diet_type: string;
  meals_per_day: number | null;
  allergies: string;

  injuries: string;
  takes_medication: boolean | null;
  medications: string;
}

interface OnboardingWizardProps {
  clientId: string;
  onComplete: () => void;
}

export default function OnboardingWizard({ clientId, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  
  const [form, setForm] = useState<FormData>({
    full_name: user?.fullName ?? '',
    birth_date: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    goal: '',
    training_hours: null,
    experience_level: '',
    diet_type: '',
    meals_per_day: null,
    allergies: '',
    injuries: '',
    takes_medication: null,
    medications: '',
  });

  const update = (field: keyof FormData, value: any) => setForm(f => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Ensure we don't save undefined/empty strings if not necessary, though empty strings are allowed.
      // 1. Update client_profiles
      const { error: profileError } = await supabase.from('client_profiles').update({
        goal: form.goal || null,
        experience_level: form.experience_level || null,
        training_days_per_week: form.training_hours, // Storing hours into this column as requested
        diet_type: form.diet_type || null,
        meals_per_day: form.meals_per_day,
        allergies: form.allergies || null,
        injuries: form.injuries || null,
        medications: form.takes_medication ? form.medications : null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        start_weight: form.weight_kg ? parseFloat(form.weight_kg) : null,
        onboarding_completed: true,
      }).eq('id', clientId);

      if (profileError) throw profileError;

      // 2. Update Auth Profile
      if (form.full_name) {
        await supabase.from('profiles').update({
          full_name: form.full_name
        }).eq('id', user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-client-profile-onboarding'] });
      toast.success('Velkommen til The Build Method! 💪');
      onComplete();
    },
    onError: (e: any) => toast.error(`Fejl ved gem: ${e.message}`),
  });

  const canNext = () => {
    if (step === 0) return true; // Language always selected
    if (step === 1) return form.full_name.trim().length > 0 && form.birth_date && form.gender && form.height_cm && form.weight_kg;
    if (step === 2) return form.goal && form.training_hours && form.experience_level;
    if (step === 3) return form.diet_type && form.meals_per_day;
    if (step === 4) return form.takes_medication !== null && (form.takes_medication ? form.medications.trim().length > 0 : true);
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else saveMutation.mutate();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex justify-center mb-8">
              <img src="/favicon.png" alt="Logo" className="w-32 h-32 rounded-full object-cover shadow-2xl shadow-primary/20" />
            </div>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-extrabold royal-blue-text">Velkommen til Built By Borch</h1>
              <p className="text-sm text-muted-foreground">Vælg dit foretrukne sprog for platformen.</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setLanguage('da')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  language === 'da'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇩🇰</span>
                  <span className="text-sm font-medium">Dansk</span>
                </div>
                {language === 'da' && <Check className="h-4 w-4 text-primary" />}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  language === 'en'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇬🇧</span>
                  <span className="text-sm font-medium">English</span>
                </div>
                {language === 'en' && <Check className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">Personlige Oplysninger</h2>
            <Field label="Fulde Navn" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Indtast dit fulde navn" />
            <Field label="Fødselsdato" value={form.birth_date} onChange={v => update('birth_date', v)} placeholder="" type="date" />
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Køn</label>
              <div className="grid grid-cols-3 gap-2">
                {['Mand', 'Kvinde', 'Andet'].map((g) => (
                  <button
                    key={g}
                    onClick={() => update('gender', g)}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                      form.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Field label="Højde (cm)" value={form.height_cm} onChange={v => update('height_cm', v)} placeholder="f.eks. 180" type="number" />
              <Field label="Nuværende Vægt (kg)" value={form.weight_kg} onChange={v => update('weight_kg', v)} placeholder="f.eks. 80" type="number" step="0.1" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Mål & Erfaring</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Primært Mål</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => update('goal', g.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      form.goal === g.value
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-xs font-medium">{g.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Træningstimer per uge</label>
              <div className="grid grid-cols-3 gap-2">
                {TRAINING_HOURS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => update('training_hours', t.value)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-medium transition-colors ${
                      form.training_hours === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Teknisk Niveau</label>
              <div className="space-y-2">
                {EXPERIENCE.map(e => (
                  <button
                    key={e.value}
                    onClick={() => update('experience_level', e.value)}
                    className={`w-full flex flex-col items-start p-3 rounded-xl border transition-all ${
                      form.experience_level === e.value ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    <span className="text-sm font-semibold">{e.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 text-left">{e.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Kost & Livsstil</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Kosttype</label>
              <div className="grid grid-cols-2 gap-2">
                {DIET_TYPES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => update('diet_type', d.value)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      form.diet_type === d.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    {d.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Måltider per dag</label>
              <div className="flex gap-2">
                {MEALS_PER_DAY.map(m => (
                  <button
                    key={m}
                    onClick={() => update('meals_per_day', m)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${
                      form.meals_per_day === m ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    {m === 5 ? '5+' : m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Allergier eller Intolerancer (frivilligt)
              </label>
              <textarea
                value={form.allergies}
                onChange={e => update('allergies', e.target.value)}
                placeholder="Skriv evt. allergier her..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Helbredsinformationer</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Skader eller smerter der skal tages hensyn til (frivilligt)
              </label>
              <textarea
                value={form.injuries}
                onChange={e => update('injuries', e.target.value)}
                placeholder="Beskriv eventuelle skader vi skal være opmærksomme på..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-medium text-muted-foreground block">
                Tager du noget medicin der påvirker din træning?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => update('takes_medication', true)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    form.takes_medication === true ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'
                  }`}
                >
                  <Check className="h-4 w-4" /> Ja
                </button>
                <button
                  onClick={() => { update('takes_medication', false); update('medications', ''); }}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                    form.takes_medication === false ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-secondary'
                  }`}
                >
                  Nej
                </button>
              </div>
            </div>

            {form.takes_medication && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 pt-2"
              >
                <label className="text-xs font-medium text-muted-foreground block">
                  Beskriv medicin
                </label>
                <textarea
                  value={form.medications}
                  onChange={e => update('medications', e.target.value)}
                  placeholder="Hvilken medicin og hvordan påvirker det dig?"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </motion.div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-center">Tjek og Bekræft</h2>
            <p className="text-xs text-center text-muted-foreground mb-4">Gennemgå dine svar og bekræft, når du er klar til at starte din rejse.</p>
            
            <div className="space-y-4 bg-secondary/30 rounded-2xl p-4 border border-border/50 text-sm">
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Navn</span>
                <span className="font-medium text-right">{form.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Mål</span>
                <span className="font-medium text-right">{form.goal}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Niveau</span>
                <span className="font-medium text-right">{form.experience_level}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Kosttype</span>
                <span className="font-medium text-right">{form.diet_type} ({form.meals_per_day} måltider)</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Skader/Medicin</span>
                <span className="font-medium text-right">
                  {form.injuries || form.medications ? 'Ja, se detaljer' : 'Ingen noted'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 flex justify-center">
              <Check className="h-12 w-12 text-primary/40 bg-primary/10 p-2 text-primary rounded-full" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-10 px-4">
      <div className="w-full max-w-md mx-auto relative relative">
        
        {step > 0 && (
          <div className="absolute top-0 left-0 w-full flex items-center justify-between z-10 -mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Trin {step + 1} / 6
            </span>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <button
              onClick={next}
              disabled={!canNext() || saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#0066FF] text-white text-base font-bold hover:bg-[#0055DD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0066FF]/30 hover:shadow-[#0066FF]/50"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Gemmer Profil...</>
              ) : step === 5 ? (
                <><Check className="h-5 w-5" /> Start din rejse</>
              ) : (
                <>Næste Trin <ArrowRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-center gap-1.5 mt-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-[#0066FF]' : i < step ? 'w-2 bg-[#0066FF]/40' : 'w-2 bg-zinc-800'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
      />
    </div>
  );
}
