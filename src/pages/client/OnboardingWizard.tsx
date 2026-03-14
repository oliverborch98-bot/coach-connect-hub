import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, User, Target, Dumbbell, Utensils, Brain, Activity, Loader2 } from 'lucide-react';

const STEPS = [
  { title: 'Profil', icon: User, description: 'Bekræft dine oplysninger' },
  { title: 'Mål', icon: Target, description: 'Hvad vil du opnå?' },
  { title: 'Erfaring', icon: Dumbbell, description: 'Din træningsbaggrund' },
  { title: 'Kost', icon: Utensils, description: 'Kostvaner og restriktioner' },
  { title: 'Livsstil', icon: Brain, description: 'Arbejde, søvn & stress' },
  { title: 'Helbred', icon: Activity, description: 'Skader og andet' },
];

const GOALS = [
  { value: 'fat_loss', label: 'Fedttab', emoji: '🔥' },
  { value: 'muscle_gain', label: 'Muskelvækst', emoji: '💪' },
  { value: 'recomp', label: 'Recomp', emoji: '🔄' },
  { value: 'health', label: 'Generel sundhed', emoji: '❤️' },
  { value: 'performance', label: 'Præstation', emoji: '⚡' },
];

const EXPERIENCE = [
  { value: 'beginner', label: 'Begynder', desc: '0-6 måneder' },
  { value: 'intermediate', label: 'Øvet', desc: '6-24 måneder' },
  { value: 'advanced', label: 'Avanceret', desc: '2+ år' },
];

const EQUIPMENT = [
  { value: 'gym', label: '🏋️ Fitness center' },
  { value: 'home', label: '🏠 Hjemmetræning' },
  { value: 'bands', label: '🔗 Elastikker' },
  { value: 'kettlebell', label: '🫎 Kettlebells' },
  { value: 'bodyweight', label: '🤸 Kropsvægt' },
];

interface FormData {
  full_name: string;
  age: string;
  phone: string;
  primary_goal: string;
  experience_level: string;
  equipment: string[];
  dietary_restrictions: string;
  work_situation: string;
  sleep_hours: string;
  stress_level: number;
  injury_history: string;
  additional_notes: string;
}

interface OnboardingWizardProps {
  clientId: string;
  onComplete: () => void;
}

export default function OnboardingWizard({ clientId, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    full_name: user?.fullName ?? '',
    age: '',
    phone: '',
    primary_goal: '',
    experience_level: '',
    equipment: [],
    dietary_restrictions: '',
    work_situation: '',
    sleep_hours: '',
    stress_level: 5,
    injury_history: '',
    additional_notes: '',
  });

  const update = (field: keyof FormData, value: any) => setForm(f => ({ ...f, [field]: value }));
  const toggleEquipment = (val: string) =>
    setForm(f => ({
      ...f,
      equipment: f.equipment.includes(val)
        ? f.equipment.filter(e => e !== val)
        : [...f.equipment, val],
    }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('onboarding_responses').insert({
        client_id: clientId,
        full_name: form.full_name || null,
        age: form.age ? Number(form.age) : null,
        phone: form.phone || null,
        primary_goal: form.primary_goal || null,
        experience_level: form.experience_level || null,
        equipment: form.equipment,
        dietary_restrictions: form.dietary_restrictions || null,
        work_situation: form.work_situation || null,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        stress_level: form.stress_level,
        injury_history: form.injury_history || null,
        additional_notes: form.additional_notes || null,
      } as any);
      if (error) throw error;

      // Also update profile with name/age/phone
      if (form.full_name || form.age || form.phone) {
        await supabase.from('profiles').update({
          full_name: form.full_name || undefined,
          age: form.age ? Number(form.age) : undefined,
          phone: form.phone || undefined,
        }).eq('id', user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      toast.success('Velkommen til The Build Method! 💪');
      onComplete();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const canNext = () => {
    if (step === 0) return form.full_name.trim().length > 0;
    if (step === 1) return !!form.primary_goal;
    if (step === 2) return !!form.experience_level;
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
          <div className="space-y-4">
            <Field label="Fulde navn *" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Dit navn" />
            <Field label="Alder" value={form.age} onChange={v => update('age', v)} placeholder="F.eks. 28" type="number" />
            <Field label="Telefon" value={form.phone} onChange={v => update('phone', v)} placeholder="+45 12 34 56 78" />
          </div>
        );
      case 1:
        return (
          <div className="space-y-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => update('primary_goal', g.value)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  form.primary_goal === g.value
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                <span className="text-xl">{g.emoji}</span>
                <span className="text-sm font-medium">{g.label}</span>
                {form.primary_goal === g.value && <Check className="h-4 w-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Erfaringsniveau *</label>
              {EXPERIENCE.map(e => (
                <button
                  key={e.value}
                  onClick={() => update('experience_level', e.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    form.experience_level === e.value
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:bg-secondary'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.desc}</p>
                  </div>
                  {form.experience_level === e.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Udstyr (vælg alle der passer)</label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT.map(eq => (
                  <button
                    key={eq.value}
                    onClick={() => toggleEquipment(eq.value)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      form.equipment.includes(eq.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:bg-secondary'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Har du nogen kostrestriktioner eller allergier?
              </label>
              <textarea
                value={form.dietary_restrictions}
                onChange={e => update('dietary_restrictions', e.target.value)}
                placeholder="F.eks. laktoseintolerant, vegetar, glutenfri..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Field label="Arbejdssituation" value={form.work_situation} onChange={v => update('work_situation', v)} placeholder="F.eks. kontorarbejde, fysisk arbejde..." />
            <Field label="Gennemsnitlig søvn (timer)" value={form.sleep_hours} onChange={v => update('sleep_hours', v)} placeholder="F.eks. 7.5" type="number" />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Stressniveau ({form.stress_level}/10)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.stress_level}
                onChange={e => update('stress_level', Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Lavt</span>
                <span>Højt</span>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Har du nogen skader eller fysiske begrænsninger?
              </label>
              <textarea
                value={form.injury_history}
                onChange={e => update('injury_history', e.target.value)}
                placeholder="F.eks. gammel knæskade, dårlig skulder..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Andet du vil fortælle din coach?
              </label>
              <textarea
                value={form.additional_notes}
                onChange={e => update('additional_notes', e.target.value)}
                placeholder="Fri tekst – alt der kan hjælpe din coach..."
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold royal-blue-text">THE BUILD METHOD</h1>
          <p className="text-sm text-muted-foreground">Velkommen! Lad os lære dig at kende.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = STEPS[step].icon;
            return <Icon className="h-5 w-5 text-primary" />;
          })()}
          <div>
            <h2 className="text-sm font-semibold">{STEPS[step].title}</h2>
            <p className="text-xs text-muted-foreground">{STEPS[step].description}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
        </div>

        {/* Content */}
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

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext() || saveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gemmer...</>
            ) : step === STEPS.length - 1 ? (
              <><Check className="h-4 w-4" /> Færdig</>
            ) : (
              <>Næste <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
