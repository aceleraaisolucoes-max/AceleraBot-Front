import { createClient } from '@/lib/supabase/server';

async function getStats(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/leads/stats?clientId=${clientId}`, {
    next: { revalidate: 60 }, // Cache por 60 segundos
  });
  if (!res.ok) return { totalConversations: 0, totalLeads: 0, todayLeads: 0, conversionRate: 0 };
  return res.json();
}

async function getRecentLeads(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/leads?clientId=${clientId}&limit=5`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, status')
    .eq('user_id', user!.id)
    .single();

  const [stats, recentLeads] = await Promise.all([
    client ? getStats(client.id) : { totalConversations: 0, totalLeads: 0, todayLeads: 0, conversionRate: 0 },
    client ? getRecentLeads(client.id) : [],
  ]);

  const statCards = [
    { label: 'Total de Conversas', value: stats.totalConversations, color: 'text-cyan-400', bg: 'from-cyan-500/10 to-transparent' },
    { label: 'Leads Qualificados', value: stats.totalLeads, color: 'text-purple-400', bg: 'from-purple-500/10 to-transparent' },
    { label: 'Leads Hoje', value: stats.todayLeads, color: 'text-green-400', bg: 'from-green-500/10 to-transparent' },
    { label: 'Taxa de Conversão', value: `${stats.conversionRate}%`, color: 'text-orange-400', bg: 'from-orange-500/10 to-transparent' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, <span className="text-cyan-400">{client?.business_name ?? 'bem-vindo!'}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Aqui está o resumo do seu AceleraBot hoje.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label}
            className={`bg-gradient-to-br ${stat.bg} bg-[#111827] border border-white/10 rounded-2xl p-6`}>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">🔥 Leads Recentes</h2>
          <a href="/dashboard/leads" className="text-cyan-400 text-sm hover:underline">Ver todos →</a>
        </div>

        {recentLeads.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">🤖</p>
            <p className="font-medium">Nenhum lead ainda.</p>
            <p className="text-sm mt-1">Quando um cliente qualificado aparecer, ele vai aparecer aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLeads.map((lead: any) => (
              <div key={lead.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <p className="font-semibold text-white text-sm">{lead.lead_name ?? 'Cliente'}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{lead.service_interest ?? 'Interesse não identificado'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                  <a
                    href={`https://wa.me/${lead.lead_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:underline"
                  >
                    Contatar →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
