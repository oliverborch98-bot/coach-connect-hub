import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function ClientMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get coach id from client_profile
  const { data: clientProfile } = useQuery({
    queryKey: ['my-client-profile-msg', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('coach_id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const coachId = clientProfile?.coach_id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', user?.id, coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!coachId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || !coachId) return;
    const channel: RealtimeChannel = supabase
      .channel('client-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_id === user.id && msg.receiver_id === coachId) || (msg.sender_id === coachId && msg.receiver_id === user.id)) {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, coachId, queryClient]);

  // Mark unread messages as read
  useEffect(() => {
    if (!user || !messages.length) return;
    const unread = messages.filter(m => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unread.map(m => m.id))
        .then();
    }
  }, [messages, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: coachId!,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !coachId) return;
    sendMutation.mutate(newMessage.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Beskeder</h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">
            Ingen beskeder endnu. Skriv til din coach!
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-primary/20 text-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString('da-DK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Skriv en besked..."
          className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMutation.isPending}
          className="lime-gradient rounded-xl p-2.5 text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
