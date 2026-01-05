'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

// --- FUNÇÃO DE VALIDAÇÃO DE CPF ---
function validarCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

export default function AdminMaster() {
  const [aba, setAba] = useState<'pedidos' | 'estoque' | 'vendas' | 'motoqueiros'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [motoqueiros, setMotoqueiros] = useState<any[]>([]);
  const [vendasHoje, setVendasHoje] = useState(0);
  const [formM, setFormM] = useState({ nome: '', cpf: '', senha: '', telefone: '' });

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 5000);
    return () => clearInterval(interval);
  }, [aba]);

  async function fetchDados() {
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: e } = await supabase.from('estoque').select('*').order('item');
    const { data: m } = await supabase.from('entregadores').select('*').order('nome');
    
    if (p) {
      setPedidos(p);
      const hoje = new Date().toISOString().split('T')[0];
      const total = p.filter(ped => ped.created_at.includes(hoje) && ped.status_pagamento === 'pago')
                     .reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
      setVendasHoje(total);
    }
    if (e) setEstoque(e);
    if (m) setMotoqueiros(m);
  }

  // AÇÕES GESTÃO
  async function cadastrarMotoqueiro() {
    if (!validarCPF(formM.cpf)) return alert("CPF Inválido!");
    const { error } = await supabase.from('entregadores').insert([{ ...formM, ativo: true }]);
    if (!error) { alert("Cadastrado!"); setFormM({ nome: '', cpf: '', senha: '', telefone: '' }); fetchDados(); }
  }

  async function alternarAtivo(id: number, status: boolean) {
    await supabase.from('entregadores').update({ ativo: !status }).eq('id', id);
    fetchDados();
  }

  async function atualizarEstoque(id: number, qtd: number) {
    await supabase.from('estoque').update({ quantidade: qtd }).eq('id', id);
    fetchDados();
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-slate-950 p-8 text-white flex flex-col">
        <h1 className="text-2xl font-black italic text-yellow-500 mb-10 uppercase tracking-tighter text-center">GasSOS Admin</h1>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setAba('pedidos')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'pedidos' ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}>📦 Chamados</button>
          <button onClick={() => setAba('estoque')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'estoque' ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}>⛽ Estoque</button>
          <button onClick={() => setAba('vendas')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'vendas' ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}>💰 Financeiro</button>
          <button onClick={() => setAba('motoqueiros')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] ${aba === 'motoqueiros' ? 'bg-yellow-500 text-black' : 'hover:bg-white/5'}`}>🛵 Equipe</button>
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {aba === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-black italic uppercase text-slate-900 mb-8">Pedidos Ativos</h2>
            {pedidos.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[35px] shadow-sm border flex justify-between items-center">
                <div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${p.status_pagamento === 'pago' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                    {p.status_pagamento.toUpperCase()}
                  </span>
                  <p className="text-xl font-black mt-2 text-slate-900 italic uppercase">{p.combustivel}</p>
                  <p className="text-[10px] font-bold text-slate-400">PLACA: {p.placa_veiculo} | CLIENTE: {p.nome_cliente}</p>
                </div>
                <p className="text-2xl font-black text-slate-900 italic">R$ {p.valor_total},00</p>
              </div>
            ))}
          </div>
        )}

        {aba === 'estoque' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {estoque.map(e => (
              <div key={e.id} className="bg-white p-8 rounded-[40px] shadow-sm text-center border">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 italic tracking-widest">{e.item}</p>
                <input 
                  type="number" 
                  defaultValue={e.quantidade}
                  onBlur={(evt) => atualizarEstoque(e.id, Number(evt.target.value))}
                  className="text-5xl font-black text-slate-900 w-full text-center outline-none bg-transparent"
                />
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase">{e.unidade}</p>
              </div>
            ))}
          </div>
        )}

        {aba === 'vendas' && (
          <div className="text-center py-10">
            <div className="bg-white p-12 rounded-[50px] shadow-xl inline-block border">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Faturamento Hoje</p>
              <h2 className="text-7xl font-black text-green-600 italic">R$ {vendasHoje},00</h2>
              <p className="text-xs font-bold text-slate-400 mt-6 uppercase">Lucro Estimado (35%): R$ {(vendasHoje * 0.35).toFixed(2)}</p>
            </div>
          </div>
        )}

        {aba === 'motoqueiros' && (
          <div className="max-w-4xl">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome" value={formM.nome} onChange={e => setFormM({...formM, nome: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none font-bold" />
              <input placeholder="CPF" value={formM.cpf} onChange={e => setFormM({...formM, cpf: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none font-bold" />
              <input placeholder="WhatsApp" value={formM.telefone} onChange={e => setFormM({...formM, telefone: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none font-bold" />
              <input type="password" placeholder="Senha" value={formM.senha} onChange={e => setFormM({...formM, senha: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none font-bold" />
              <button onClick={cadastrarMotoqueiro} className="md:col-span-2 bg-slate-900 text-yellow-500 p-5 rounded-2xl font-black uppercase tracking-widest">Validar e Habilitar</button>
            </div>

            <div className="grid gap-4">
              {motoqueiros.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-3xl border flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${m.online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div>
                      <p className={`font-black uppercase text-sm ${!m.ativo ? 'text-slate-300' : 'text-slate-900'}`}>{m.nome}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">Acesso: {m.ativo ? 'Liberado' : 'Bloqueado'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => alternarAtivo(m.id, m.ativo)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${m.ativo ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
                  >
                    {m.ativo ? 'Bloquear' : 'Ativar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}