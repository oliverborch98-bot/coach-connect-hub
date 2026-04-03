import { motion } from 'framer-motion';
import { Phone, Calendar, Clock, Video, ExternalLink, Sparkles, BookOpen, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PremiumCard from '@/components/PremiumCard';

export default function ClientCalls() {
  const { user } = useAuth();

  const { data: clientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-client-profile-calls'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('id, profiles!client_profiles_user_id_fkey(full_name, email)')
        .eq('user_id', user!.id)
        .single()
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['my-calls', clientProfile?.id],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('coaching_calls')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('scheduled_at', { ascending: true })
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['my-sessions', clientProfile?.id],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('client_id', clientProfile!.id)
        .order('scheduled_at', { ascending: true })
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
    enabled: !!clientProfile,
  });

  if (profileLoading || callsLoading || sessionsLoading) return (
    <div className="space-y-8 max-w-lg mx-auto pb-24 px-4 pt-4">
      <div className="h-8 bg-white/5 animate-pulse rounded w-1/2 mb-6"></div>
      <div className="rounded-2xl border border-white/5 bg-white/5 h-[400px] animate-pulse"></div>
      <div className="rounded-2xl border border-white/5 bg-white/5 h-24 animate-pulse mt-8"></div>
    </div>
  );

  const upcomingCalls = calls.filter(c => c.status === 'scheduled');
  const pastCalls = calls.filter(c => c.status !== 'scheduled');

  const CALL_TYPE_LABELS: Record<string, string> = {
    kickoff: 'Opstartssamtale',
    uge2_tjek: 'Uge 2 status',
    uge4_review: 'Uge 4 review',
    uge8_review: 'Uge 8 review',
    afslutning: 'Afslutningssamtale',
    ekstra: 'Ekstra coaching kald',
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-24 text-white px-4 md:px-0 pt-4">
      <header>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#0066FF]" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#0066FF]/80">Face-to-Face</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black tracking-tighter"
        >
          Coaching <span className="text-[#0066FF]">Kald</span>
        </motion.h1>
      </header>

      {/* Calendly Booking Widget */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#0066FF]" /> Book Nyt Kald
          </h2>
        </div>
        
        <PremiumCard
          title="Vælg Tidspunkt"
          subtitle="Book dit næste coaching kald direkte i min kalender"
        >
          <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden glass-morphism border border-white/5 bg-[#ffffff]/[0.02] relative">
            {import.meta.env.VITE_COACH_CALENDLY_URL ? (
              <iframe
                src={`${import.meta.env.VITE_COACH_CALENDLY_URL}?name=${encodeURIComponent(clientProfile?.profiles?.full_name || '')}&email=${encodeURIComponent(clientProfile?.profiles?.email || '')}&embed_domain=${window.location.hostname}&embed_type=Inline&hide_event_type_details=1`}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Calendly Booking"
                className="absolute inset-0 bg-white"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full flex-col text-center p-6 bg-black/50">
                <CalendarDays className="h-10 w-10 text-[#0066FF] mb-4" />
                <p className="text-sm font-bold text-white/70">Calendly link mangler.</p>
                <p className="text-xs text-white/40 mt-2">Kontakt din coach for at få sat booking op.</p>
              </div>
            )}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/20">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-[#0066FF] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-white/90">Husk forberedelse</p>
                <p className="text-[11px] text-white/60 leading-relaxed mt-1">
                  Vær klar 5 minutter før vi starter. Hav dine seneste målinger og eventuelle spørgsmål klar.
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>
      </section>

      {/* NEW: Booked Calendly Sessions */}
      {sessions.length > 0 && (
        <section className="space-y-4 mt-8 pt-4 border-t border-white/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
            <CalendarDays className="h-3.5 w-3.5 text-[#0066FF]" /> Dine Bookede Sessioner
          </h2>
          <div className="grid gap-4">
            {sessions.map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-morphism p-5 rounded-2xl relative overflow-hidden border border-[#0066FF]/20"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#0066FF]" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0066FF] mb-1">
                      Calendly Booking
                    </p>
                    <p className="text-sm font-black uppercase tracking-tight mt-2 text-white/90">
                      Booket den {new Date(session.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {session.calendly_event_url && (
                    <a href={session.calendly_event_url} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF] hover:text-white transition-all">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Legacy / Planned Manual Calls */}
      <section className="space-y-4 mt-8 pt-4 border-t border-white/5">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <Video className="h-3.5 w-3.5 text-[#0066FF]" /> Forløbskald
        </h2>
        
        {upcomingCalls.length === 0 ? (
          <div className="glass-morphism p-8 rounded-2xl text-center border border-white/5">
            <p className="text-xs text-white/50 font-medium uppercase tracking-widest">Ingen forløbskald endnu</p>
            <p className="text-[10px] text-white/40 mt-2">Brug kalenderen ovenfor til at booke tider.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingCalls.map((call, idx) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-morphism p-5 rounded-2xl relative overflow-hidden group border border-white/10"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0066FF] mb-1">
                      {CALL_TYPE_LABELS[call.call_type] || 'Coaching Kald'}
                    </p>
                    <p className="text-sm font-black uppercase tracking-tight text-white/90">
                      {new Date(call.scheduled_at).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-white/50">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold text-white/70">
                        {new Date(call.scheduled_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <button className="p-3 rounded-xl bg-white/5 text-white/60 group-hover:bg-[#0066FF] group-hover:text-white transition-all border border-white/10 group-hover:border-[#0066FF]/50">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Past Calls / Notes */}
      {pastCalls.length > 0 && (
        <section className="space-y-4 mt-8 pt-4 border-t border-white/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
            <BookOpen className="h-3.5 w-3.5 text-[#0066FF]" /> Tidligere Kald & Noter
          </h2>
          <div className="grid gap-3">
            {pastCalls.slice(0, 3).map((call) => (
              <div key={call.id} className="glass-morphism p-4 rounded-xl border border-white/5 opacity-60 hover:opacity-100 transition-all cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/60">
                      {new Date(call.scheduled_at).toLocaleDateString('da-DK')} · {CALL_TYPE_LABELS[call.call_type] || 'Kald'}
                    </p>
                    {call.action_items && (
                      <p className="text-xs font-bold text-[#0066FF] mt-1.5 line-clamp-1">
                        Næste skridt: {call.action_items}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
