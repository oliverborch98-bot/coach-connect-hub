import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Filter, Loader2, Video, X, Dumbbell, Sparkles, ChevronRight, UserPlus, Info } from 'lucide-react';
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

// Simple Body SVG Diagram Component
const BodyDiagram = ({ activeMuscles = [] }: { activeMuscles: string[] }) => {
  const isActive = (muscle: string) => activeMuscles.some(m => m.toLowerCase().includes(muscle.toLowerCase()));
  
  return (
    <div className="relative w-32 h-64 mx-auto opacity-80 flex items-center justify-center">
      {/* Abstract Body Representation using SVGs */}
      <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill="#333" />
        
        {/* Torso / Bryst & Ryg */}
        <path d="M35,40 Q50,35 65,40 L60,95 Q50,100 40,95 Z" 
              fill={isActive('bryst') || isActive('ryg') || isActive('core') ? '#0066FF' : '#333'} 
              className="transition-colors duration-500" />
              
        {/* Shoulders */}
        <circle cx="30" cy="40" r="8" fill={isActive('skuldr') ? '#0066FF' : '#333'} />
        <circle cx="70" cy="40" r="8" fill={isActive('skuldr') ? '#0066FF' : '#333'} />

        {/* Arms (Biceps/Triceps) */}
        <rect x="23" y="45" width="10" height="40" rx="5" fill={isActive('biceps') || isActive('triceps') || isActive('arm') ? '#0066FF' : '#333'} />
        <rect x="67" y="45" width="10" height="40" rx="5" fill={isActive('biceps') || isActive('triceps') || isActive('arm') ? '#0066FF' : '#333'} />

        {/* Legs (Forlår/Baglår/Glutes) */}
        <rect x="36" y="98" width="12" height="50" rx="6" fill={isActive('ben') || isActive('lår') || isActive('glutes') || isActive('baller') ? '#0066FF' : '#333'} />
        <rect x="52" y="98" width="12" height="50" rx="6" fill={isActive('ben') || isActive('lår') || isActive('glutes') || isActive('baller') ? '#0066FF' : '#333'} />

        {/* Calves (Lægge) */}
        <rect x="37" y="150" width="10" height="40" rx="5" fill={isActive('læg') ? '#0066FF' : '#333'} />
        <rect x="53" y="150" width="10" height="40" rx="5" fill={isActive('læg') ? '#0066FF' : '#333'} />
      </svg>
    </div>
  );
};

export default function CoachExerciseLibrary() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Add Exercise Form State
  const [newExercise, setNewExercise] = useState({
    name: '', description: '', equipment: '', difficulty: 'Begynder', video_url: '', muscle_groups: '', instructions: '', tips: ''
  });

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return data as Exercise[];
    },
  });

  const uniqueMuscles = [...new Set(exercises.flatMap(e => e.muscle_groups || []))].sort();
  const uniqueEquipment = [...new Set(exercises.map(e => e.equipment).filter(Boolean))].sort();
  const uniqueDifficulties = [...new Set(exercises.map(e => e.difficulty).filter(Boolean))].sort();

  const filtered = exercises.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
    const matchMuscle = !filterMuscle || (e.muscle_groups || []).includes(filterMuscle);
    const matchEquip = !filterEquipment || e.equipment === filterEquipment;
    const matchDiff = !filterDifficulty || e.difficulty === filterDifficulty;
    return matchSearch && matchMuscle && matchEquip && matchDiff;
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newExercise.name.trim()) throw new Error('Navn er påkrævet');
      const { error } = await supabase.from('exercises').insert({
        name: newExercise.name,
        description: newExercise.description,
        equipment: newExercise.equipment,
        difficulty: newExercise.difficulty,
        video_url: newExercise.video_url,
        muscle_groups: newExercise.muscle_groups ? newExercise.muscle_groups.split(',').map(s => s.trim()) : [],
        instructions: newExercise.instructions ? newExercise.instructions.split('\n').filter(Boolean) : [],
        tips: newExercise.tips ? newExercise.tips.split('\n').filter(Boolean) : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Øvelse oprettet successfuldt');
      qc.invalidateQueries({ queryKey: ['exercises'] });
      setShowAddModal(false);
      setNewExercise({ name: '', description: '', equipment: '', difficulty: 'Begynder', video_url: '', muscle_groups: '', instructions: '', tips: '' });
    },
    onError: (e: any) => toast.error(`Fejl ved oprettelse: ${e.message}`),
  });

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-exercise-suggest', {
        body: { prompt: aiPrompt }
      });
      
      if (error) throw error;
      setAiSuggestions(data.suggestions || []);
    } catch (e: any) {
      toast.error('Gengivelse af AI mislykkedes: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black royal-blue-text tracking-tighter">BIBLIOTEK</h1>
          <p className="text-muted-foreground mt-1">AI-drevet interaktivt øvelsesbibliotek ({exercises.length} øvelser)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 glow-royal-blue"
        >
          <Plus className="w-5 h-5" /> Opret ny øvelse
        </button>
      </div>

      {/* AI Suggestion Panel */}
      <div className="glass-dark border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-bold">AI Øvelsesassistent</h2>
        </div>
        <div className="flex gap-3 relative z-10">
          <input 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
            placeholder='F.eks. "Find 3 alternativer til squat for en klient med knæproblemer"'
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
          />
          <button 
            onClick={handleAiSuggest}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Foreslå alternativer'}
          </button>
        </div>

        {/* AI Results */}
        <AnimatePresence>
          {aiSuggestions.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              className="mt-6 space-y-3 relative z-10"
            >
              <h3 className="text-sm font-bold text-primary mb-2">Alternativer fundet:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiSuggestions.map((sug, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-xl">
                    <h4 className="font-bold text-[15px] mb-1">{sug.name || 'Øvelse'}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sug.explanation || sug.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="bg-glass-dark border border-white/10 rounded-xl px-4 py-3 text-sm min-w-[140px]">
          <option value="">Alle niveauer</option>
          {uniqueDifficulties.map(d => <option key={d} value={d!}>{d}</option>)}
        </select>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(ex => (
            <motion.div
              layoutId={`card-${ex.id}`}
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
              layoutId={`card-${selectedExercise.id}`}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Column: Media & Diagram */}
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

              {/* Right Column: Details */}
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

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Anbefalede Sæt</p>
                    <p className="text-xl font-bold">3 - 4</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Anbefalede Reps</p>
                    <p className="text-xl font-bold">8 - 12</p>
                  </div>
                </div>

                <div className="space-y-8 flex-1">
                  {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-primary" /> Instruktioner
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

                  {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-emerald-500" /> Coaching Tips
                      </h3>
                      <ul className="space-y-2">
                        {selectedExercise.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span className="text-sm text-emerald-100/70 leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex gap-3 pb-safe">
                  <button onClick={() => {
                    toast.info('Vælg klient fra Dashboard for at sammensætte programmer.');
                    setSelectedExercise(null);
                  }} className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
                    <UserPlus className="w-5 h-5" />
                    Tilføj til klient program
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black mb-6">Opret ny øvelse</h2>
              <div className="space-y-4">
                <input placeholder="Navn på øvelse" value={newExercise.name} onChange={e => setNewExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 transition-colors" />
                <textarea placeholder="Kort beskrivelse" value={newExercise.description} onChange={e => setNewExercise(p => ({ ...p, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 transition-colors resize-none" rows={2} />
                
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Udstyr (f.eks. Håndvægte)" value={newExercise.equipment} onChange={e => setNewExercise(p => ({ ...p, equipment: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50" />
                  <select value={newExercise.difficulty} onChange={e => setNewExercise(p => ({ ...p, difficulty: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50">
                    <option value="Begynder">Begynder</option>
                    <option value="Letøvet">Letøvet</option>
                    <option value="Øvet">Øvet</option>
                  </select>
                </div>

                <input placeholder="Muskelgrupper (kommasepareret)" value={newExercise.muscle_groups} onChange={e => setNewExercise(p => ({ ...p, muscle_groups: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50" />
                <input placeholder="Video URL (YouTube)" value={newExercise.video_url} onChange={e => setNewExercise(p => ({ ...p, video_url: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50" />
                
                <textarea placeholder="Instruktioner (én pr. linje)" value={newExercise.instructions} onChange={e => setNewExercise(p => ({ ...p, instructions: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 resize-none h-24" />
                <textarea placeholder="Coaching Tips (én pr. linje)" value={newExercise.tips} onChange={e => setNewExercise(p => ({ ...p, tips: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 resize-none h-24" />
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors">Annuller</button>
                <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex justify-center items-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gem Øvelse'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
