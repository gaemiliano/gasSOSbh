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
    if (confirm("Deseja excluir este pedido?")) {
      await supabase.from('pedidos').delete().eq('id', id);
      carregarDados();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter border-b-4 border-yellow-400 inline-block">
          Painel Administrativo
        </h1>

        <div className="space-y-4 mt-6">
          {pedidos.length === 0 && <p className="text-slate-400 font-bold italic">Nenhum pedido pendente...</p>}
          
          {pedidos.map(pedido => (
            <div key={pedido.id} className={`p-5 rounded-3xl border-2 flex justify-between items-center bg-white ${pedido.status === 'concluido' ? 'opacity-50 border-slate-100' : 'border-white shadow-xl'}`}>
              <div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${pedido.status === 'concluido' ? 'bg-slate-200 text-slate-500' : 'bg-yellow-100 text-yellow-600'}`}>
                  {pedido.status === 'concluido' ? 'Entregue' : 'Pendente'}
                </span>
                <p className="text-lg font-black italic text-slate-900 mt-1">{pedido.combustivel} - R$ {pedido.valor_total},00</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(pedido.created_at).toLocaleString('pt-BR')}</p>
              </div>
              
              <div className="flex gap-2">
                {/* Link para o dono ver onde o cliente está, mas abre no Google Maps externo */}
                <a href={pedido.ponto_proximo} target="_blank" className="bg-blue-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase">Ver Mapa</a>
                
                {pedido.status !== 'concluido' && (
                  <button onClick={() => concluirPedido(pedido.id)} className="bg-green-500 text-white p-3 rounded-2xl text-[10px] font-black uppercase">OK</button>
                )}
                
                <button onClick={() => excluirPedido(pedido.id)} className="bg-red-100 text-red-500 p-3 rounded-2xl text-[10px] font-black uppercase">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
