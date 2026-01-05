'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function AdminMaster() {
  const [autorizado, setAutorizado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [aba, setAba] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [motoqueiros, setMotoqueiros] = useState([]);
  const [vendasHoje, setVendasHoje] = useState(0);
  const [lastCount, setLastCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form Motoqueiro
  const [formM, setFormM] = useState({ nome: '', cpf: '', senha: '', telefone: '', placa_moto: '', marca_moto: '', modelo_moto: '' });

  const MEU_SITE = "https://gassos.vercel.app"; // SEU SITE

  const fazerLogin = () => {
    if (senhaInput === 'BH24HORAS') {
        setAutorizado(true);
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    } else alert("Senha incorreta!");
  };

  useEffect(() => {
    if (autorizado) {
      fetchDados();
      const interval = setInterval(fetchDados, 5000);
      return () => clearInterval(interval);
    }
  }, [autorizado]);

  async function fetchDados() {
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: e } = await supabase.from('estoque').select('*').order('item');
    const { data: m } = await supabase.from('entregadores').select('*').order('nome');
    
    if (p) {
      setPedidos(p);
      const novosPedidos = p.filter(ped => ped.status_servico === 'aberto').length;
      if (novosPedidos > lastCount) audioRef.current?.play().catch(()=>console.log('Som bloqueado'));
      setLastCount(novosPedidos);

      // Calculo de vendas considera apenas PAGOS
      const hoje = new Date().toISOString().split('T')[0];
      const total = p.filter(ped => ped.created_at.includes(hoje) && ped.status_pagamento === 'pago')
                    .reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
      setVendasHoje(total);
    }
    if (e) setEstoque(e);
    if (m) setMotoqueiros(m);
  }

  // --- CONFIRMAR PAGAMENTO (A MÁGICA) ---
  async function confirmarPagamento(id) {
    if(confirm("Confirma que o dinheiro caiu na conta?")) {
        await supabase.from('pedidos').update({ status_pagamento: 'pago' }).eq('id', id);
        fetchDados();
        alert("Pagamento Confirmado! O cliente foi liberado.");
    }
  }

  // Outras funções
  async function atualizarEstoque(id, campo, valor) { await supabase.from('estoque').update({ [campo]: valor }).eq('id', id); }
  async function salvarItemEstoque(item) { await supabase.from('estoque').update({ quantidade: item.quantidade, preco: item.preco }).eq('id', item.id); alert("Atualizado!"); }
  async function cadastrarMotoqueiro() { const { error } = await supabase.from('entregadores').insert([{ ...formM, ativo: true }]); if(!error) { alert("Cadastrado!"); fetchDados(); } }

  if (!autorizado) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6"><div className="bg-white p-8 rounded-[40px] w-full max-w-sm text-center shadow-2xl"><h1 className="text-3xl font-black italic mb-6 uppercase text-black">GasSOS Admin</h1><input type="password" placeholder="SENHA" className="w-full p-4 bg-slate-100 rounded-2xl mb-4 text-center font-bold text-black" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} /><button onClick={fazerLogin} className="w-full bg-yellow-500 text-black p-4 rounded-2xl font-black">ENTRAR</button></div></div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900">
      <aside className="w-full md:w-72 bg-slate-950 p-8 text-white flex flex-col shadow-2xl z-20">
        <h1 className="text-2xl font-black italic text-yellow-500 mb-10 text-center uppercase">GasSOS Hub</h1>
        <nav className="space-y-3 flex-1">
          {['pedidos', 'estoque', 'vendas', 'motoqueiros'].map((item) => (
            <button key={item} onClick={() => setAba(item)} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${aba === item ? 'bg-yellow-500 text-black' : 'hover:bg-white/5 text-slate-400'}`}>{item}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50">
        {aba === 'pedidos' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black uppercase italic text-slate-900 mb-6">Monitoramento</h2>
            {pedidos.map(p => (
              <div key={p.id} className={`bg-white p-6 rounded-[35px] border-l-8 shadow-sm flex flex-col md:flex-row justify-between gap-4 ${p.status_pagamento === 'pago' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div>
                  <div className="flex gap-2 mb-2">
                    {/* ETIQUETA DE PAGAMENTO */}
                    {p.status_pagamento === 'pago' ? (
                        <span className="text-[9px] font-black px-2 py-1 rounded-full bg-green-100 text-green-700 uppercase">PAGO E LIBERADO</span>
                    ) : (
                        <span className="text-[9px] font-black px-2 py-1 rounded-full bg-red-100 text-red-600 uppercase animate-pulse">AGUARDANDO PIX</span>
                    )}
                    <span className="text-[9px] font-black px-2 py-1 rounded-full bg-blue-50 text-blue-600 uppercase">{new Date(p.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xl font-black italic uppercase text-slate-900">{p.combustivel}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">CLI: {p.nome_cliente} | {p.placa_veiculo}</p>
                  <p className="text-[11px] font-bold text-blue-600 uppercase mt-2">📍 {p.localizacao}</p>
                </div>
                
                <div className="text-right flex flex-col items-end justify-center">
                  <p className="text-3xl font-black italic text-slate-900 mb-2">R$ {p.valor_total},00</p>
                  {/* BOTÃO DE APROVAÇÃO */}
                  {p.status_pagamento !== 'pago' && p.status_servico !== 'concluido' && (
                      <button onClick={() => confirmarPagamento(p.id)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-green-700 shadow-lg animate-bounce">
                          💰 Confirmar Recebimento
                      </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Outras abas simplificadas para caber no exemplo... mantenha o código anterior para estoque/equipe */}
      </main>
    </div>
  );
}