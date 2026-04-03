import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Calendar, ChevronDown, ChevronUp, Save, Plus, Users, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function CoachCalls() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [bookingClient, setBookingClient] = useState<any>(null);

  useEffect(() => {
    // Load Calendly script
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    head?.appendChild(script);

    // Listen for Calendly booking events
    const handleMessage = async (e: MessageEvent) => {
      if (e.data.event && e.data.event === 'calendly.event_scheduled') {
        if (bookingClient && user) {
          try {
            await supabase.from('coaching_sessions').insert({
              coach_id: user.id,
              client_id: bookingClient.id,
              scheduled_at: new Date().toISOString(), // Fallback: ideally get from Calendly API via webhook, but setting now for record
              status: 'scheduled',
              calendly_event_url: e.data.payload?.event?.uri || ''
            });
            setBookingClient(null);
            qc.invalidateQueries({ queryKey: ['coach-sessions'] });
          } catch (error) {
            console.error('Error saving session:', error);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (head?.contains(script)) head.removeChild(script);
    };
  }, [bookingClient, user, qc]);

  // Skeletons and AbortControllers
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['coach-clients-for-calls'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, user_id, profiles!client_profiles_user_id_fkey(full_name, email)')
        .eq('coach_id', user?.id)
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['coach-calls'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('coaching_calls')
        .select('*, client_profiles!coaching_calls_client_id_fkey(id, current_week, user_id, profiles!client_profiles_user_id_fkey(full_name))')
        .order('scheduled_at', { ascending: true })
        .abortSignal(signal);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*, client_profiles!coaching_sessions_client_id_fkey(id, profiles!client_profiles_user_id_fkey(full_name))')
        .order('scheduled_at', { ascending: true })
        .abortSignal(signal);
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

  if (callsLoading || clientsLoading || sessionsLoading) return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-4 pt-4 pb-24">
      <div className="h-8 bg-white/5 animate-pulse rounded w-1/3 mb-6"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-white/5 h-20 animate-pulse"></div>
      ))}
    </div>
  );

  const CALL_TYPE_LABELS: Record<string, string> = {
    opstart: 'Opstart', uge2_tjek: 'Uge 2 tjek', uge4_review: 'Uge 4 review',
    uge8_review: 'Uge 8 review', afslutning: 'Afslutning', ekstra: 'Ekstra',
  };
  const STATUS_LABELS: Record<string, string> = { scheduled: 'Planlagt', completed: 'Gennemført', cancelled: 'Aflyst', no_show: 'No-show' };

  // Combine calls and sessions for calendar view if needed, but for now we separate them or show legacy calls down below.
  const byMonth: Record<string, typeof calls> = {};
  calls.forEach(c => {
    const d = c.scheduled_at ? new Date(c.scheduled_at) : new Date();
    const key = d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(c);
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 md:px-6 pb-24 md:pb-12 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
          <Phone className="h-6 w-6 text-[#0066FF]" /> 
          Coaching <span className="text-[#0066FF]">Kald</span>
        </h1>
        <div className="flex gap-1 bg-[#ffffff]/[0.02] p-1 rounded-xl glass-morphism border border-white/5">
          {(['list', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${view === v ? 'bg-[#0066FF] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {v === 'list' ? 'Liste' : 'Kalender'}
            </button>
          ))}
        </div>
      </div>

      {/* Client List for Calendly Booking */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0066FF]" /> Alle Klienter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map(client => (
            <div key={client.id} className="glass-morphism border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{client.profiles?.full_name}</p>
                <p className="text-xs text-white/50 truncate max-w-[150px]">{client.profiles?.email}</p>
              </div>
              <button 
                onClick={() => setBookingClient(client)}
                className="bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF] hover:text-white transition-colors px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2"
              >
                <CalendarDays className="h-3 w-3" /> Book Opkald
              </button>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-6 glass-morphism rounded-xl border border-white/10 text-center text-white/50 text-sm">
              Ingen aktive klienter fundet.
            </div>
          )}
        </div>
      </section>

      {/* Calendly Booking Modal */}
      <AnimatePresence>
        {bookingClient && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                <h3 className="font-bold text-lg flex items-center gap-2 flex-wrap">
                  Book tid med <span className="text-[#0066FF]">{bookingClient.profiles?.full_name}</span>
                </h3>
                <button 
                  onClick={() => setBookingClient(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest shrink-0"
                >
                  Luk X
                </button>
              </div>
              <div className="flex-1 bg-white relative">
                {/* Calendly Inline Widget */}
                {import.meta.env.VITE_COACH_CALENDLY_URL ? (
                  <div 
                    className="calendly-inline-widget w-full h-full"
                    data-url={`${import.meta.env.VITE_COACH_CALENDLY_URL}?name=${encodeURIComponent(bookingClient.profiles?.full_name || '')}&email=${encodeURIComponent(bookingClient.profiles?.email || '')}&hide_event_type_details=1`}
                  ></div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-950 flex-col gap-4 p-8 text-center">
                    <CalendarDays className="h-12 w-12 text-[#0066FF]" />
                    <h2 className="text-xl font-bold">Calendly Ikke Opsat</h2>
                    <p className="text-sm font-medium text-zinc-600">Tilføj VITE_COACH_CALENDLY_URL til dine environment variables for at aktivere booking.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Calendly Sessions */}
      {sessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#0066FF]" /> Bookede Sessioner (Calendly)
          </h2>
          <div className="grid gap-3">
            {sessions.map(session => (
              <div key={session.id} className="glass-morphism p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-sm text-[#0066FF]">{session.client_profiles?.profiles?.full_name}</p>
                  <p className="text-xs text-white/60 mt-1">
                    Booket den {new Date(session.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-white/80 capitalize">{session.status}</span>
                  {session.calendly_event_url && (
                    <a href={session.calendly_event_url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-[#0066FF]/20 text-[#0066FF] rounded-lg text-xs font-bold hover:bg-[#0066FF] hover:text-white transition-colors">
                      Se i Calendly
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Legacy Coaching Calls */}
      <section className="space-y-4 pt-4 border-t border-white/5 mt-8">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#0066FF]" /> Gamle/Eksisterende Forløbskald
        </h2>
        
        {view === 'calendar' ? (
          Object.entries(byMonth).map(([month, monthCalls]) => (
            <div key={month} className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest mb-3 text-white/60">{month}</h3>
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
            {calls.length === 0 && (
              <div className="glass-morphism p-8 rounded-xl border border-white/10 text-center">
                <p className="text-sm text-white/50 font-medium">Ingen gamle forløbskald</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );

  function renderCallCard(call: any) {
    const clientName = call.client_profiles?.profiles?.full_name ?? 'Ukendt';
    const clientWeek = call.client_profiles?.current_week ?? 0;
    const isOpen = expandedCall === call.id;
    const date = call.scheduled_at ? new Date(call.scheduled_at) : null;

    return (
      <div key={call.id} className="glass-morphism rounded-xl border border-white/10 overflow-hidden text-white/90">
        <button onClick={() => setExpandedCall(isOpen ? null : call.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 bg-[#0066FF]/10 rounded-full flex items-center justify-center border border-[#0066FF]/20">
              <Calendar className="h-4 w-4 text-[#0066FF]" />
            </div>
            <div>
              <p className="text-sm font-bold">{clientName}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">{CALL_TYPE_LABELS[call.call_type] ?? call.call_type} · Uge {clientWeek}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{date?.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
              <p className="text-[10px] text-[#0066FF] font-black">{date?.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-widest ${
              call.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              call.status === 'cancelled' || call.status === 'no_show' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>{STATUS_LABELS[call.status] ?? call.status}</span>
            <div className="bg-white/5 p-1.5 rounded-md">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </button>
        {isOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4 bg-black/20">
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Sessionsnoter</label>
              <textarea
                value={notes[call.id] ?? call.session_notes ?? ''}
                onChange={e => setNotes({ ...notes, [call.id]: e.target.value })}
                rows={3}
                placeholder="Skriv dine noter her..."
                className="w-full mt-2 bg-black/50 border border-white/10 focus:border-[#0066FF]/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Action items</label>
              <textarea
                value={actions[call.id] ?? call.action_items ?? ''}
                onChange={e => setActions({ ...actions, [call.id]: e.target.value })}
                rows={2}
                placeholder="Næste skridt..."
                className="w-full mt-2 bg-black/50 border border-white/10 focus:border-[#0066FF]/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 transition-colors focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => updateCall.mutate({ callId: call.id, session_notes: notes[call.id] ?? call.session_notes, action_items: actions[call.id] ?? call.action_items })} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black uppercase tracking-wider transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> Gem noter
              </button>
              {call.status === 'scheduled' && (
                <>
                  <button onClick={() => updateCall.mutate({ callId: call.id, status: 'completed' })} className="px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs shadow-none border border-green-500/20 font-black uppercase tracking-wider transition-colors">Gennemført</button>
                  <button onClick={() => updateCall.mutate({ callId: call.id, status: 'no_show' })} className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 shadow-none border border-red-500/20 text-xs font-black uppercase tracking-wider transition-colors">No-show</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
