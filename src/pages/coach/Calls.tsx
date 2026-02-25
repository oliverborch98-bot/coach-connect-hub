import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Calendar, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CoachCalls() {
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<Record<string, string>>({});

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['coach-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_calls')
        .select('*, client_profiles!coaching_calls_client_id_fkey(id, current_week, user_id, profiles!client_profiles_user_id_fkey(full_name))')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateCall = useMutation({
    mutationFn: async ({ callId, session_notes, action_items, status }: any) => {
      const update: any = {};
      if (session_notes !== undefined) update.session_notes = session_notes;
      if (action_items !== undefined) update.action_items = action_items;
      if (status) update.status = status;
      await supabase.from('coaching_calls').update(update).eq('id', callId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-calls'] }),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const CALL_TYPE_LABELS: Record<string, string> = {
    opstart: 'Opstart', uge2_tjek: 'Uge 2 tjek', uge4_review: 'Uge 4 review',
    uge8_review: 'Uge 8 review', afslutning: 'Afslutning', ekstra: 'Ekstra',
  };
  const STATUS_LABELS: Record<string, string> = { scheduled: 'Planlagt', completed: 'Gennemført', cancelled: 'Aflyst', no_show: 'No-show' };

  // Group by month for calendar view
  const byMonth: Record<string, typeof calls> = {};
  calls.forEach(c => {
    const d = c.scheduled_at ? new Date(c.scheduled_at) : new Date();
    const key = d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(c);
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Coaching Calls</h1>
        <div className="flex gap-1">
          {(['list', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {v === 'list' ? 'Liste' : 'Kalender'}
            </button>
          ))}
        </div>
      </div>

      {view === 'calendar' ? (
        Object.entries(byMonth).map(([month, monthCalls]) => (
          <div key={month}>
            <h3 className="text-sm font-semibold mb-3 capitalize">{month}</h3>
            <div className="space-y-2">
              {monthCalls.map(call => renderCallCard(call))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-2">
          {calls.map((call, i) => (
            <motion.div key={call.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              {renderCallCard(call)}
            </motion.div>
          ))}
        </div>
      )}

      {calls.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Ingen calls planlagt</p>
        </div>
      )}
    </div>
  );

  function renderCallCard(call: any) {
    const clientName = call.client_profiles?.profiles?.full_name ?? 'Ukendt';
    const clientWeek = call.client_profiles?.current_week ?? 0;
    const isOpen = expandedCall === call.id;
    const date = call.scheduled_at ? new Date(call.scheduled_at) : null;

    return (
      <div key={call.id} className="rounded-xl border border-border bg-card overflow-hidden">
        <button onClick={() => setExpandedCall(isOpen ? null : call.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{clientName}</p>
              <p className="text-[10px] text-muted-foreground">{CALL_TYPE_LABELS[call.call_type] ?? call.call_type} · Uge {clientWeek}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs">{date?.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
              <p className="text-[10px] text-muted-foreground">{date?.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              call.status === 'completed' ? 'bg-success/10 text-success' :
              call.status === 'cancelled' || call.status === 'no_show' ? 'bg-destructive/10 text-destructive' :
              'bg-warning/10 text-warning'
            }`}>{STATUS_LABELS[call.status] ?? call.status}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
        {isOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sessionsnoter</label>
              <textarea
                value={notes[call.id] ?? call.session_notes ?? ''}
                onChange={e => setNotes({ ...notes, [call.id]: e.target.value })}
                rows={3}
                className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Action items</label>
              <textarea
                value={actions[call.id] ?? call.action_items ?? ''}
                onChange={e => setActions({ ...actions, [call.id]: e.target.value })}
                rows={2}
                className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateCall.mutate({ callId: call.id, session_notes: notes[call.id] ?? call.session_notes, action_items: actions[call.id] ?? call.action_items })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <Save className="h-3 w-3" /> Gem noter
              </button>
              {call.status === 'scheduled' && (
                <>
                  <button onClick={() => updateCall.mutate({ callId: call.id, status: 'completed' })} className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium">Gennemført</button>
                  <button onClick={() => updateCall.mutate({ callId: call.id, status: 'no_show' })} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">No-show</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
