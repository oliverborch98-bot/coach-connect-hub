import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientMessagesTab({ clientId }: { clientId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get the client's user_id from client_profiles
  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile-for-messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('user_id, profiles:profiles!user_id(full_name)')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const clientUserId = clientProfile?.user_id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['coach-client-messages', clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${clientUserId}),and(sender_id.eq.${clientUserId},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientUserId,
  });

  // Mark as read
  useEffect(() => {
    if (!user || !clientUserId || messages.length === 0) return;
    const unread = messages.filter(m => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unread.map(m => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
        });
    }
  }, [messages, user, clientUserId, queryClient]);

  useEffect(() => {
    if (!user || !clientUserId) return;
    const channel = supabase
      .channel(`coach-messages-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_id === user.id && msg.receiver_id === clientUserId) || (msg.sender_id === clientUserId && msg.receiver_id === user.id)) {
          queryClient.invalidateQueries({ queryKey: ['coach-client-messages', clientUserId] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, clientUserId, clientId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: clientUserId!,
        content: message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-client-messages', clientUserId] });
      setMessage('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>;

  return (
    <div className="glass-dark rounded-3xl border border-white/5 flex flex-col h-[500px] overflow-hidden shadow-2xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center">
               <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Ingen beskeder endnu</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender_id === user!.id;
            const showTime = idx === 0 || (new Date(m.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000);
            
            return (
              <div key={m.id} className="space-y-1">
                {showTime && (
                  <p className="text-center text-[10px] text-muted-foreground/40 py-2 font-black tracking-widest uppercase">
                    {new Date(m.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm relative group ${
                      isMe 
                        ? 'bg-primary/20 border border-primary/20 text-foreground' 
                        : 'bg-white/5 border border-white/5 text-foreground'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    {isMe && m.is_read && (
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

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex gap-3">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && message.trim() && sendMessage.mutate()}
            placeholder="Skriv din besked her..."
            className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
          />
          <button
            onClick={() => sendMessage.mutate()}
            disabled={!message.trim() || sendMessage.isPending}
            className="royal-blue-gradient rounded-2xl px-6 flex items-center justify-center text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
          >
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
