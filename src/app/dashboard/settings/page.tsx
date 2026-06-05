'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, RefreshCw, Wifi, WifiOff, QrCode } from 'lucide-react';

// ─── QR Code Viewer ───────────────────────────────────────────────────────────

function QRCodeSection({ clientId }: { clientId: string }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const checkStatus = useCallback(async () => {
    const res = await fetch(`${backendUrl}/clients/${clientId}/status`);
    const data = await res.json();
    setStatus(data.status);
    return data.status;
  }, [clientId, backendUrl]);

  const fetchQRCode = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${backendUrl}/clients/${clientId}/qrcode`);
    if (res.ok) {
      const data = await res.json();
      setQrCode(data.base64);
    }
    setLoading(false);
  }, [clientId, backendUrl]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(async () => {
      const s = await checkStatus();
      if (s === 'open') clearInterval(interval);
    }, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const isConnected = status === 'open';

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Conexão WhatsApp</h2>
      <p className="text-slate-400 text-sm mb-6">Conecte o número do seu negócio ao bot de IA.</p>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
        isConnected
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      }`}>
        {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {isConnected ? 'WhatsApp Conectado ✓' : 'Aguardando Conexão'}
      </div>

      {!isConnected && (
        <div className="space-y-4">
          <div className="text-sm text-slate-400 space-y-1">
            <p>1. Abra o WhatsApp no seu celular</p>
            <p>2. Vá em <strong className="text-white">Configurações → Aparelhos conectados</strong></p>
            <p>3. Escaneie o QR Code abaixo</p>
          </div>

          {qrCode ? (
            <div className="bg-white p-4 rounded-2xl w-fit mx-auto">
              <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl w-56 h-56 mx-auto flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-600" />
            </div>
          )}

          <button
            id="btn-generate-qr"
            onClick={fetchQRCode}
            disabled={loading}
            className="flex items-center gap-2 mx-auto bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 px-6 py-3 rounded-xl text-sm font-medium transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {qrCode ? 'Gerar novo QR Code' : 'Gerar QR Code'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Knowledge Base Editor ────────────────────────────────────────────────────

function KnowledgeEditor({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [category, setCategory] = useState('services');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('knowledge_base')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data ?? []));
  }, [clientId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase
      .from('knowledge_base')
      .insert({ client_id: clientId, category, question, answer })
      .select()
      .single();
    if (data) setEntries(prev => [data, ...prev]);
    setQuestion(''); setAnswer('');
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('knowledge_base').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const categories: Record<string, string> = {
    services: '🛠️ Serviços e Preços',
    hours: '⏰ Horários',
    faq: '❓ Perguntas Frequentes',
    about: 'ℹ️ Sobre o Negócio',
  };

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-1">Base de Conhecimento</h2>
      <p className="text-slate-400 text-sm mb-6">Ensine à IA tudo sobre o seu negócio.</p>

      <form onSubmit={handleAdd} className="space-y-4 mb-8 p-4 bg-white/5 rounded-xl border border-white/5">
        <h3 className="font-semibold text-white text-sm">+ Adicionar informação</h3>
        <select
          value={category} onChange={e => setCategory(e.target.value)}
          className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/60"
        >
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          type="text" value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Pergunta (opcional) — Ex: Qual o horário de funcionamento?"
          className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
        />
        <textarea
          value={answer} onChange={e => setAnswer(e.target.value)} required rows={3}
          placeholder="Resposta — Ex: Funcionamos de segunda a sexta, das 8h às 18h."
          className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 resize-none"
        />
        <button
          id="btn-add-knowledge"
          type="submit" disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Adicionar
        </button>
      </form>

      {/* Lista */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/5 group">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                {categories[entry.category] ?? entry.category}
              </span>
              {entry.question && <p className="text-sm text-slate-300 font-medium mt-2">{entry.question}</p>}
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{entry.answer}</p>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs self-start mt-1"
            >✕</button>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">
            Nenhuma informação cadastrada. Adicione os dados do seu negócio acima!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('clients').select('id').eq('user_id', user.id).single()
        .then(({ data }) => setClientId(data?.id ?? null));
    });
  }, []);

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie sua conexão com o WhatsApp e dados da conta.</p>
      </div>
      <QRCodeSection clientId={clientId} />
    </div>
  );
}
