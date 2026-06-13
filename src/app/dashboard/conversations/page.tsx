import { createClient } from '@/lib/supabase/server';
import { MessageCircle, User, Clock } from 'lucide-react';

// Dados ao vivo do backend: renderiza a cada request (não no build).
export const dynamic = 'force-dynamic';

async function getConversations(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/conversations?clientId=${clientId}&limit=50`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  qualified: { label: '🔥 Lead Quente', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  human_takeover: { label: 'Humano', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  closed: { label: 'Fechada', color: 'text-slate-400 bg-white/5 border-white/10' },
};

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user!.id)
    .single();

  const conversations = client ? await getConversations(client.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Conversas</h1>
        <p className="text-slate-400 text-sm mt-1">{conversations.length} conversas encontradas</p>
      </div>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Nenhuma conversa ainda</p>
            <p className="text-slate-500 text-sm mt-1">Quando alguém enviar uma mensagem no WhatsApp, aparecerá aqui.</p>
          </div>
        ) : (
          conversations.map((conv: any) => {
            const statusInfo = statusLabels[conv.status] ?? statusLabels.active;
            return (
              <div key={conv.id}
                className="bg-[#111827] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{conv.lead_name ?? 'Cliente'}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.last_message_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {conv.lead_score > 0 && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className={`text-sm font-bold ${conv.lead_score >= 80 ? 'text-orange-400' : conv.lead_score >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {conv.lead_score}/100
                      </p>
                    </div>
                  )}
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <a
                    href={`https://wa.me/${conv.lead_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:underline hidden md:block"
                  >
                    Abrir →
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
