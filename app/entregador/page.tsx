'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function PainelEntregador() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [nomeEntregador, setNomeEntregador] = useState('');
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('entregador_id');
    const nome = localStorage.getItem('entregador_nome');

    if (!id) {
      router.push('/entregador/login');
    } else {
      setNomeEntregador(nome || 'Entregador');
      // Garante que está ONLINE ao carregar a página de trabalho
      supabase.from('entregadores').update({ online: true }).eq('id', id).then();
    }

    carregarPedidos();
    const intervalo = setInterval(carregarPedidos, 10000);

    // Lógica para quando ele apenas fechar a aba do navegador
    const handleTabClose = () => {
      if (id) {
        // O beacon é mais garantido para quando a aba é fechada bruscamente
        const data = JSON.stringify({ online: false });
        navigator.sendBeacon(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/entregadores?id=eq.${id}`, data);
      }
    };

    window.addEventListener('beforeunload', handleTabClose);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  async function carregarPedidos() {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }

  // --- FUNÇÃO DE LOGOUT COM CORREÇÃO DE BUG ---
  const fazerLogout = async () => {
    const id = localStorage.getItem('entregador_id');
    
    if (id) {
      // 1. Primeiro tentamos avisar o banco que ele saiu (Bolinha cinza)
      // Usamos o 'await' para o código "parar" e esperar o banco responder
      const { error } = await supabase
        .from('entregadores')
        .update({ online: false })
        .eq('id', id);

      if (error) {
        console.error("Erro ao atualizar status:", error);
      }
    }

    // 2. Só depois limpamos o celular e redirecionamos
    localStorage.removeItem('entregador_id');
    localStorage.removeItem('entregador_nome');
    router.push('/entregador/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white font-sans">
      {/* HEADER COM STATUS */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black italic text-yellow-500 uppercase leading-none tracking-tighter">GasSOS</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nomeEntregador} (Online)</p>
          </div>
        </div>
        
        <button 
          onClick={fazerLogout}
          className="bg-red-600/20 text-red-500 border border-red-500/30 px-5 py-2 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
        >
          Sair / Offline
        </button>
      </div>

      <div className="space-y-6">
        {pedidos.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]">
            <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">Aguardando novos chamados...</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-slate-900 p-6 rounded-[35px] border border-white/5 shadow-2xl relative overflow-hidden">
               {/* Indicador visual de pagamento no card */}
               <div className={`absolute top-0 left-0 w-full h-1.5 ${p.status_pagamento === 'pago' ? 'bg-green-500' : 'bg-red-600 animate-pulse'}`}></div>
               
               <div className="flex justify-between items-center mb-6 pt-2">
                 <span className={`text-[9px] font-black px-3 py-1 rounded-full ${p.status_pagamento === 'pago' ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                   {p.status_pagamento === 'pago' ? '✓ PAGAMENTO OK' : '⚠ AGUARDANDO PIX'}
                 </span>
                 <p className="text-xl font-black italic text-white tracking-tighter">R$ {p.valor_total},00</p>
               </div>
               
               <div className="bg-slate-800/50 p-4 rounded-2xl mb-6 space-y-3">
                 <div>
                   <p className="text-[9px] text-slate-500 font-black uppercase italic">Cliente</p>
                   <p className="text-lg font-black">{p.nome_cliente || 'Não informado'}</p>
                 </div>
                 <div className="flex justify-between border-t border-white/5 pt-3">
                   <div>
                     <p className="text-[9px] text-slate-500 font-black uppercase italic">Placa</p>
                     <p className="text-sm font-bold text-yellow-500">{p.placa_veiculo || '---'}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] text-slate-500 font-black uppercase italic">Combustível</p>
                     <p className="text-sm font-bold uppercase italic">{p.combustivel}</p>
                   </div>
                 </div>
               </div>

               {/* BOTÃO DE GPS INTEGRADO */}
               <a 
                 href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                 target="_blank"
                 className="block w-full bg-white text-slate-950 py-5 rounded-2xl text-center font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <span>📍</span> ABRIR ROTA NO GOOGLE MAPS
               </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}