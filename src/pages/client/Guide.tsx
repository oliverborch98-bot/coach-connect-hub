import { BookOpen, CheckCircle2, MessageSquare, ClipboardCheck, Dumbbell, Utensils, Camera, Target, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const sections = [
  {
    icon: ClipboardCheck,
    title: 'Ugentligt check-in',
    description: 'Hver uge udfylder du en check-in med din vægt, energi, søvn og noter. Det er det vigtigste værktøj til at din coach kan justere dit program.',
    tip: 'Udfyld den hver fredag — jo mere ærlig, jo bedre feedback.',
    link: '/client/checkin',
  },
  {
    icon: Dumbbell,
    title: 'Træning',
    description: 'Din coach har lavet et skræddersyet træningsprogram. Log dine sæt, vægte og reps direkte i appen — brug pause-timeren mellem sæt.',
    tip: 'Fokusér på at slå dine egne rekorder fra sidste uge.',
    link: '/client/training',
  },
  {
    icon: Utensils,
    title: 'Kostplan',
    description: 'Find din personlige kostplan med måltider, makroer og opskrifter. Følg den så tæt som muligt for de bedste resultater.',
    tip: 'Meal prep om søndagen gør hele ugen lettere.',
    link: '/client/nutrition',
  },
  {
    icon: CheckCircle2,
    title: 'Daglige habits',
    description: 'Tjek dine daglige vaner af — vand, kost, søvn og supplements. Når du gennemfører alle habits på én dag, optjener du point.',
    tip: 'Perfekte dage bygger streaks og løfter dig på ranglisten.',
    link: '/client/habits',
  },
  {
    icon: Camera,
    title: 'Progressionsbilleder',
    description: 'Upload front-, side- og bagbilleder hver måned. Det er ofte her du kan se de største ændringer — selv når vægten står stille.',
    tip: 'Tag billeder om morgenen, samme lys og vinkel.',
    link: '/client/photos',
  },
  {
    icon: Target,
    title: 'Mål & milepæle',
    description: 'Se dine aktive mål og spor din fremgang. Når du når en milepæl, optjener du bonuspoint.',
    tip: 'Hold fokus på 1-2 hovedmål ad gangen.',
    link: '/client/goals',
  },
  {
    icon: MessageSquare,
    title: 'Beskeder',
    description: 'Skriv direkte til din coach via beskederne. Brug det til spørgsmål, opdateringer eller hvis du har brug for hjælp.',
    tip: 'Jo flere detaljer du giver, jo bedre svar får du.',
    link: '/client/messages',
  },
  {
    icon: Sparkles,
    title: 'Transformation',
    description: 'Se din samlede rejse — vægtudvikling, before/after og en PDF-rapport du kan gemme og dele.',
    tip: 'Tjek den regelmæssigt for at holde motivationen oppe.',
    link: '/client/transformation',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ClientGuide() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Sådan bruger du platformen</h1>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <p className="text-sm font-semibold text-primary">Velkommen til The Build Method 🎉</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Denne guide hjælper dig med at få det maksimale ud af dit forløb. 
          Platformen er designet til at gøre din transformation enkel og struktureret. 
          Herunder finder du en oversigt over de vigtigste funktioner.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-sm font-semibold">⭐ De 3 vigtigste ting</p>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
          <li><span className="text-foreground font-medium">Udfyld check-in hver uge</span> — det er din coaches vigtigste kilde til at hjælpe dig</li>
          <li><span className="text-foreground font-medium">Log din træning</span> — så vi kan se progressionen og justere dit program</li>
          <li><span className="text-foreground font-medium">Fuldfør dine daglige habits</span> — konsistens slår perfektion</li>
        </ol>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {sections.map((s) => (
          <motion.button
            key={s.title}
            variants={item}
            onClick={() => navigate(s.link)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                <p className="text-[11px] text-primary/80 italic">💡 {s.tip}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
