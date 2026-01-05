'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function PainelAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [precos, setPrecos] = useState<any[]>([]);

  async function carregarDados() {
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: pr } = await supabase.from('produtos').select('*');
    if (p) setPedidos(p);
    if (pr) setPrecos(pr);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function concluirPedido(id: string) {
    await supabase.from('pedidos').update({ status: 'concluido' }).eq('id', id);
    carregarDados();
  }

  async function excluirPedido(id: string) {
    if (confirm("Deseja apagar este pedido da lista?")) {
      await supabase.from('pedidos').delete().eq('id', id);
      carregarDados();
    }
  }

  async function atualizarPreco(id: string, novoPreco: string) {
    await supabase.from('produtos').update({ preco: Number(novoPreco) }).eq('id', id);
    alert("Preço atualizado!");
    carregarDados();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-8 italic uppercase border-l-4 border-yellow-400 pl-4">
          Gerenciamento GasSOS 🛠️
        </h1>

        {/* SEÇÃO 1: AJUSTE DE PREÇOS */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-200 mb-10">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 italic">Tabela de Preços (Clique no valor para editar)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {precos.map(item => (
              <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{item.tipo}</p>
                <div className="flex items-center">
                  <span className="font-bold text-slate-400 mr-1 text-sm">R$</span>
                  <input 
                    type="number" 
                    defaultValue={item.preco}
                    onBlur={(e) => atualizarPreco(item.id, e.target.value)}
                    className="text-2xl font-black bg-transparent w-full focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO 2: LISTA DE PEDIDOS */}
        <section>
          <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 italic">Chamados Recentes</h2>
          <div className="space-y-4">
            {pedidos.map(pedido => (
              <div key={pedido.id} className={`p-6 rounded-[28px] border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${pedido.status === 'concluido' ? 'bg-white opacity-60 border-slate-100 shadow-none' : 'bg-white border-white shadow-xl'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${pedido.status === 'concluido' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <p className="font-black uppercase text-xs italic">{pedido.combustivel}</p>
                  </div>
                  <p className="text-3xl font-black italic tracking-tighter">R$ {pedido.valor_total},00</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(pedido.created_at).toLocaleString('pt-BR')}</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <a href={pedido.ponto_proximo} target="_blank" className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-center">Ver Local</a>
                  
                  {pedido.status !== 'concluido' && (
                    <button onClick={() => concluirPedido(pedido.id)} className="flex-1 md:flex-none bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase">Finalizar</button>
                  )}
                  
                  <button onClick={() => excluirPedido(pedido.id)} className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl font-black text-[10px] uppercase">Apagar</button>
                </div>
              </div>
            ))}
            {pedidos.length === 0 && <p className="text-center py-20 text-slate-400 font-bold italic uppercase">Nenhum pedido recebido...</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
