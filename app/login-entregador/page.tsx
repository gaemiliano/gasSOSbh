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
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) return alert("CPF Inválido! Use 11 dígitos.");
    if (!senha) return alert("Digite a senha.");
    
    setCarregando(true);
    
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .eq('cpf', cpfLimpo)
        .eq('senha', senha)
        .eq('ativo', true)
        .single();

      if (error || !data) throw new Error("Acesso negado: Credenciais inválidas.");

      // Atualiza status no banco
      await supabase.from('entregadores').update({ online: true }).eq('id', data.id);

      // Salva sessão local
      localStorage.setItem('entregador_id', data.id);
      localStorage.setItem('entregador_nome', data.nome);
      
      // REDIRECIONAMENTO CORRIGIDO
      // Isso procura o arquivo app/entregador/page.tsx
      router.push('/entregador'); 

    } catch (err) {
      alert(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic text-white tracking-tighter uppercase">
            GAS<span className="text-yellow-500">SOS</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-2 italic">Painel do Colaborador</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-5">
          <input 
            type="text" 
            placeholder="TEU CPF (SÓ NÚMEROS)" 
            value={cpf}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
            className="w-full p-5 bg-slate-800 rounded-2xl border border-white/5 text-white outline-none focus:border-yellow-500 font-bold"
          />
          <input 
            type="password" 
            placeholder="TUA SENHA" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-5 bg-slate-800 rounded-2xl border border-white/5 text-white outline-none focus:border-yellow-500 font-black"
          />
          <button 
            onClick={entrar} 
            disabled={carregando}
            className="w-full bg-yellow-500 text-slate-950 p-6 rounded-3xl font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
          >
            {carregando ? 'ENTRANDO...' : 'ENTRAR EM SERVIÇO ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}