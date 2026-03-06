import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Dumbbell, 
  Utensils, 
  Activity, 
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const steps = [
  { id: 'basic', title: 'Grundlæggende info', icon: Activity },
  { id: 'health', title: 'Helbred & Skader', icon: ClipboardCheck },
  { id: 'training', title: 'Træningserfaring', icon: Dumbbell },
  { id: 'nutrition', title: 'Kost & Vaner', icon: Utensils },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    goals: '',
    medical_history: '',
    injuries: '',
    training_experience: '',
    equipment_access: '',
    current_diet: '',
    allergies: '',
    motivation: ''
  });

  const { data: clientProfile } = useQuery({
    queryKey: ['onboarding-client-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, onboarding_completed')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!clientProfile) return;
    
    setIsSubmitting(true);
    try {
      // 1. Save onboarding responses
      const { error: resError } = await supabase
        .from('onboarding_responses')
        .insert({
          client_id: clientProfile.id,
          data: formData
        });

      if (resError) throw resError;

      // 2. Mark onboarding as completed
      const { error: profError } = await supabase
        .from('client_profiles')
        .update({ onboarding_completed: true })
        .eq('id', clientProfile.id);

      if (profError) throw profError;

      toast.success('Onboarding gennemført! Velkommen til Coach Connect.');
      navigate('/client');
    } catch (error: any) {
      toast.error('Der opstod en fejl: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8">
        {/* Progress Header */}
        <div className="flex justify-between items-center px-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                idx === currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              </div>

              {currentStep === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Alder</Label>
                    <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} placeholder="F.eks. 28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Vægt (kg)</Label>
                    <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="F.eks. 85" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Højde (cm)</Label>
                    <Input id="height" name="height" type="number" value={formData.height} onChange={handleInputChange} placeholder="F.eks. 180" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="goals">Hovedmål</Label>
                    <Textarea id="goals" name="goals" value={formData.goals} onChange={handleInputChange} placeholder="Hvad vil du opnå?" />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical_history">Medicinsk historik</Label>
                    <Textarea id="medical_history" name="medical_history" value={formData.medical_history} onChange={handleInputChange} placeholder="Medicin, sygdomme osv." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injuries">Skader (nuværende eller tidligere)</Label>
                    <Textarea id="injuries" name="injuries" value={formData.injuries} onChange={handleInputChange} placeholder="Knæ, ryg, skulder?" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_experience">Træningserfaring</Label>
                    <Textarea id="training_experience" name="training_experience" value={formData.training_experience} onChange={handleInputChange} placeholder="Hvor længe har du trænet?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipment_access">Udstyr til rådighed</Label>
                    <Textarea id="equipment_access" name="equipment_access" value={formData.equipment_access} onChange={handleInputChange} placeholder="Center, home gym, intet?" />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_diet">Nuværende kost</Label>
                    <Textarea id="current_diet" name="current_diet" value={formData.current_diet} onChange={handleInputChange} placeholder="Hvordan spiser du i dag?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergier eller præferencer</Label>
                    <Textarea id="allergies" name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="Gluten, laktose, vegansk?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivation">Motivation (1-10)</Label>
                    <Input id="motivation" name="motivation" type="number" min="1" max="10" value={formData.motivation} onChange={handleInputChange} placeholder="Hvor klar er du?" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between items-center border-t border-border pt-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Tilbage
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gemmer...
                  </>
                ) : (
                  'Start min rejse!'
                )}
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Næste <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-center text-xs text-muted-foreground italic">
          Bare rolig, du kan altid ændre disse oplysninger senere sammen med din coach.
        </p>
      </div>
    </div>
  );
}
