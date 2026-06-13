import { createClient } from '@/lib/supabase/server';
import { Calendar } from 'lucide-react';

async function getStats(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/appointments/stats?clientId=${clientId}`, {
    next: { revalidate: 60 }, // Cache por 60 segundos
  });
  if (!res.ok) return { totalConversations: 0, totalAppointments: 0, todayAppointments: 0, conversionRate: 0 };
  return res.json();
}

async function getRecentAppointments(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/appointments?clientId=${clientId}&limit=5`, {
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

  const [stats, recentAppointments] = await Promise.all([
    client ? getStats(client.id) : { totalConversations: 0, totalAppointments: 0, todayAppointments: 0, conversionRate: 0 },
    client ? getRecentAppointments(client.id) : [],
  ]);

  const statCards = [
    { label: 'Total de Conversas', value: stats.totalConversations, color: 'text-cyan-400', bg: 'from-cyan-500/10 to-transparent' },
    { label: 'Agendamentos Confirmados', value: stats.totalAppointments, color: 'text-purple-400', bg: 'from-purple-500/10 to-transparent' },
    { label: 'Agendamentos Hoje', value: stats.todayAppointments, color: 'text-green-400', bg: 'from-green-500/10 to-transparent' },
    { label: 'Taxa de Conversão', value: `${stats.conversionRate}%`, color: 'text-orange-400', bg: 'from-orange-500/10 to-transparent' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, <span className="text-cyan-400">{client?.business_name ?? 'bem-vindo!'}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Aqui está o resumo dos agendamentos de seu assistente hoje.</p>
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

      {/* Recent Appointments */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Próximos Agendamentos
          </h2>
          <a href="/dashboard/appointments" className="text-cyan-400 text-sm hover:underline">Ver todos →</a>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">Nenhum agendamento ainda.</p>
            <p className="text-sm mt-1">Quando a IA marcar um horário no Google Calendar, ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAppointments.map((appt: any) => (
              <div key={appt.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div>
                  <p className="font-semibold text-white text-sm">{appt.lead_name ?? 'Cliente'}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{appt.service_name ?? 'Geral'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-cyan-400 font-semibold">
                    {new Date(appt.start_time).toLocaleDateString('pt-BR')} às {new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <a
                    href={`https://wa.me/${appt.lead_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:underline inline-block mt-1"
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
