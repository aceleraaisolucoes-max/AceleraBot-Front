'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Wrench, Pencil, X, Check } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
};

type Draft = { name: string; duration: string; price: string };

const EMPTY_DRAFT: Draft = { name: '', duration: '60', price: '' };

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return '—';
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// Valida o rascunho do formulário; devolve null quando está tudo certo.
function validate({ name, duration, price }: Draft): string | null {
  if (name.trim().length < 2) return 'Informe um nome com pelo menos 2 caracteres.';
  const d = Number(duration);
  if (!Number.isInteger(d) || d < 5 || d > 1440) return 'A duração deve ser um número inteiro entre 5 e 1440 minutos.';
  if (price.trim() !== '') {
    const p = Number(price.replace(',', '.'));
    if (Number.isNaN(p) || p < 0) return 'O preço deve ser um número maior ou igual a zero.';
  }
  return null;
}

function toPayload({ name, duration, price }: Draft) {
  return {
    name: name.trim(),
    duration_minutes: Number(duration),
    price: price.trim() === '' ? null : Number(price.replace(',', '.')),
  };
}

const inputClass =
  'bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/60';

export default function ServicesPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return;
      supabase.from('clients').select('id').eq('user_id', user.id).single()
        .then(({ data }: { data: { id: string } | null }) => setClientId(data?.id ?? null));
    });
  }, [supabase]);

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    fetch(`${backendUrl}/services?clientId=${clientId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        setServices(data?.data ?? []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch services:', err);
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [clientId, backendUrl]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const error = validate(draft);
    if (error) return setFormError(error);
    setFormError(null);

    try {
      setCreating(true);
      const res = await fetch(`${backendUrl}/services?clientId=${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(draft)),
      });
      if (res.ok) {
        const created = await res.json();
        setServices(prev => [...prev, created]);
        setDraft(EMPTY_DRAFT);
      } else {
        const data = await res.json().catch(() => null);
        setFormError(data?.error ?? 'Não foi possível cadastrar o serviço.');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      setFormError('Erro ao cadastrar o serviço.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditDraft({
      name: s.name,
      duration: String(s.duration_minutes),
      price: s.price === null ? '' : String(s.price),
    });
    setFormError(null);
  }

  async function handleSaveEdit(id: string) {
    const error = validate(editDraft);
    if (error) return setFormError(error);
    setFormError(null);

    try {
      setBusyId(id);
      const res = await fetch(`${backendUrl}/services/${id}?clientId=${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(editDraft)),
      });
      if (res.ok) {
        const updated = await res.json();
        setServices(prev => prev.map(s => (s.id === id ? updated : s)));
        setEditingId(null);
      } else {
        const data = await res.json().catch(() => null);
        setFormError(data?.error ?? 'Não foi possível salvar as alterações.');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      setFormError('Erro ao salvar as alterações.');
    } finally {
      setBusyId(null);
    }
  }

  // Inativar/reativar é o mesmo PATCH — não há exclusão física para preservar
  // os agendamentos que já referenciam o serviço.
  async function handleToggleActive(s: Service) {
    if (s.is_active && !confirm(`Inativar "${s.name}"? Ele deixará de ser oferecido pelo assistente.`)) return;
    try {
      setBusyId(s.id);
      const res = await fetch(`${backendUrl}/services/${s.id}?clientId=${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setServices(prev => prev.map(x => (x.id === s.id ? updated : x)));
      } else {
        alert('Não foi possível alterar o status do serviço.');
      }
    } catch (err) {
      console.error('Error toggling service:', err);
      alert('Erro ao alterar o status do serviço.');
    } finally {
      setBusyId(null);
    }
  }

  if (!clientId || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const activeCount = services.filter(s => s.is_active).length;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Wrench className="w-6 h-6 text-cyan-400" />
          Serviços
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {activeCount} {activeCount === 1 ? 'serviço ativo' : 'serviços ativos'} — o assistente usa a duração para calcular os horários livres.
        </p>
      </div>

      {/* Cadastro */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold text-white text-sm mb-4">+ Novo serviço</h2>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-[1fr_130px_130px_auto] gap-3 items-start">
          <input
            type="text" value={draft.name} required
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nome — Ex: Troca de óleo"
            className={inputClass}
          />
          <input
            type="number" value={draft.duration} min={5} max={1440} step={5} required
            onChange={e => setDraft({ ...draft, duration: e.target.value })}
            placeholder="Minutos" aria-label="Duração em minutos"
            className={inputClass}
          />
          <input
            type="text" inputMode="decimal" value={draft.price}
            onChange={e => setDraft({ ...draft, price: e.target.value })}
            placeholder="Preço (R$)" aria-label="Preço"
            className={inputClass}
          />
          <button
            type="submit" disabled={creating}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Adicionar
          </button>
        </form>
        {formError && <p className="text-xs text-red-400 mt-3">{formError}</p>}
      </div>

      {/* Lista */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold text-white text-sm mb-4">Serviços cadastrados</h2>

        {services.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">
            Nenhum serviço cadastrado ainda. Adicione o primeiro acima!
          </p>
        ) : (
          <div className="space-y-3">
            {services.map(s => {
              const busy = busyId === s.id;
              const editing = editingId === s.id;

              if (editing) {
                return (
                  <div key={s.id} className="grid sm:grid-cols-[1fr_130px_130px_auto] gap-3 items-center p-4 bg-white/5 rounded-xl border border-cyan-500/30">
                    <input
                      type="text" value={editDraft.name} aria-label="Nome do serviço"
                      onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="number" value={editDraft.duration} min={5} max={1440} step={5} aria-label="Duração em minutos"
                      onChange={e => setEditDraft({ ...editDraft, duration: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="text" inputMode="decimal" value={editDraft.price} aria-label="Preço"
                      onChange={e => setEditDraft({ ...editDraft, price: e.target.value })}
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(s.id)} disabled={busy} title="Salvar"
                        className="p-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl transition-all"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setFormError(null); }} title="Cancelar"
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    s.is_active ? 'bg-white/5 border-white/5' : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{s.name}</p>
                      {!s.is_active && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-slate-400 bg-white/5 border-white/10">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      {formatDuration(s.duration_minutes)} · {formatPrice(s.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(s)} title="Editar"
                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(s)} disabled={busy}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all min-w-24 ${
                        s.is_active
                          ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                          : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400'
                      }`}
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : s.is_active ? 'Inativar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
