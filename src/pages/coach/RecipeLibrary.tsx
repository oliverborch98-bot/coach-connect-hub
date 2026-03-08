import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, X, Clock, Flame, Beef, Wheat, Droplets, ChefHat, Trash2, Edit2, Save } from 'lucide-react';
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

export default function RecipeLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeForm>({ ...emptyForm });
  const [tagInput, setTagInput] = useState('');

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
        ingredients: form.ingredients.filter(i => i.name.trim()),
        prep_time_min: form.prep_time_min,
        calories: form.calories,
        protein_g: form.protein_g,
        carbs_g: form.carbs_g,
        fat_g: form.fat_g,
        tags: form.tags,
      };

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

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags as string[])?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Opskrifter</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Ny opskrift
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg opskrifter..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border bg-card p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{editingId ? 'Redigér opskrift' : 'Ny opskrift'}</h2>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Opskriftens navn *"
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Kort beskrivelse..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Macros */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: 'calories', label: 'Kalorier', icon: Flame },
                { key: 'protein_g', label: 'Protein (g)', icon: Beef },
                { key: 'carbs_g', label: 'Kulhydrat (g)', icon: Wheat },
                { key: 'fat_g', label: 'Fedt (g)', icon: Droplets },
                { key: 'prep_time_min', label: 'Tid (min)', icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                    <Icon className="h-3 w-3" /> {label}
                  </label>
                  <input
                    type="number"
                    value={(form as any)[key] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div>
              <label className="text-xs font-medium mb-2 block">Ingredienser</label>
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="Mængde (fx 200g)"
                    className="w-1/3 px-2 py-1.5 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingrediens"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {form.ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addIngredient} className="text-xs text-primary hover:underline">+ Tilføj ingrediens</button>
            </div>

            {/* Instructions */}
            <div>
              <label className="text-xs font-medium mb-1 block">Fremgangsmåde</label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Skriv trin-for-trin instruktioner..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs">
                    {t}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Tilføj tag..."
                  className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button onClick={addTag} className="text-xs text-primary hover:underline">Tilføj</button>
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={!form.title.trim() || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Gemmer...' : editingId ? 'Opdater opskrift' : 'Gem opskrift'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Indlæser...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <ChefHat className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Ingen opskrifter endnu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-secondary"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => deleteMutation.mutate(r.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.calories && <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{r.calories} kcal</span>}
                {r.protein_g && <span>P: {r.protein_g}g</span>}
                {r.carbs_g && <span>K: {r.carbs_g}g</span>}
                {r.fat_g && <span>F: {r.fat_g}g</span>}
                {r.prep_time_min && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.prep_time_min} min</span>}
              </div>
              {(r.tags as string[])?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(r.tags as string[]).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-[10px]">{t}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
