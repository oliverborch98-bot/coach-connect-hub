import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Video, X, Dumbbell, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_groups: string[] | null;
  equipment: string | null;
  difficulty: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  instructions: string[] | null;
  tips: string[] | null;
  created_at: string;
}

const BodyDiagram = ({ activeMuscles = [] }: { activeMuscles: string[] }) => {
  const isActive = (muscle: string) => activeMuscles.some(m => m.toLowerCase().includes(muscle.toLowerCase()));
  
  return (
    <div className="relative w-32 h-64 mx-auto opacity-80 flex items-center justify-center">
      <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="20" r="12" fill="#333" />
        <path d="M35,40 Q50,35 65,40 L60,95 Q50,100 40,95 Z" 
              fill={isActive('bryst') || isActive('ryg') || isActive('core') ? '#0066FF' : '#333'} 
              className="transition-colors duration-500" />
        <circle cx="30" cy="40" r="8" fill={isActive('skuldr') ? '#0066FF' : '#333'} />
        <circle cx="70" cy="40" r="8" fill={isActive('skuldr') ? '#0066FF' : '#333'} />
        <rect x="23" y="45" width="10" height="40" rx="5" fill={isActive('biceps') || isActive('triceps') || isActive('arm') ? '#0066FF' : '#333'} />
        <rect x="67" y="45" width="10" height="40" rx="5" fill={isActive('biceps') || isActive('triceps') || isActive('arm') ? '#0066FF' : '#333'} />
        <rect x="36" y="98" width="12" height="50" rx="6" fill={isActive('ben') || isActive('lår') || isActive('glutes') || isActive('baller') ? '#0066FF' : '#333'} />
        <rect x="52" y="98" width="12" height="50" rx="6" fill={isActive('ben') || isActive('lår') || isActive('glutes') || isActive('baller') ? '#0066FF' : '#333'} />
        <rect x="37" y="150" width="10" height="40" rx="5" fill={isActive('læg') ? '#0066FF' : '#333'} />
        <rect x="53" y="150" width="10" height="40" rx="5" fill={isActive('læg') ? '#0066FF' : '#333'} />
      </svg>
    </div>
  );
};

export default function ClientExerciseLibrary() {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['client-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return data as Exercise[];
    },
  });

  const uniqueMuscles = [...new Set(exercises.flatMap(e => e.muscle_groups || []))].sort();
  const uniqueEquipment = [...new Set(exercises.map(e => e.equipment).filter(Boolean))].sort();

  const filtered = exercises.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
    const matchMuscle = !filterMuscle || (e.muscle_groups || []).includes(filterMuscle);
    const matchEquip = !filterEquipment || e.equipment === filterEquipment;
    return matchSearch && matchMuscle && matchEquip;
  });

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 min-h-[50px]">
        <div>
          <h1 className="text-3xl font-black royal-blue-text tracking-tighter">ØVELSER</h1>
          <p className="text-muted-foreground mt-1">Søg og læs instruktioner til {exercises.length} øvelser</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg i biblioteket..."
            className="w-full bg-glass-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-primary/50 transition-colors"
          />
        </div>
        <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)} className="bg-glass-dark border border-white/10 rounded-xl px-4 py-3 text-sm min-w-[160px]">
          <option value="">Alle muskelgrupper</option>
          {uniqueMuscles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)} className="bg-glass-dark border border-white/10 rounded-xl px-4 py-3 text-sm min-w-[140px]">
          <option value="">Alt udstyr</option>
          {uniqueEquipment.map(e => <option key={e} value={e!}>{e}</option>)}
        </select>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(ex => (
            <motion.div
              layoutId={`client-card-${ex.id}`}
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="glass-dark border border-white/5 p-5 rounded-2xl cursor-pointer hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors">
                  <Dumbbell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {ex.difficulty && (
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider ${
                    ex.difficulty === 'Begynder' ? 'bg-emerald-500/10 text-emerald-500' :
                    ex.difficulty === 'Øvet' ? 'bg-red-500/10 text-red-500' :
                    'bg-orange-500/10 text-orange-500'
                  }`}>
                    {ex.difficulty}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base mb-1 truncate">{ex.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{ex.description}</p>
              
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {(ex.muscle_groups || []).slice(0, 3).map(m => (
                  <span key={m} className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-zinc-300">{m}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div 
              layoutId={`client-card-${selectedExercise.id}`}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-5/12 bg-black border-r border-white/5 flex flex-col overflow-y-auto">
                {selectedExercise.video_url && extractYouTubeId(selectedExercise.video_url) ? (
                  <div className="aspect-video w-full bg-zinc-900 shrink-0">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${extractYouTubeId(selectedExercise.video_url)}`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-zinc-900 flex flex-col items-center justify-center shrink-0 border-b border-white/5">
                    <Video className="w-10 h-10 text-zinc-800 mb-2" />
                    <span className="text-xs text-zinc-600 font-medium">Ingen video tilgængelig</span>
                  </div>
                )}
                
                <div className="p-8 flex-1 flex flex-col items-center justify-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6 font-bold">Primære muskler</p>
                  <BodyDiagram activeMuscles={selectedExercise.muscle_groups || []} />
                  <div className="flex flex-wrap justify-center gap-2 mt-8">
                    {(selectedExercise.muscle_groups || []).map(m => (
                      <span key={m} className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col overflow-y-auto">
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-8 pr-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold px-2.5 py-1 rounded-lg bg-primary/10">
                      {selectedExercise.equipment || 'Kropsvægt'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold px-2.5 py-1 rounded-lg bg-white/5">
                      {selectedExercise.difficulty || 'Generel'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black mb-4">{selectedExercise.name}</h2>
                  <p className="text-muted-foreground leading-relaxed">{selectedExercise.description}</p>
                </div>

                <div className="space-y-8 flex-1 pb-safe">
                  {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-primary" /> Læs instruktioner
                      </h3>
                      <ol className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-white/5 ml-1">
                        {selectedExercise.instructions.map((inst, i) => (
                          <li key={i} className="flex gap-4 relative">
                            <span className="relative z-10 w-6 h-6 rounded-full bg-zinc-900 border-2 border-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm text-zinc-300 leading-relaxed pt-1">{inst}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
