'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão com o Banco
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function PainelAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [precos, setPrecos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Função que busca os dados reais do banco
  async function carregarDados() {
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    const { data: pr } = await supabase.from('produtos').select('*').order('tipo', { ascending: true });
    
    if (p) setPedidos(p);
    if (pr) setPrecos(pr);
    setLoading(false);
  }

  useEffect(() => {
    carregarDados();
    // Atualiza a lista a cada 20 segundos para ver novos pedidos
    const interval = setInterval(carregarDados, 20000);
    return () => clearInterval(interval);
  }, []);

  // ATUALIZA O PREÇO NO BANCO DE DADOS (Ao sair do campo)
  async function atualizarPrecoNoBanco(id: string, novoPreco: string) {
    const { error } = await supabase
      .from('produtos')
      .update({ preco: Number(novoPreco) })
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar preço!");
    } else {
      console.log("Preço atualizado com sucesso");
      carregarDados();
    }
  }

  async function concluirPedido(id: string) {
    await supabase.from('pedidos').update({ status: 'concluido' }).eq('id', id);
    carregarDados();
  }

  async function excluirPedido(id: string) {
    if (confirm("Tem certeza que deseja apagar este pedido?")) {
      await supabase.from('pedidos').delete().eq('id', id);
      carregarDados();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">ADMINISTRADOR</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de Preços e Chamados</p>
          </div>
          <div className="bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-full animate-pulse">SISTEMA ONLINE</div>
        </header>

        {/* TABELA DE PREÇOS (VINCULADA AO BANCO) */}
        <section className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 mb-10">
          <h2 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest italic">Ajuste de Preços (Atualiza o App na hora)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {precos.map((item) => (
              <div key={item.id} className="bg-slate-50 p-5 rounded-[24px] border-2 border-slate-100 focus-within:border-yellow-400 transition-all">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{item.tipo === 'taxa' ? '❄️ Taxa Inverno' : item.tipo.toUpperCase()}</p>
                <div className="flex items-center">
                  <span className="text-xl font-black text-slate-400 mr-2">R$</span>
                  <input 
                    type="number" 
                    defaultValue={item.preco}
                    onBlur={(e) => atualizarPrecoNoBanco(item.id, e.target.value)}
                    className="bg-transparent text-3xl font-black w-full outline-none text-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LISTA DE PEDIDOS */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest italic">Pedidos Recebidos</h2>
          
          {loading ? <p className="text-center py-10 font-bold animate-pulse text-slate-400">CARREGANDO...</p> : 
            pedidos.map(pedido => (
              <div key={pedido.id} className={`bg-white p-6 rounded-[32px] border-2 flex flex-col md:flex-row justify-between items-center gap-6 transition-all ${pedido.status === 'concluido' ? 'opacity-40 border-slate-100' : 'shadow-lg border-white'}`}>
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${pedido.status === 'concluido' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <span className="font-black uppercase text-xs italic tracking-tighter">{pedido.combustivel}</span>
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter text-slate-900">R$ {pedido.valor_total},00</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(pedido.created_at).toLocaleString('pt-BR')}</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <a href={pedido.ponto_proximo} target="_blank" className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase text-center active:scale-95 transition-all">Ver no Mapa</a>
                  {pedido.status !== 'concluido' && (
                    <button onClick={() => concluirPedido(pedido.id)} className="flex-1 bg-green-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">Concluir</button>
                  )}
                  <button onClick={() => excluirPedido(pedido.id)} className="bg-red-50 text-red-500 px-4 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all">X</button>
                </div>
              </div>
            ))
          }
          {!loading && pedidos.length === 0 && <p className="text-center py-10 text-slate-400 font-bold italic">NENHUM PEDIDO ENCONTRADO</p>}
        </section>
      </div>
    </div>
  );
}
