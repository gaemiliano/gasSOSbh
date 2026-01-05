'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function PainelAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [precos, setPrecos] = useState<any[]>([]);

  // Carregar dados originais do banco
  async function carregarDados() {
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: pr } = await supabase.from('produtos').select('*');
    if (p) setPedidos(p);
    if (pr) setPrecos(pr);
  }

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Função que você usava para atualizar os preços no banco
  async function atualizarPreco(id: string, novoPreco: string) {
    const { error } = await supabase.from('produtos').update({ preco: Number(novoPreco) }).eq('id', id);
    if (!error) {
      carregarDados();
    }
  }

  // Função para concluir pedido
  async function concluirPedido(id: string) {
    await supabase.from('pedidos').update({ status: 'concluido' }).eq('id', id);
    carregarDados();
  }

  // Função para excluir pedido
  async function excluirPedido(id: string) {
    if (confirm("Tem certeza que deseja apagar este pedido?")) {
      await supabase.from('pedidos').delete().eq('id', id);
      carregarDados();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Gestão GasSOS 🛠️</h1>

        {/* CONTROLE DE PREÇOS (O que você alterava direto na tabela) */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border mb-8">
          <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Ajuste de Preços</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {precos.map(item => (
              <div key={item.id} className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400">{item.tipo}</p>
                <div className="flex items-center">
                  <span className="font-bold text-slate-400 mr-1">R$</span>
                  <input 
                    type="number" 
                    defaultValue={item.preco}
                    onBlur={(e) => atualizarPreco(item.id, e.target.value)}
                    className="text-xl font-black bg-transparent w-full focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LISTA DE PEDIDOS */}
        <section>
          <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Pedidos Recentes</h2>
          <div className="space-y-4">
            {pedidos.map(pedido => (
              <div key={pedido.id} className={`bg-white p-6 rounded-[32px] shadow-sm border flex justify-between items-center ${pedido.status === 'concluido' ? 'opacity-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${pedido.status === 'concluido' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <p className="font-black uppercase text-sm">{pedido.combustivel}</p>
                  </div>
                  <p className="text-2xl font-black italic">R$ {pedido.valor_total},00</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(pedido.created_at).toLocaleString('pt-BR')}</p>
                </div>
                
                <div className="flex gap-2">
                  <a href={pedido.ponto_proximo} target="_blank" className="bg-slate-900 text-white p-4 rounded-2xl font-bold text-xs uppercase hover:bg-slate-800">Mapa</a>
                  {pedido.status !== 'concluido' && (
                    <button onClick={() => concluirPedido(pedido.id)} className="bg-green-500 text-white p-4 rounded-2xl font-bold text-xs uppercase">OK</button>
                  )}
                  <button onClick={() => excluirPedido(pedido.id)} className="bg-red-50 text-red-500 p-4 rounded-2xl font-bold text-xs uppercase">Excluir</button>
                </div>
              </div>
            ))}
            {pedidos.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum pedido no momento.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
