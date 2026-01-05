'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminPanel() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDados() {
    // 1. Busca os produtos usando as colunas exatas da sua tabela SQL
    const { data: dataProd } = await supabase
      .from('produtos')
      .select('id, nome, preco, tipo, ativo')
      .order('id', { ascending: true });

    // 2. Busca os pedidos
    const { data: dataPed } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (dataProd) setProdutos(dataProd);
    if (dataPed) setPedidos(dataPed);
    setLoading(false);
  }

  async function atualizarPreco(id: number, novoPreco: string) {
    const valorFormatado = parseFloat(novoPreco.replace(',', '.'));
    
    // Atualiza a coluna 'preco' filtrando pelo 'id'
    const { error } = await supabase
      .from('produtos')
      .update({ preco: valorFormatado })
      .eq('id', id);

    if (error) {
      setMensagem('❌ Erro ao atualizar');
    } else {
      setMensagem('✅ Salvo com sucesso!');
      fetchDados();
      setTimeout(() => setMensagem(''), 2000);
    }
  }

  async function excluirPedido(id: number) {
    if (confirm("Excluir este pedido?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (!error) fetchDados();
    }
  }

  if (loading) return <div className="p-10 text-center font-bold">Conectando ao Banco...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-900">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* SEÇÃO DE PREÇOS (USANDO 'nome' E 'preco' DO SEU SQL) */}
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-6 text-white text-center">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">GasSOS Admin</h1>
            {mensagem && <p className="text-yellow-400 text-xs font-bold mt-2 animate-pulse">{mensagem}</p>}
          </div>

          <div className="p-6 space-y-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  {produto.nome} {/* Usando a coluna 'nome' do seu SQL */}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-300">R$</span>
                  <input 
                    type="number" 
                    defaultValue={produto.preco} // Usando a coluna 'preco' do seu SQL
                    onBlur={(e) => atualizarPreco(produto.id, e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xl font-black outline-none focus:border-slate-900 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO DE PEDIDOS (COM OPÇÃO DE EXCLUIR) */}
        <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-50 p-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black text-center uppercase tracking-widest text-slate-400">Pedidos Recebidos</h2>
          </div>
          
          <div className="p-4 space-y-3">
            {pedidos.length === 0 && <p className="text-center text-slate-300 py-6 italic text-sm">Nenhum pedido...</p>}
            
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-black text-xs uppercase">{pedido.combustivel}</p>
                  <p className="text-xl font-black italic text-slate-900">R$ {pedido.valor_total},00</p>
                </div>
                <div className="flex gap-2">
                  <a href={pedido.ponto_proximo} target="_blank" className="bg-slate-900 text-white p-3 rounded-xl text-[9px] font-black uppercase">Mapa</a>
                  <button 
                    onClick={() => excluirPedido(pedido.id)}
                    className="bg-red-50 text-red-500 p-3 rounded-xl text-[9px] font-black uppercase"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
