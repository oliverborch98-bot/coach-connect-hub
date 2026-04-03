import { useState, useRef, useEffect } from 'react';
import { Send, TrendingUp, Moon, Zap, CheckCircle, Sparkles, Loader2, X, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  clientId: string;
}

export default function ClientCheckinsTab({ clientId }: Props) {
  const queryClient = useQueryClient();
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [expandedCheckin, setExpandedCheckin] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const { data: checkins = [], isLoading, error } = useQuery({
    queryKey: ['client-checkins', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['submitted', 'reviewed'])
        .order('checkin_number', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Henter check-ins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive font-medium">Der opstod en fejl ved hentning af data.</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['client-checkins', clientId] })}
          className="mt-3 text-xs underline hover:text-destructive/80"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  const reviewMutation = useMutation({
    mutationFn: async ({ checkinId, feedback }: { checkinId: string; feedback: string }) => {
      const { error } = await supabase
        .from('weekly_checkins')
        .update({
          coach_feedback: feedback,
          status: 'reviewed' as const,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', checkinId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checkins', clientId] });
      toast.success('Feedback sendt!');
      setExpandedCheckin(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const analyzeCheckin = async (checkinId: string) => {
    setAiLoading(checkinId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId, checkinId }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Fejl' }));
        throw new Error(err.error || 'AI fejl');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setAiAnalysis(prev => ({ ...prev, [checkinId]: result }));
            }
          } catch { break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setAiLoading(null);
  };

  const chartData = [...checkins]
    .reverse()
    .map(ci => ({
      label: `#${ci.checkin_number}`,
      weight: ci.weight ? Number(ci.weight) : null,
      energy: ci.energy_level,
      sleep: ci.sleep_quality,
      compliance: ci.workouts_target
        ? Math.round(((ci.workouts_completed ?? 0) / ci.workouts_target) * 100)
        : null,
    }));

  const renderChart = (
    title: string,
    icon: React.ReactNode,
    dataKey: string,
    color: string,
    unit: string,
  ) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-xs font-semibold">{title}</h4>
      </div>
      {chartData.length < 2 ? (
        <p className="text-xs text-muted-foreground">Ikke nok data endnu</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={40} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: any) => [`${value} ${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderChart('Vægt', <TrendingUp className="h-3.5 w-3.5 text-primary" />, 'weight', 'hsl(var(--primary))', 'kg')}
        {renderChart('Energi', <Zap className="h-3.5 w-3.5 text-amber-400" />, 'energy', '#fbbf24', '/10')}
        {renderChart('Søvn', <Moon className="h-3.5 w-3.5 text-blue-400" />, 'sleep', '#60a5fa', '/10')}
        {renderChart('Compliance', <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />, 'compliance', '#34d399', '%')}
      </div>

      {/* Check-in list */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Check-in historik</h3>
        {checkins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen check-ins endnu</p>
        ) : (
          <div className="space-y-3">
            {checkins.map(ci => {
              const isExpanded = expandedCheckin === ci.id;
              const feedback = feedbackMap[ci.id] ?? ci.coach_feedback ?? '';
              return (
                <div key={ci.id} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                  <button
                    onClick={() => setExpandedCheckin(isExpanded ? null : ci.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-secondary px-2 py-1 rounded font-medium">#{ci.checkin_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {ci.submitted_at ? new Date(ci.submitted_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span>{ci.weight ?? '–'} kg</span>
                      <span>{ci.avg_calories ?? '–'} kcal</span>
                      <span>{ci.workouts_completed ?? 0}/{ci.workouts_target ?? 4}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ci.status === 'reviewed' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                        {ci.status === 'reviewed' ? 'Reviewed' : 'Afventer review'}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Vægt', value: ci.weight ? `${ci.weight} kg` : '–' },
                          { label: 'Fedt %', value: ci.body_fat_pct ? `${ci.body_fat_pct}%` : '–' },
                          { label: 'Gns. kcal', value: ci.avg_calories ?? '–' },
                          { label: 'Træning', value: `${ci.workouts_completed ?? 0}/${ci.workouts_target ?? 4}` },
                          { label: 'Energi', value: ci.energy_level ? `${ci.energy_level}/10` : '–' },
                          { label: 'Søvn', value: ci.sleep_quality ? `${ci.sleep_quality}/10` : '–' },
                        ].map(s => (
                          <div key={s.label} className="rounded-lg bg-secondary p-3">
                            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                            <p className="text-sm font-semibold mt-0.5">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {ci.client_notes && (
                        <div className="rounded-lg bg-secondary p-3">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1">Klientens noter</p>
                          <p className="text-sm whitespace-pre-wrap">{ci.client_notes}</p>
                        </div>
                      )}

                      {/* AI Analysis */}
                      <div className="space-y-2">
                        <button
                          onClick={() => analyzeCheckin(ci.id)}
                          disabled={aiLoading === ci.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                        >
                          {aiLoading === ci.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          {aiLoading === ci.id ? 'Analyserer...' : 'AI Analyse'}
                        </button>
                        {aiAnalysis[ci.id] && (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 relative">
                            <button onClick={() => setAiAnalysis(prev => { const n = { ...prev }; delete n[ci.id]; return n; })} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <p className="text-[10px] text-primary font-semibold mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI ANALYSE</p>
                            <div className="prose prose-sm prose-invert max-w-none text-xs [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-sm [&>h2]:text-xs [&>h3]:text-xs">
                              <ReactMarkdown>{aiAnalysis[ci.id]}</ReactMarkdown>
                            </div>
                            <button
                              onClick={() => {
                                const draft = aiAnalysis[ci.id].split('**Feedback-forslag**')[1]?.trim() || aiAnalysis[ci.id];
                                setFeedbackMap(prev => ({ ...prev, [ci.id]: draft }));
                                toast.success('Feedback-kladde indsat!');
                              }}
                              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <Copy className="h-3 w-3" /> Brug som feedback-kladde
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">Coach feedback</label>
                        <textarea
                          value={feedback}
                          onChange={e => setFeedbackMap(prev => ({ ...prev, [ci.id]: e.target.value }))}
                          placeholder="Skriv din feedback til klienten..."
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={ci.status === 'reviewed' && !feedbackMap[ci.id]}
                        />
                        <div className="flex items-center gap-2">
                          {ci.status !== 'reviewed' || feedbackMap[ci.id] ? (
                            <button
                              onClick={() => reviewMutation.mutate({ checkinId: ci.id, feedback: feedbackMap[ci.id] ?? feedback })}
                              disabled={reviewMutation.isPending || !feedback.trim()}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {reviewMutation.isPending ? 'Sender...' : ci.status === 'reviewed' ? 'Opdater feedback' : 'Send feedback & markér reviewed'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
