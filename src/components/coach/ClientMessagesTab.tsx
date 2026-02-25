import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send } from 'lucide-react';

export default function ClientMessagesTab({ clientId }: { clientId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  // Get the client's user_id from client_profiles
  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile-for-messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('user_id')
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

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Ingen beskeder endnu</p>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user!.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p>{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && message.trim() && sendMessage.mutate()}
          placeholder="Skriv en besked..."
          className="flex-1 rounded-lg bg-secondary border-0 px-3 py-2 text-sm"
        />
        <button
          onClick={() => sendMessage.mutate()}
          disabled={!message.trim() || sendMessage.isPending}
          className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
