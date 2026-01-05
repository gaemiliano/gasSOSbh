'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  // Carrega tudo do banco
  async function carregarTudo() {
    const { data: p } = await supabase.from('produtos').select('*').order('id', { ascending: true });
    const { data: o } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (p) setProdutos(p);
    if (o) setPedidos(o);
  }

  useEffect(() => {
    carregarTudo();
    const interval = setInterval(carregarTudo, 10000); // Atualiza pedidos a cada 10s
    return () => clearInterval(interval);
  }, []);

  // FUNÇÃO QUE ALTERA O PREÇO NO BANCO NA HORA
  async function salvarPreco(id: number, novoValor: string) {
    const valor = parseFloat(novoValor);
    const { error } = await supabase.from('produtos').update({ preco: valor }).eq('id', id);
    if (error) alert("Erro ao salvar!");
    else carregarTudo();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-900">
      <div className="max-w-md mx-auto space-y-6">
        
        <h1 className="text-2xl font-black italic uppercase text-center py-4">Painel de Controle GasSOS</h1>

        {/* ⛽ AQUI É ONDE VOCÊ MUDA OS PREÇOS DIRETO NO BANCO */}
        <div className="bg-white p-6 rounded-[32px] shadow-xl border-2 border-slate-200">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest text-center italic">Mudar Preços (Edite e clique fora)</h2>
          
          <div className="space-y-6">
            {produtos.map((item) => (
              <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">{item.nome}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-300 italic">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    defaultValue={item.preco}
                    onBlur={(e) => salvarPreco(item.id, e.target.value)} // SALVA AO SAIR DO CAMPO
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-3xl font-black focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📋 LISTA DE PEDIDOS COM BOTÃO EXCLUIR */}
        <div className="bg-white p-6 rounded-[32px] shadow-xl border-2 border-slate-200">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest text-center italic">Pedidos Aguardando</h2>
          
          <div className="space-y-4">
            {pedidos.map((ped) => (
              <div key={ped.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-sm uppercase">{ped.combustivel}</p>
                  <p className="text-2xl font-black italic">R$ {ped.valor_total},00</p>
                </div>
                <div className="flex gap-2">
                  <a href={ped.ponto_proximo} target="_blank" className="bg-slate-900 text-white p-3 rounded-xl text-[10px] font-black uppercase">Mapa</a>
                  <button 
                    onClick={async () => { await supabase.from('pedidos').delete().eq('id', ped.id); carregarTudo(); }}
                    className="bg-red-500 text-white p-3 rounded-xl text-[10px] font-black uppercase"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {pedidos.length === 0 && <p className="text-center text-slate-400 font-bold italic py-4">Nenhum pedido...</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
