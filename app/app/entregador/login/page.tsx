'use client';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function LoginEntregador() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar() {
    if (!cpf || !senha) return alert("Por favor, preencha o CPF e a Senha.");
    
    setCarregando(true);
    
    // 1. Procura o entregador no banco de dados
    const { data, error } = await supabase
      .from('entregadores')
      .select('*')
      .eq('cpf', cpf)
      .eq('senha', senha)
      .single();

    if (error || !data) {
      alert("Acesso Negado: CPF ou Senha incorretos.");
      setCarregando(false);
    } else {
      // 2. ATIVA O STATUS ONLINE NO BANCO DE DADOS IMEDIATAMENTE
      await supabase
        .from('entregadores')
        .update({ online: true })
        .eq('id', data.id);

      // 3. Guarda os dados na memória do telemóvel
      localStorage.setItem('entregador_id', data.id);
      localStorage.setItem('entregador_nome', data.nome);
      
      // 4. Encaminha para o painel de entregas
      router.push('/entregador');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">
            GasSOS<span className="text-yellow-500">BH</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">
            Acesso do Colaborador
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block italic">Teu CPF</label>
            <input 
              type="text" 
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full p-5 bg-slate-800 rounded-2xl border border-white/5 text-white outline-none focus:border-yellow-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block italic">Tua Senha</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-5 bg-slate-800 rounded-2xl border border-white/5 text-white outline-none focus:border-yellow-500 transition-all font-black"
            />
          </div>

          <button 
            onClick={entrar}
            disabled={carregando}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-6 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg"
          >
            {carregando ? 'A AUTENTICAR...' : 'ENTRAR EM SERVIÇO'}
          </button>
        </div>

        <p className="text-center text-slate-600 text-[9px] font-bold mt-8 uppercase tracking-widest opacity-50">
          GasSOS BH - Unidade Móvel v2.5
        </p>
      </div>
    </div>
  );
}