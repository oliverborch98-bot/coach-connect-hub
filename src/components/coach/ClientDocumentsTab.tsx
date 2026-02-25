import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, FileText, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';

const DOC_TYPES = ['action_plan', 'goal_doc', 'coaching_agreement', 'custom'] as const;
const DOC_LABELS: Record<string, string> = {
  action_plan: 'Handlingsplan',
  goal_doc: 'Måldokument',
  coaching_agreement: 'Coaching-aftale',
  custom: 'Andet',
};

export default function ClientDocumentsTab({ clientId }: { clientId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState<string>('custom');
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['coach-client-docs', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_documents')
        .select('*, document_checklist_items(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createDoc = useMutation({
    mutationFn: async () => {
      const { data: doc, error } = await supabase
        .from('shared_documents')
        .insert({ client_id: clientId, title, content, doc_type: docType, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      const items = checklistItems.filter(i => i.trim());
      if (items.length > 0) {
        await supabase.from('document_checklist_items').insert(
          items.map(item => ({ document_id: doc.id, item_text: item }))
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-client-docs', clientId] });
      setShowForm(false);
      setTitle('');
      setContent('');
      setChecklistItems(['']);
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      await supabase.from('document_checklist_items').update({ completed }).eq('id', itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-client-docs', clientId] }),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
        <Plus className="h-4 w-4" /> Nyt dokument
      </button>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
            {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Indhold (markdown)" rows={5} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Checkliste-punkter</p>
            {checklistItems.map((item, i) => (
              <input key={i} value={item} onChange={e => {
                const copy = [...checklistItems];
                copy[i] = e.target.value;
                setChecklistItems(copy);
              }} placeholder={`Punkt ${i + 1}`} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm mb-1" />
            ))}
            <button onClick={() => setChecklistItems([...checklistItems, ''])} className="text-xs text-primary mt-1">+ Tilføj punkt</button>
          </div>
          <button onClick={() => createDoc.mutate()} disabled={!title.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            Gem dokument
          </button>
        </div>
      )}

      {docs.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Ingen dokumenter endnu</p>
        </div>
      ) : (
        docs.map(doc => (
          <div key={doc.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground font-medium">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                <h4 className="text-sm font-semibold">{doc.title}</h4>
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString('da-DK')}</span>
            </div>
            {doc.content && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{doc.content}</p>}
            {doc.document_checklist_items?.length > 0 && (
              <div className="space-y-1">
                {doc.document_checklist_items.map((item: any) => (
                  <button key={item.id} onClick={() => toggleItem.mutate({ itemId: item.id, completed: !item.completed })} className="flex items-center gap-2 text-sm w-full text-left py-1">
                    {item.completed ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.item_text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
