'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminPage() {
  const [precos, setPrecos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    const { data: p } = await supabase.from('produtos').select('*');
    const { data: o } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (p) setPrecos(p);
    if (o) setPedidos(o);
  }

  async function atualizarPreco(id: string, valor: string) {
    await supabase.from('produtos').update({ preco: Number(valor) }).eq('id', id);
    fetchDados();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans bg-white min-h-screen">
      <h1 className="text-3xl font-black mb-8 uppercase italic">Painel GasSOS BH</h1>
      
      {/* CAMPOS DE PREÇO ORIGINAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {precos.map((item) => (
          <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">{item.tipo}</label>
            <div className="flex items-center">
              <span className="text-xl font-bold mr-2 text-slate-400">R$</span>
              <input 
                type="number" 
                defaultValue={item.preco} 
                onBlur={(e) => atualizarPreco(item.id, e.target.value)}
                className="bg-transparent text-3xl font-black w-full outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* LISTA DE PEDIDOS QUE VOCÊ TINHA NO INÍCIO */}
      <div className="space-y-4">
        <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Pedidos Recebidos</h2>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="p-6 bg-white rounded-3xl border-2 border-slate-50 shadow-sm flex justify-between items-center">
            <div>
              <p className="font-black text-lg italic uppercase">{pedido.combustivel}</p>
              <p className="text-slate-400 text-xs font-bold uppercase">Total: R$ {pedido.valor_total},00</p>
            </div>
            <div className="flex gap-2">
              <a href={pedido.ponto_proximo} target="_blank" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase">Ver Local</a>
              <button onClick={async () => {
                await supabase.from('pedidos').delete().eq('id', pedido.id);
                fetchDados();
              }} className="bg-red-50 text-red-500 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
