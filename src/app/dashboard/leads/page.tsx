import { createClient } from '@/lib/supabase/server';
import { Users, Phone, Wrench, Clock } from 'lucide-react';

async function getLeads(clientId: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${backendUrl}/leads?clientId=${clientId}&limit=50`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user!.id)
    .single();

  const leads = client ? await getLeads(client.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🔥 Leads Qualificados</h1>
        <p className="text-slate-400 text-sm mt-1">{leads.length} leads prontos para contato</p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Nenhum lead qualificado ainda</p>
          <p className="text-slate-500 text-sm mt-1">
            Leads aparecem aqui quando a IA identifica um cliente pronto para fechar negócio.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leads.map((lead: any) => (
            <div key={lead.id}
              className="bg-[#111827] border border-orange-500/20 rounded-2xl p-5 hover:border-orange-500/40 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Dados */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <p className="text-white font-semibold text-sm">{lead.lead_name ?? 'Cliente'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <p className="text-slate-400 text-sm">+{lead.lead_phone}</p>
                </div>
                {lead.service_interest && (
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <p className="text-slate-400 text-sm">{lead.service_interest}</p>
                  </div>
                )}
                {lead.urgency && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <p className="text-slate-400 text-sm">{lead.urgency}</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <a
                href={`https://wa.me/${lead.lead_phone}?text=Ol%C3%A1!%20Aqui%20%C3%A9%20da%20equipe!%20Posso%20te%20ajudar%3F`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                💬 Assumir Atendimento
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
