import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, X, Edit2, Save, Video, Image, Plus, Trash2, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Exercise {
  id: string;
  name: string;
  name_da: string | null;
  category: string | null;
  muscle_groups: string[] | null;
  secondary_muscles: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
  video_url: string | null;
  gif_url: string | null;
  instructions: string | null;
  form_cues: string[] | null;
  is_custom: boolean | null;
}

const categoryLabels: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core',
  compound: 'Compound', cardio: 'Cardio', mobility: 'Mobility',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-primary/10 text-primary',
  intermediate: 'bg-accent text-accent-foreground',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function ExerciseLibrary() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Exercise>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '', name_da: '', category: 'push', difficulty: 'intermediate',
    muscle_groups: '', equipment: '', video_url: '', gif_url: '',
    instructions: '', form_cues: '',
  });

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-library'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      return data as Exercise[];
    },
  });

  const categories = [...new Set(exercises.map(e => e.category).filter(Boolean))].sort();
  const equipmentList = [...new Set(exercises.flatMap(e => e.equipment ?? []))].sort();

  const filtered = exercises.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.name.toLowerCase().includes(q) ||
      (e.name_da ?? '').toLowerCase().includes(q) ||
      (e.muscle_groups ?? []).some(m => m.includes(q));
    const matchCat = !filterCategory || e.category === filterCategory;
    const matchEquip = !filterEquipment || (e.equipment ?? []).includes(filterEquipment);
    return matchSearch && matchCat && matchEquip;
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Exercise> }) => {
      const { error } = await supabase.from('exercises').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Øvelse opdateret');
      qc.invalidateQueries({ queryKey: ['exercises-library'] });
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newExercise.name.trim()) throw new Error('Navn er påkrævet');
      const { error } = await supabase.from('exercises').insert({
        name: newExercise.name,
        name_da: newExercise.name_da || null,
        category: newExercise.category || null,
        difficulty: newExercise.difficulty || null,
        muscle_groups: newExercise.muscle_groups ? newExercise.muscle_groups.split(',').map(s => s.trim()) : null,
        equipment: newExercise.equipment ? newExercise.equipment.split(',').map(s => s.trim()) : null,
        video_url: newExercise.video_url || null,
        gif_url: newExercise.gif_url || null,
        instructions: newExercise.instructions || null,
        form_cues: newExercise.form_cues ? newExercise.form_cues.split(',').map(s => s.trim()) : null,
        is_custom: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Øvelse tilføjet');
      qc.invalidateQueries({ queryKey: ['exercises-library'] });
      setShowAdd(false);
      setNewExercise({ name: '', name_da: '', category: 'push', difficulty: 'intermediate', muscle_groups: '', equipment: '', video_url: '', gif_url: '', instructions: '', form_cues: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Øvelse slettet');
      qc.invalidateQueries({ queryKey: ['exercises-library'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditFields({ video_url: ex.video_url, gif_url: ex.gif_url, instructions: ex.instructions, name_da: ex.name_da });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, fields: editFields });
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Øvelsesbibliotek</h1>
          <p className="text-sm text-muted-foreground">{exercises.length} øvelser — tilføj video/GIF links</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Ny øvelse
        </button>
      </div>

      {/* Add new exercise */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Tilføj custom øvelse</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input placeholder="Navn (EN)" value={newExercise.name} onChange={e => setNewExercise(p => ({ ...p, name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Navn (DK)" value={newExercise.name_da} onChange={e => setNewExercise(p => ({ ...p, name_da: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={newExercise.category} onChange={e => setNewExercise(p => ({ ...p, category: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={newExercise.difficulty} onChange={e => setNewExercise(p => ({ ...p, difficulty: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="beginner">Begynder</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Avanceret</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Muskelgrupper (kommasepareret)" value={newExercise.muscle_groups} onChange={e => setNewExercise(p => ({ ...p, muscle_groups: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Udstyr (kommasepareret)" value={newExercise.equipment} onChange={e => setNewExercise(p => ({ ...p, equipment: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Video URL (YouTube/Vimeo)" value={newExercise.video_url} onChange={e => setNewExercise(p => ({ ...p, video_url: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="GIF URL" value={newExercise.gif_url} onChange={e => setNewExercise(p => ({ ...p, gif_url: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="Instruktioner" value={newExercise.instructions} onChange={e => setNewExercise(p => ({ ...p, instructions: e.target.value }))} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
            <input placeholder="Form cues (kommasepareret)" value={newExercise.form_cues} onChange={e => setNewExercise(p => ({ ...p, form_cues: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm w-full" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary">Annuller</button>
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Tilføj
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg øvelse..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Alle kategorier</option>
          {categories.map(c => <option key={c} value={c!}>{categoryLabels[c!] || c}</option>)}
        </select>
        <select value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Alt udstyr</option>
          {equipmentList.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
        {(filterCategory || filterEquipment || search) && (
          <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterEquipment(''); }} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Nulstil
          </button>
        )}
        <span className="self-center text-xs text-muted-foreground">{filtered.length} resultater</span>
      </div>

      {/* Exercise List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => (
            <div key={ex.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{ex.name}</h3>
                    {ex.name_da && <span className="text-xs text-muted-foreground">({ex.name_da})</span>}
                    {ex.is_custom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Custom</span>}
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {ex.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{categoryLabels[ex.category] || ex.category}</span>}
                    {ex.difficulty && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColors[ex.difficulty] || 'bg-secondary text-secondary-foreground'}`}>{ex.difficulty}</span>}
                    {(ex.muscle_groups ?? []).slice(0, 3).map(mg => (
                      <span key={mg} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{mg}</span>
                    ))}
                  </div>
                  {/* Media indicators */}
                  <div className="flex gap-2 mt-1.5">
                    {ex.video_url ? (
                      <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary">
                        <Video className="h-3 w-3" /> Video ✓
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50"><Video className="h-3 w-3" /> Ingen video</span>
                    )}
                    {ex.gif_url ? (
                      <a href={ex.gif_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary">
                        <Image className="h-3 w-3" /> GIF ✓
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50"><Image className="h-3 w-3" /> Ingen GIF</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {editingId === ex.id ? (
                    <button onClick={saveEdit} disabled={updateMutation.isPending} className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors">
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button onClick={() => startEdit(ex)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {ex.is_custom && (
                    <button onClick={() => { if (confirm('Slet øvelse?')) deleteMutation.mutate(ex.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {editingId === ex.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Video URL (YouTube/Vimeo)</label>
                      <input
                        value={editFields.video_url ?? ''}
                        onChange={e => setEditFields(p => ({ ...p, video_url: e.target.value || null }))}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">GIF URL</label>
                      <input
                        value={editFields.gif_url ?? ''}
                        onChange={e => setEditFields(p => ({ ...p, gif_url: e.target.value || null }))}
                        placeholder="https://example.com/exercise.gif"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Dansk navn</label>
                    <input
                      value={editFields.name_da ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, name_da: e.target.value || null }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Instruktioner</label>
                    <textarea
                      value={editFields.instructions ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, instructions: e.target.value || null }))}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs resize-none"
                    />
                  </div>
                  {/* GIF Preview */}
                  {editFields.gif_url && (
                    <div className="rounded-lg overflow-hidden border border-border max-w-[200px]">
                      <img src={editFields.gif_url} alt="GIF preview" className="w-full h-auto" />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground">Annuller</button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
