import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'Generelt' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'call', label: 'Call' },
  { value: 'observation', label: 'Observation' },
  { value: 'adjustment', label: 'Justering' },
] as const;

export default function ClientNotesTab({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [showForm, setShowForm] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['coach-notes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('coach_notes').insert({
        client_id: clientId,
        content,
        category: category as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-notes', clientId] });
      setContent('');
      setShowForm(false);
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Coach noter</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Ny note
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg bg-secondary border-0 px-3 py-2 text-xs">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Skriv en note..."
            className="w-full rounded-lg bg-secondary border-0 px-3 py-2 text-sm min-h-[80px] resize-none"
          />
          <button
            onClick={() => addNote.mutate()}
            disabled={!content.trim() || addNote.isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {addNote.isPending ? 'Gemmer...' : 'Gem note'}
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen noter endnu</p>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary capitalize">{note.category}</span>
                <span className="text-[10px] text-muted-foreground">
                  {note.created_at ? new Date(note.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
