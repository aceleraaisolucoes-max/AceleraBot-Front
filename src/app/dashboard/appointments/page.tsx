'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Phone, Wrench, XCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AppointmentsPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const supabase = createClient();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // 1. Carregar ID do cliente
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) return;
      supabase.from('clients').select('id').eq('user_id', user.id).single()
        .then(({ data }: any) => {
          setClientId(data?.id ?? null);
        });
    });
  }, [supabase]);

  // 2. Buscar agendamentos
  const fetchAppointments = useCallback(async (cid: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/appointments?clientId=${cid}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (clientId) {
      fetchAppointments(clientId);
    }
  }, [clientId, fetchAppointments]);

  // 3. Cancelar agendamento
  async function handleCancel(appointmentId: string) {
    if (!clientId) return;
    const confirmCancel = confirm('Tem certeza que deseja cancelar este agendamento? Ele será excluído do Google Calendar.');
    if (!confirmCancel) return;

    try {
      setCancellingId(appointmentId);
      const res = await fetch(`${backendUrl}/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (res.ok) {
        // Atualiza o estado localmente para refletir o cancelamento
        setAppointments(prev =>
          prev.map(appt =>
            appt.id === appointmentId ? { ...appt, status: 'cancelled' } : appt
          )
        );
      } else {
        alert('Não foi possível cancelar o agendamento. Tente novamente.');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Erro ao tentar cancelar.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading && !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-7 h-7 text-cyan-400" />
          Agenda de Compromissos
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {appointments.filter(a => a.status === 'scheduled').length} agendamentos ativos sincronizados no Google Calendar
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Nenhum compromisso agendado ainda</p>
          <p className="text-slate-500 text-sm mt-1">
            Seu AceleraAssistente irá mostrar novos agendamentos aqui assim que forem confirmados via WhatsApp.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {appointments.map((appt) => {
            const isScheduled = appt.status === 'scheduled';
            const dateObj = new Date(appt.start_time);
            const dateStr = dateObj.toLocaleDateString('pt-BR');
            const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={appt.id}
                className={`bg-[#111827] border rounded-2xl p-5 transition-all relative ${
                  isScheduled ? 'border-cyan-500/20 hover:border-cyan-500/40' : 'border-red-500/20 opacity-60'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isScheduled
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {isScheduled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isScheduled ? 'Confirmado' : 'Cancelado'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold bg-white/5 px-2.5 py-1 rounded-lg">
                    {dateStr} às {timeStr}
                  </span>
                </div>

                {/* Cliente */}
                <div className="space-y-2.5 mb-6">
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight">
                      {appt.lead_name ?? 'Cliente'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>+{appt.lead_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Wrench className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>{appt.service_name ?? 'Geral'}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2.5">
                  <a
                    href={`https://wa.me/${appt.lead_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                  >
                    💬 WhatsApp
                  </a>
                  {isScheduled && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancellingId === appt.id}
                      className="px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
                      title="Cancelar Compromisso"
                    >
                      {cancellingId === appt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Desmarcar'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
