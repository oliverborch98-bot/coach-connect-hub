import { useState, useEffect, useRef } from 'react';
import { Search, Send, Loader2, MessageSquare, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoachMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClientListOpen, setIsClientListOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch all clients linked to this coach
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['coach-clients-msg', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select(`
          id,
          user_id,
          profiles:profiles!user_id (
            full_name
          )
        `)
        .eq('coach_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch unread counts for each client
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['unread-counts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(m => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const selectedClient = clients.find(c => c.user_id === selectedClientId);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', user?.id, selectedClientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedClientId}),and(sender_id.eq.${selectedClientId},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!selectedClientId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('coach-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Mark as read
  useEffect(() => {
    if (!user || !selectedClientId || messages.length === 0) return;
    const unread = messages.filter(m => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unread.map(m => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
        });
    }
  }, [messages, user, selectedClientId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: selectedClientId!,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClientId) return;
    sendMutation.mutate(newMessage.trim());
  };

  const filteredClients = clients.filter(c => 
    c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] gap-6 overflow-hidden px-4 md:px-6 pb-24 md:pb-0">
      {/* Client List */}
      <aside className={`w-full md:w-80 flex flex-col glass-dark rounded-3xl border border-white/5 overflow-hidden transition-all duration-300 ${selectedClientId && 'hidden md:flex'} ${!isClientListOpen && 'hidden md:flex opacity-0 -translate-x-10'}`}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black royal-blue-text">Beskeder</h2>
            <div className="bg-primary/20 p-2 rounded-xl border border-primary/20">
               <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Søg klient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {loadingClients ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredClients.length === 0 ? (
             <div className="text-center p-8 text-muted-foreground text-sm">Ingen klienter fundet</div>
          ) : (
            filteredClients.map(client => (
              <button
                key={client.user_id}
                onClick={() => setSelectedClientId(client.user_id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${
                  selectedClientId === client.user_id ? 'bg-primary/20 border border-primary/20 shadow-lg shadow-primary/10' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-royal-blue/30 flex items-center justify-center text-primary font-bold border border-white/5 group-hover:scale-110 transition-transform">
                  {client.profiles?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="font-bold text-sm truncate">{client.profiles?.full_name || 'Ukendt Klient'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Aktiv Klient</p>
                </div>
                {unreadCounts[client.user_id as string] > 0 && (
                   <span className="h-5 w-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                     {unreadCounts[client.user_id as string]}
                   </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <main className={`flex-1 flex flex-col glass-dark rounded-3xl border border-white/5 overflow-hidden ${!selectedClientId && 'hidden md:flex'}`}>
        {selectedClientId ? (
          <>
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedClientId(null)}
                  className="md:hidden p-2 rounded-xl bg-white/5 text-muted-foreground mr-1"
                >
                  <Search className="h-4 w-4" />
                </button>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                   {selectedClient?.profiles?.full_name?.charAt(0) || 'K'}
                </div>
                <div>
                  <h3 className="font-bold">{selectedClient?.profiles?.full_name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Online nu</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {loadingMessages ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center p-12 space-y-4">
                  <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Start samtalen med {selectedClient?.profiles?.full_name}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  const showTime = idx === 0 || (new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000);
                  
                  return (
                    <div key={msg.id} className="space-y-1">
                      {showTime && (
                        <p className="text-center text-[10px] text-muted-foreground py-2 font-black tracking-widest opacity-50">
                          {new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm relative group ${
                          isMe 
                            ? 'bg-primary/20 border border-primary/20 text-foreground' 
                            : 'bg-white/5 border border-white/5 text-foreground'
                        }`}>
                          {msg.content}
                          {isMe && msg.is_read && (
                            <CheckCircle2 className="h-3 w-3 text-primary absolute -bottom-4 right-0 opacity-50" />
                          )}
                        </motion.div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-white/[0.02]">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv din besked her..."
                  className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="royal-blue-gradient rounded-2xl px-8 flex items-center justify-center text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                >
                  {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
             <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center border border-primary/20">
               <MessageSquare className="h-12 w-12 text-primary" />
             </div>
             <div className="max-w-xs">
               <h3 className="text-xl font-black royal-blue-text mb-2">Vælg en samtale</h3>
               <p className="text-muted-foreground text-sm">Vælg en klient fra listen til venstre for at se deres beskedhistorik og svare på deres spørgsmål.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
