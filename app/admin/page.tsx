'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Usando as chaves que você mandou agora para conectar no banco certo
const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  async function carregar() {
    // Busca os produtos (Gasolina, Alcool, Spray)
    const { data: p } = await supabase.from('produtos').select('*').order('id', { ascending: true });
    // Busca os pedidos
    const { data: o } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    
    if (p) setProdutos(p);
    if (o) setPedidos(o);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function mudarPreco(id: number, valor: string) {
    const v = parseFloat(valor);
    await supabase.from('produtos').update({ preco: v }).eq('id', id);
    carregar(); // Recarrega para confirmar a mudança
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-900">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black text-center mb-10 italic uppercase">Painel GasSOS BH</h1>

        {/* PRODUTOS PARA ALTERAR PREÇO */}
        <div className="bg-white p-6 rounded-[32px] shadow-2xl border-2 border-slate-200 mb-8">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 text-center italic tracking-widest">Ajuste de Preços</h2>
          
          <div className="space-y-6">
            {produtos.length === 0 && <p className="text-center text-slate-400 animate-pulse font-bold">Conectando ao banco correto...</p>}
            
            {produtos.map((item) => (
              <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">{item.nome}</label>
                <div className="flex items-center">
                  <span className="text-xl font-black text-slate-300 mr-2">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    defaultValue={item.preco}
                    onBlur={(e) => mudarPreco(item.id, e.target.value)}
                    className="w-full bg-transparent text-3xl font-black outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LISTA DE PEDIDOS COM EXCLUIR */}
        <div className="bg-white p-6 rounded-[32px] shadow-xl border-2 border-slate-200">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 text-center italic tracking-widest">Pedidos Pendentes</h2>
          <div className="space-y-4">
            {pedidos.map((ped) => (
              <div key={ped.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-xs uppercase">{ped.combustivel}</p>
                  <p className="text-xl font-black italic">R$ {ped.valor_total},00</p>
                </div>
                <div className="flex gap-2">
                  <a href={ped.ponto_proximo} target="_blank" className="bg-slate-900 text-white p-3 rounded-xl text-[10px] font-black uppercase">Mapa</a>
                  <button 
                    onClick={async () => { await supabase.from('pedidos').delete().eq('id', ped.id); carregar(); }}
                    className="bg-red-500 text-white p-3 rounded-xl text-[10px] font-black uppercase"
                  >X</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
