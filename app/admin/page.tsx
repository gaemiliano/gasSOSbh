'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function SuperAdmin() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [aba, setAba] = useState<'pedidos' | 'precos' | 'motoqueiros'>('pedidos');
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [motoqueiros, setMotoqueiros] = useState<any[]>([]);
  
  const [formM, setFormM] = useState({ nome: '', cpf: '', telefone: '', placa: '', modelo: '', senha: '' });

  const SENHA_MESTRE = "2445"; 

  const verificarAcesso = () => {
    if (senhaInput === SENHA_MESTRE) setAutorizado(true);
    else alert("Senha Incorreta!");
  };

  async function fetchDados() {
    if (!autorizado) return;
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: pr } = await supabase.from('produtos').select('*').order('id', { ascending: true });
    const { data: mt } = await supabase.from('entregadores').select('*').order('nome', { ascending: true });
    if (p) setPedidos(p);
    if (pr) setProdutos(pr);
    if (mt) setMotoqueiros(mt);
  }

  useEffect(() => {
    if (autorizado) {
      fetchDados();
      const interval = setInterval(fetchDados, 5000); // Atualiza a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [autorizado, aba]);

  async function cadastrarMotoqueiro() {
    if (!formM.nome || !formM.cpf || !formM.senha) return alert("Preencha os dados básicos!");
    const { error } = await supabase.from('entregadores').insert([{
      nome: formM.nome, cpf: formM.cpf, telefone: formM.telefone,
      moto_placa: formM.placa, moto_modelo: formM.modelo,
      senha: formM.senha, online: false
    }]);
    if (!error) {
      alert("Motoqueiro Habilitado!");
      setFormM({ nome: '', cpf: '', telefone: '', placa: '', modelo: '', senha: '' });
      fetchDados();
    }
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 w-full max-w-sm text-center shadow-2xl">
          <h1 className="text-3xl font-black italic text-yellow-500 mb-2">GasSOS PRO</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Painel Administrativo</p>
          <input type="password" placeholder="Senha Mestre" className="w-full p-5 bg-slate-800 rounded-2xl border border-white/5 text-white text-center text-2xl mb-4 outline-none focus:border-yellow-500 transition-all" onChange={(e) => setSenhaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificarAcesso()} />
          <button onClick={verificarAcesso} className="w-full bg-yellow-500 text-slate-950 p-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all">Aceder Sistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-72 bg-slate-950 text-white p-8 hidden lg:flex flex-col shadow-2xl">
        <h1 className="text-3xl font-black italic text-yellow-500 mb-10 text-center uppercase tracking-tighter">GasSOS<span className="text-white">BH</span></h1>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setAba('pedidos')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'pedidos' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>📦 Chamados Ativos</button>
          <button onClick={() => setAba('precos')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'precos' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>⛽ Alterar Preços</button>
          <button onClick={() => setAba('motoqueiros')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'motoqueiros' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>🛵 Equipa / Status</button>
          
          <div className="pt-10 border-t border-white/10 mt-6 space-y-2">
            <button onClick={() => window.open('/entregador', '_blank')} className="w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] bg-white/5 text-white hover:bg-white/10 italic">📲 Ver App Entregador</button>
            <button onClick={() => { setAutorizado(false); window.location.reload(); }} className="w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] text-red-500 hover:bg-red-500/10">🔒 Sair</button>
          </div>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        
        {/* ABA: PEDIDOS */}
        {aba === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase mb-8">Pedidos Ativos</h2>
            {pedidos.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${p.status_pagamento === 'pagamento_informado' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {p.status_pagamento === 'pagamento_informado' ? '⚠️ CONFIRMAR PIX' : p.status_pagamento.toUpperCase()}
                  </span>
                  <p className="text-2xl font-black mt-2 text-slate-900">{p.combustivel} - R$ {p.valor_total},00</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Cliente: {p.nome_cliente} | Placa: {p.placa_veiculo}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await supabase.from('pedidos').update({ status_pagamento: 'pago' }).eq('id', p.id); fetchDados(); }} className="bg-green-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Confirmar PIX</button>
                  <button onClick={async () => { if(confirm("Apagar pedido?")) { await supabase.from('pedidos').delete().eq('id', p.id); fetchDados(); } }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA: ALTERAR PREÇOS */}
        {aba === 'precos' && (
          <div className="max-w-xl">
            <h2 className="text-4xl font-black italic uppercase mb-8">Tabela de Preços</h2>
            <div className="space-y-4">
              {produtos.map(prod => (
                <div key={prod.id} className="bg-white p-8 rounded-[35px] shadow-sm border flex justify-between items-center group transition-all hover:border-yellow-500">
                  <span className="font-black uppercase text-slate-400 text-xs">{prod.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 text-xl">R$</span>
                    <input 
                      type="number" 
                      defaultValue={prod.preco} 
                      onBlur={async (e) => { await supabase.from('produtos').update({ preco: e.target.value }).eq('id', prod.id); fetchDados(); }}
                      className="text-4xl font-black w-32 outline-none text-right bg-transparent group-hover:text-yellow-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: MOTOQUEIROS COM STATUS ONLINE */}
        {aba === 'motoqueiros' && (
          <div className="max-w-4xl">
            <h2 className="text-4xl font-black italic uppercase mb-8 text-slate-950">Gerir Equipa</h2>
            
            {/* Formulário de Cadastro */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border mb-10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Nome" value={formM.nome} onChange={e => setFormM({...formM, nome: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border outline-none font-bold" />
                <input placeholder="CPF (Login)" value={formM.cpf} onChange={e => setFormM({...formM, cpf: e.target.value})} className="p-4 bg-slate-50 rounded-2xl border outline-none font-bold" />
                <input type="password" placeholder="Senha de Acesso" value={formM.senha} onChange={e => setFormM({...formM, senha: e.target.value})} className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border outline-none font-black" />
              </div>
              <button onClick={cadastrarMotoqueiro} className="w-full bg-slate-950 text-yellow-500 p-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.01] transition-all">✅ Habilitar Entregador</button>
            </div>
            
            {/* LISTAGEM COM BOLINHA VERDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {motoqueiros.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    {/* INDICADOR ONLINE */}
                    <div className="relative flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${m.online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      {m.online && <div className="absolute w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                    </div>
                    
                    <div>
                      <p className="font-black uppercase text-sm flex items-center gap-2">
                        {m.nome}
                        {m.online && <span className="text-[7px] bg-green-500 text-white px-1 rounded-sm">ON</span>}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Login: {m.cpf}</p>
                    </div>
                  </div>
                  <button onClick={async () => { if(confirm("Apagar acesso?")) { await supabase.from('entregadores').delete().eq('id', m.id); fetchDados(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}