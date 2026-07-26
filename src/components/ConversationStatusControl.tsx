'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  qualified: { label: '🔥 Lead Quente', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  human_takeover: { label: 'Humano', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  closed: { label: 'Fechada', color: 'text-slate-400 bg-white/5 border-white/10' },
};

/**
 * Badge de status + interruptor "Pausar Assistente" (Card 15 — Handoff Humano).
 *
 * Ilha client dentro da página de conversas (server component): depois do PATCH
 * o estado local passa a ser a fonte da verdade, então não é preciso re-fetch.
 */
export default function ConversationStatusControl({
  conversationId,
  status: initialStatus,
}: {
  conversationId: string;
  status: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const paused = status === 'human_takeover';
  const statusInfo = statusLabels[status] ?? statusLabels.active;

  async function handleToggle() {
    // Pausado → devolve para a IA; ativo → o operador assume.
    const action = paused ? 'resume' : 'takeover';

    try {
      setSaving(true);
      const res = await fetch(`${backendUrl}/conversations/${conversationId}/${action}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setStatus(paused ? 'active' : 'human_takeover');
      } else {
        alert('Não foi possível alterar o modo de atendimento. Tente novamente.');
      }
    } catch (err) {
      console.error('Error toggling human takeover:', err);
      alert('Erro ao alterar o modo de atendimento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status !== 'closed' && (
        <button
          type="button"
          role="switch"
          aria-checked={paused}
          aria-label="Pausar Assistente (Modo Humano)"
          title={
            paused
              ? 'A IA está pausada. Clique para devolver o atendimento ao assistente.'
              : 'Clique para pausar a IA e atender manualmente pelo WhatsApp.'
          }
          onClick={handleToggle}
          disabled={saving}
          className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 border ${
              paused
                ? 'bg-purple-500 border-purple-400/40'
                : 'bg-white/10 border-white/10 group-hover:bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                paused ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
          <span
            className={`text-xs font-medium hidden lg:block ${
              paused ? 'text-purple-400' : 'text-slate-500'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : paused ? (
              'Modo Humano'
            ) : (
              'IA ativa'
            )}
          </span>
        </button>
      )}

      <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    </div>
  );
}
