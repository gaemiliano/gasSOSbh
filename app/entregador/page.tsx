'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function EntregadorPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white font-sans">
      <h1 className="text-2xl font-black italic mb-8 uppercase text-yellow-500">Entregas GasSOS</h1>
      <div className="space-y-4">
        {pedidos.length === 0 && <p className="opacity-50 italic">Nenhum pedido no radar...</p>}
        {pedidos.map((p) => (
          <div key={p.id} className="bg-slate-800 p-6 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Combustível</p>
                <p className="text-xl font-black italic">{p.combustivel}</p>
              </div>
              <p className="text-2xl font-black text-green-400 italic">R$ {p.valor_total},00</p>
            </div>
            <a 
              href={p.ponto_proximo} 
              target="_blank" 
              className="block w-full bg-white text-black py-4 rounded-2xl text-center font-black uppercase text-sm tracking-tighter"
            >
              Abrir GPS do Cliente
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
