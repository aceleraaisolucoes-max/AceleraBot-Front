'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bot, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName, whatsapp_number: whatsappNumber },
      },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    // 2. Criar cliente no backend (que cria instância na Evolution API)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: authData.user.id,
          business_name: businessName,
          whatsapp_number: whatsappNumber.replace(/\D/g, ''),
          plan: 'motor',
        }),
      });
    } catch {
      // Continua mesmo se falhar — pode ser configurado depois
    }

    router.push('/dashboard/settings?onboarding=true');
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar sua conta</h1>
          <p className="text-slate-400 text-sm mt-1">
            {step === 1 ? 'Dados de acesso' : 'Dados do seu negócio'}
          </p>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-cyan-400' : 'bg-white/20'}`} />
            <div className={`w-8 h-px ${step >= 2 ? 'bg-cyan-400' : 'bg-white/20'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-cyan-400' : 'bg-white/20'}`} />
          </div>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-5">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    id="email"
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                  <input
                    id="password"
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold transition-all">
                  Continuar →
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome do seu negócio</label>
                  <input
                    id="business-name"
                    type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required
                    placeholder="Ex: Oficina do João, Salão da Maria..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Número do WhatsApp (com DDD)</label>
                  <input
                    id="whatsapp"
                    type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} required
                    placeholder="(11) 99999-9999"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Este número será conectado ao bot de IA</p>
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-all">
                    ← Voltar
                  </button>
                  <button
                    id="btn-register"
                    type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Criando...' : 'Criar Conta'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Já tem conta?{' '}
            <a href="/login" className="text-cyan-400 hover:underline font-medium">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
