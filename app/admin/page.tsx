'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function PainelAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [precos, setPrecos] = useState<any[]>([]);

  async function carregarDados() {
    const { data: p } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    const { data: pr } = await supabase.from('produtos').select('*');
    if (p) setPedidos(p);
    if (pr) setPrecos(pr);
  }

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 20000); // Atualiza a cada 20s
    return () => clearInterval(interval);
  }, []);

  // 1. FUNÇÃO PARA CONCLUIR PEDIDO
  async function concluirPedido(id: string) {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'concluido' })
      .eq('id', id);
    if (!error) carregarDados();
  }

  // 2. FUNÇÃO PARA EXCLUIR PEDIDO
  async function excluirPedido(id: string) {
    if (confirm('Deseja remover este pedido permanentemente?')) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (!error) carregarDados();
    }
  }

  async function atualizarPreco(id: string, novoPreco: string) {
    await supabase
      .from('produtos')
      .update({ preco: Number(novoPreco) })
      .eq('id', id);
    carregarDados();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Gestão GasSOS 🛠️
          </h1>
          <button
            onClick={carregarDados}
            className="text-[10px] font-bold bg-slate-200 px-4 py-2 rounded-full uppercase tracking-widest active:scale-95"
          >
            Atualizar Agora
          </button>
        </header>

        {/* AJUSTE DE PREÇOS */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border mb-8">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 italic">
            Tabela de Preços Atual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {precos.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
              >
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {item.tipo}
                </p>
                <div className="flex items-center">
                  <span className="font-bold text-slate-400 mr-1">R$</span>
                  <input
                    type="number"
                    defaultValue={item.preco}
                    onBlur={(e) => atualizarPreco(item.id, e.target.value)}
                    className="text-2xl font-black bg-transparent w-full focus:outline-none text-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LISTA DINÂMICA DE PEDIDOS */}
        <section className="space-y-4">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 italic">
            Histórico de Chamados
          </h2>
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className={`p-6 rounded-[32px] border transition-all ${
                pedido.status === 'concluido'
                  ? 'bg-white opacity-60'
                  : 'bg-white shadow-xl border-yellow-100'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full animate-pulse ${
                        pedido.status === 'concluido'
                          ? 'bg-green-500 animate-none'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span className="font-black uppercase text-xs tracking-tighter italic">
                      {pedido.combustivel} —{' '}
                      {pedido.status === 'concluido'
                        ? 'Finalizado'
                        : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter">
                    R$ {pedido.valor_total},00
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    {new Date(pedido.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex grid grid-cols-2 md:flex gap-2">
                  <a
                    href={pedido.ponto_proximo}
                    target="_blank"
                    className="bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase text-center hover:bg-slate-800 transition-all"
                  >
                    Ver Mapa
                  </a>

                  {pedido.status !== 'concluido' && (
                    <button
                      onClick={() => concluirPedido(pedido.id)}
                      className="bg-green-500 text-white p-4 rounded-2xl font-black text-[10px] uppercase hover:bg-green-600 transition-all"
                    >
                      Concluir
                    </button>
                  )}

                  <button
                    onClick={() => excluirPedido(pedido.id)}
                    className="bg-red-50 text-red-500 p-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
