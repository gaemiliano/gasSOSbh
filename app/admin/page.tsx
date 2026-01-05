'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão direta com o seu banco
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  // Carrega os dados assim que abre a página
  useEffect(() => {
    carregarTudo();
    const interval = setInterval(carregarTudo, 5000); // Atualiza pedidos a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  async function carregarTudo() {
    const { data: prod } = await supabase.from('produtos').select('*').order('tipo', { ascending: true });
    const { data: ped } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (prod) setProdutos(prod);
    if (ped) setPedidos(ped);
  }

  // ESSA FUNÇÃO MUDA O PREÇO NO BANCO E JÁ ATUALIZA A PÁGINA INICIAL
  async function handlePrecoChange(id: string, novoValor: string) {
    const { error } = await supabase
      .from('produtos')
      .update({ preco: Number(novoValor) })
      .eq('id', id);
    
    if (error) {
      alert("Erro ao atualizar no Supabase");
    } else {
      carregarTudo(); // Recarrega para confirmar
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-10 uppercase italic">Controle de Estoque e Preços ⛽</h1>

        {/* ÁREA DE PRODUTOS (GASOLINA, ALCOOL, SPRAY/TAXA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {produtos.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[30px] shadow-lg border-2 border-slate-100">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                {item.tipo === 'taxa' ? '❄️ Spray / Partida Frio' : item.tipo.toUpperCase()}
              </label>
              <div className="flex items-center">
                <span className="text-xl font-bold text-slate-300 mr-2">R$</span>
                <input 
                  type="number" 
                  defaultValue={item.preco}
                  onBlur={(e) => handlePrecoChange(item.id, e.target.value)}
                  className="text-4xl font-black bg-transparent w-full outline-none text-slate-900"
                />
              </div>
              <p className="text-[9px] text-green-500 font-bold mt-2 italic">● Sincronizado com a Home</p>
            </div>
          ))}
        </div>

        {/* LISTA DE PEDIDOS EM TEMPO REAL */}
        <h2 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Chamados de Hoje</h2>
        <div className="space-y-4">
          {pedidos.map((ped) => (
            <div key={ped.id} className="bg-white p-6 rounded-[30px] border border-slate-100 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-black text-lg italic">{ped.combustivel}</p>
                <p className="text-slate-400 text-[10px] font-bold">VALOR TOTAL: R$ {ped.valor_total},00</p>
              </div>
              <div className="flex gap-2">
                <a href={ped.ponto_proximo} target="_blank" className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase">Ver GPS</a>
                <button 
                  onClick={async () => { await supabase.from('pedidos').delete().eq('id', ped.id); carregarTudo(); }}
                  className="bg-red-50 text-red-500 px-5 py-3 rounded-2xl font-black text-[10px] uppercase"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
