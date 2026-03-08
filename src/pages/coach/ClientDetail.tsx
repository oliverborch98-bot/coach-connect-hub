import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, StickyNote, Phone, TrendingUp, Camera, Target, CheckSquare, FileText, Loader2, Dumbbell, UtensilsCrossed, FolderOpen, CreditCard, ClipboardList, Ruler } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ClientNotesTab from '@/components/coach/ClientNotesTab';
import ClientGoalsTab from '@/components/coach/ClientGoalsTab';
import ClientHabitsTab from '@/components/coach/ClientHabitsTab';
import ClientPhotosTab from '@/components/coach/ClientPhotosTab';
import ClientMessagesTab from '@/components/coach/ClientMessagesTab';
import ClientTrainingTab from '@/components/coach/ClientTrainingTab';
import ClientNutritionTab from '@/components/coach/ClientNutritionTab';
import ClientDocumentsTab from '@/components/coach/ClientDocumentsTab';
import ClientPaymentTab from '@/components/coach/ClientPaymentTab';
import ClientCheckinsTab from '@/components/coach/ClientCheckinsTab';
import ClientMeasurementsTab from '@/components/coach/ClientMeasurementsTab';

const tabs = [
  { id: 'overview', label: 'Oversigt', icon: TrendingUp },
  { id: 'checkins', label: 'Check-ins', icon: FileText },
  { id: 'training', label: 'Træning', icon: Dumbbell },
  { id: 'nutrition', label: 'Kost', icon: UtensilsCrossed },
  { id: 'photos', label: 'Billeder', icon: Camera },
  { id: 'goals', label: 'Mål', icon: Target },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'notes', label: 'Noter', icon: StickyNote },
  { id: 'documents', label: 'Dokumenter', icon: FolderOpen },
  { id: 'measurements', label: 'Målinger', icon: Ruler },
  { id: 'payment', label: 'Betaling', icon: CreditCard },
  { id: 'messages', label: 'Beskeder', icon: MessageSquare },
];

export default function CoachClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*, profiles!client_profiles_user_id_fkey(full_name, phone, age)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['client-checkins', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', id!)
        .in('status', ['submitted', 'reviewed'])
        .order('checkin_number', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });



  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return <p className="text-muted-foreground">Klient ikke fundet</p>;
  }

  const name = client.profiles?.full_name ?? 'Ukendt';
  const phone = client.profiles?.phone ?? '–';
  const age = client.profiles?.age ?? '–';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const currentWeight = checkins[0]?.weight ?? client.start_weight ?? '–';

  const startW = Number(client.start_weight) || 0;
  const goalW = Number(client.goal_weight) || 0;
  const currW = Number(currentWeight) || 0;
  const weightPct = startW && goalW && startW !== goalW
    ? Math.min(100, Math.max(0, ((startW - currW) / (startW - goalW)) * 100))
    : 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes': return <ClientNotesTab clientId={id!} />;
      case 'goals': return <ClientGoalsTab clientId={id!} />;
      case 'habits': return <ClientHabitsTab clientId={id!} />;
      case 'photos': return <ClientPhotosTab clientId={id!} />;
      case 'messages': return <ClientMessagesTab clientId={id!} />;
      case 'training': return <ClientTrainingTab clientId={id!} />;
      case 'nutrition': return <ClientNutritionTab clientId={id!} />;
      case 'documents': return <ClientDocumentsTab clientId={id!} />;
      case 'payment': return <ClientPaymentTab clientId={id!} />;
      case 'checkins': return <ClientCheckinsTab clientId={id!} />;
      case 'measurements': return <ClientMeasurementsTab clientId={id!} />;
      case 'overview': return renderOverview();
      default: return null;
    }
  };

  const { data: onboarding } = useQuery({
    queryKey: ['client-onboarding', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('client_id', id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const goalLabels: Record<string, string> = {
    fat_loss: '🔥 Fedttab',
    muscle_gain: '💪 Muskelvækst',
    recomp: '🔄 Recomp',
    health: '❤️ Generel sundhed',
    performance: '⚡ Præstation',
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-4">
        {[
          { label: 'Alder', value: `${age} år` },
          { label: 'Telefon', value: phone },
          { label: 'Pakke', value: client.package_type ?? 'The Build Method 6 måneder' },
          { label: 'Primært mål', value: client.primary_goal ?? '–' },
          { label: 'Startdato', value: client.subscription_start ? new Date(client.subscription_start).toLocaleDateString('da-DK') : '–' },
          { label: 'Status', value: client.status ?? 'active' },
        ].map(item => (
          <div key={item.label} className="space-y-2">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-sm font-medium ${item.label === 'Status' ? 'font-semibold text-success' : ''}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Onboarding responses */}
      {onboarding && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Onboarding-svar
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { label: 'Primært mål', value: goalLabels[(onboarding as any).primary_goal] ?? (onboarding as any).primary_goal },
              { label: 'Erfaringsniveau', value: (onboarding as any).experience_level },
              { label: 'Udstyr', value: ((onboarding as any).equipment as string[])?.join(', ') },
              { label: 'Kostrestriktioner', value: (onboarding as any).dietary_restrictions },
              { label: 'Arbejde', value: (onboarding as any).work_situation },
              { label: 'Søvn', value: (onboarding as any).sleep_hours ? `${(onboarding as any).sleep_hours} timer` : null },
              { label: 'Stressniveau', value: (onboarding as any).stress_level ? `${(onboarding as any).stress_level}/10` : null },
              { label: 'Skader/begrænsninger', value: (onboarding as any).injury_history },
              { label: 'Ekstra noter', value: (onboarding as any).additional_notes },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="rounded-lg bg-secondary p-3">
                <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                <p className="text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {startW > 0 && goalW > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Vægtudvikling</h3>
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-2xl font-bold">{startW}</p><p className="text-xs text-muted-foreground">Start</p></div>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `${weightPct}%` }} /></div>
            <div className="text-center"><p className="text-2xl font-bold text-primary">{currW}</p><p className="text-xs text-muted-foreground">Nu</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-muted-foreground">{goalW}</p><p className="text-xs text-muted-foreground">Mål</p></div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Seneste check-ins</h3>
        {checkins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen check-ins endnu</p>
        ) : (
          <div className="grid gap-2">
            {checkins.slice(0, 4).map(ci => (
              <div key={ci.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-secondary px-2 py-1 rounded font-medium">#{ci.checkin_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {ci.submitted_at ? new Date(ci.submitted_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : '–'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>{ci.weight ?? '–'} kg</span>
                  <span>{ci.avg_calories ?? '–'} kcal</span>
                  <span>{ci.workouts_completed ?? 0}/{ci.workouts_target ?? 4}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ci.status === 'reviewed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {ci.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );



  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/coach')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">{initials}</div>
          <div>
            <h1 className="text-xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">Måned {client.current_month ?? 1}/6 — {client.current_phase ?? 'Foundation'}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => setActiveTab('messages')} className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Besked
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 flex items-center gap-2">
            <Phone className="h-4 w-4" /> Book call
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        {renderTabContent()}
      </motion.div>
    </div>
  );
}
