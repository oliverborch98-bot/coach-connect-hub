import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, X, Clock, Flame, Beef, Wheat, Droplets, ChefHat, Trash2, Edit2, Save, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ingredient {
  name: string;
  amount: string;
}

interface RecipeForm {
  title: string;
  description: string;
  instructions: string;
  ingredients: Ingredient[];
  prep_time_min: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  tags: string[];
}

const emptyForm: RecipeForm = {
  title: '',
  description: '',
  instructions: '',
  ingredients: [{ name: '', amount: '' }],
  prep_time_min: null,
  calories: null,
  protein_g: null,
  carbs_g: null,
  fat_g: null,
  tags: [],
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function RecipeLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeForm>({ ...emptyForm });
  const [tagInput, setTagInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        instructions: form.instructions || null,
        ingredients: JSON.parse(JSON.stringify(form.ingredients.filter(i => i.name.trim()))),
        prep_time_min: form.prep_time_min,
        calories: form.calories,
        protein_g: form.protein_g,
        carbs_g: form.carbs_g,
        fat_g: form.fat_g,
        tags: form.tags,
      } as any;

      if (editingId) {
        const { error } = await supabase.from('recipes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success(editingId ? 'Opskrift opdateret!' : 'Opskrift oprettet!');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Opskrift slettet');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ ...emptyForm, ingredients: [{ name: '', amount: '' }] });
    setEditingId(null);
    setShowForm(false);
    setTagInput('');
  };

  const startEdit = (r: any) => {
    setForm({
      title: r.title,
      description: r.description || '',
      instructions: r.instructions || '',
      ingredients: (r.ingredients as Ingredient[])?.length ? r.ingredients : [{ name: '', amount: '' }],
      prep_time_min: r.prep_time_min,
      calories: r.calories,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      tags: r.tags || [],
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '' }] }));
  const removeIngredient = (i: number) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i: number, field: keyof Ingredient, val: string) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing) }));

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const allTags = Array.from(new Set((recipes || []).flatMap(r => Array.isArray(r.tags) ? r.tags : [])));

  const filtered = (recipes || []).filter(r => {
    if (!r || !r.title) return false;
    const matchesSearch = r.title.toLowerCase().includes((search || '').toLowerCase()) ||
      (Array.isArray(r.tags) && r.tags.some((t: string) => t.toLowerCase().includes((search || '').toLowerCase())));
    const matchesFilter = !activeFilter || (Array.isArray(r.tags) && r.tags.includes(activeFilter));
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin text-primary rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Opskrifter
          </h1>
          <p className="text-muted-foreground text-sm">Administrer din samling af premium opskrifter</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Ny opskrift
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar/Filters */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Søg..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Kategorier
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!activeFilter ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}
              >
                Alle
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(tag === activeFilter ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tag === activeFilter ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    {editingId ? 'Redigér Opskrift' : 'Opret Ny Opskrift'}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Navn på opskrift</label>
                      <input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="fx Elite Protein Pancakes"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Beskrivelse</label>
                      <input
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Kort pitch af retten..."
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  {/* Macros Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: 'calories', label: 'Kalorier', icon: Flame, color: 'text-orange-400' },
                      { key: 'protein_g', label: 'Protein (g)', icon: Beef, color: 'text-blue-400' },
                      { key: 'carbs_g', label: 'Kulhydrat (g)', icon: Wheat, color: 'text-amber-400' },
                      { key: 'fat_g', label: 'Fedt (g)', icon: Droplets, color: 'text-yellow-400' },
                      { key: 'prep_time_min', label: 'Tid (min)', icon: Clock, color: 'text-primary' },
                    ].map(({ key, label, icon: Icon, color }) => (
                      <div key={key} className="p-3 rounded-xl border border-white/5 bg-black/10">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
                          <Icon className={`h-3 w-3 ${color}`} /> {label}
                        </label>
                        <input
                          type="number"
                          value={(form as any)[key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">Ingredienser</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {form.ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-2 group">
                          <input
                            value={ing.amount}
                            onChange={e => updateIngredient(i, 'amount', e.target.value)}
                            placeholder="Mængde"
                            className="w-1/4 px-3 py-2 rounded-lg border border-white/5 bg-black/20 text-sm focus:ring-1 focus:ring-primary/30"
                          />
                          <input
                            value={ing.name}
                            onChange={e => updateIngredient(i, 'name', e.target.value)}
                            placeholder="Ingrediens"
                            className="flex-1 px-3 py-2 rounded-lg border border-white/5 bg-black/20 text-sm focus:ring-1 focus:ring-primary/30"
                          />
                          {form.ingredients.length > 1 && (
                            <button 
                              onClick={() => removeIngredient(i)} 
                              className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={addIngredient} 
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      + Tilføj Ingrediens
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Fremgangsmåde</label>
                    <textarea
                      value={form.instructions}
                      onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                      placeholder="Skriv trin-for-trin instruktioner..."
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-sm resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {form.tags.map(t => (
                        <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                          {t}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} />
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Tilføj tag (Tryk Enter)"
                        className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-black/20 text-sm focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 gap-3">
                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold"
                    >
                      Annuller
                    </button>
                    <button
                      onClick={() => saveMutation.mutate()}
                      disabled={!form.title.trim() || saveMutation.isPending}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold disabled:opacity-50 hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                    >
                      <Save className="h-4 w-4" />
                      {saveMutation.isPending ? 'Gemmer...' : editingId ? 'Opdater Opskrift' : 'Gem Opskrift'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-dashed border-white/10 bg-white/5 space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-white/60">Ingen opskrifter fundet</p>
                <p className="text-sm text-muted-foreground">Start med at oprette din første opskrift eller ændr søgningen.</p>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filtered.map(r => (
                <motion.div
                  key={r.id}
                  variants={item}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 p-5 shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  {/* Hover Actions */}
                  <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                      className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-primary transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
                      className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors pr-20">{r.title}</h3>
                      {r.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>}
                    </div>

                    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-4 py-3 px-4 rounded-xl bg-black/20 border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Kalorier</span>
                        <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                          <Flame className="h-3 w-3" /> {r.calories || '-'}
                        </span>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">P</span>
                        <span className="text-xs font-bold text-blue-400">{r.protein_g ? `${r.protein_g}g` : '-'}</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">K</span>
                        <span className="text-xs font-bold text-amber-400">{r.carbs_g ? `${r.carbs_g}g` : '-'}</span>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">F</span>
                        <span className="text-xs font-bold text-yellow-400">{r.fat_g ? `${r.fat_g}g` : '-'}</span>
                      </div>
                      <div className="col-span-2 sm:ml-auto flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {r.prep_time_min ? `${r.prep_time_min}m` : '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(r.tags as string[])?.slice(0, 3).map((t: string) => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground group-hover:border-primary/20 group-hover:text-primary/70 transition-colors">
                          {t}
                        </span>
                      ))}
                      {(r.tags as string[])?.length > 3 && (
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-bold text-muted-foreground">
                          +{(r.tags as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
