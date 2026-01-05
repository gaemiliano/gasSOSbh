'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão direta para evitar erros de importação
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPanel() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]); // Nova linha para pedidos
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');

  // 1. Carregar preços e pedidos do banco
  useEffect(() => {
    fetchDados();
    // Atualização automática a cada 20 segundos para novos pedidos
    const interval = setInterval(fetchDados, 20000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDados() {
    // Busca Preços
    const { data: dataProd } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: true });

    // Busca Pedidos (Mais recentes primeiro)
    const { data: dataPed } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (dataProd) setProdutos(dataProd);
    if (dataPed) setPedidos(dataPed);
    setLoading(false);
  }

  // 2. Função para salvar o novo preço
  async function atualizarPreco(id: number, novoPreco: string) {
    const valorFormatado = parseFloat(novoPreco.replace(',', '.'));
    
    const { error } = await supabase
      .from('produtos')
      .update({ preco: valorFormatado })
      .eq('id', id);

    if (error) {
      setMensagem('❌ Erro ao atualizar');
    } else {
      setMensagem('✅ Preço atualizado!');
      fetchDados();
      setTimeout(() => setMensagem(''), 3000);
    }
  }

  // 3. Função para excluir pedido
  async function excluirPedido(id: number) {
    if (confirm("Deseja excluir este pedido permanentemente?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (!error) fetchDados();
    }
  }

  if (loading) return <div className="p-10 text-center font-bold">Carregando Painel GasSOS...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* CARD DE PREÇOS (O SEU ORIGINAL) */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-6 text-white text-center">
            <h1 className="text-2xl font-black">Painel GasSOS</h1>
            <p className="text-slate-400 text-sm italic">Gestão de Preços</p>
          </div>

          <div className="p-6 space-y-4">
            {mensagem && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold">
                {mensagem}
              </div>
            )}

            {produtos.map((produto) => (
              <div key={produto.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {produto.tipo || produto.nome}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400 font-mono">R$</span>
                  <input 
                    type="number" 
                    defaultValue={produto.preco}
                    onBlur={(e) => atualizarPreco(produto.id, e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xl font-black focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD DE PEDIDOS (NOVA SEÇÃO COM EXCLUIR) */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-yellow-500 p-4 text-slate-900 text-center">
            <h2 className="text-sm font-black uppercase tracking-widest">Pedidos Aguardando</h2>
          </div>
          
          <div className="p-4 space-y-3">
            {pedidos.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nenhum pedido no momento.</p>}
            
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-black text-sm uppercase">{pedido.combustivel}</p>
                  <p className="text-xl font-black italic">R$ {pedido.valor_total},00</p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={pedido.ponto_proximo} 
                    target="_blank" 
                    className="bg-slate-900 text-white p-3 rounded-xl text-[10px] font-black uppercase"
                  >
                    Mapa
                  </a>
                  <button 
                    onClick={() => excluirPedido(pedido.id)}
                    className="bg-red-100 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase"
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
