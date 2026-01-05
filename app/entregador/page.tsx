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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('entregador_id');
    if (!id) router.push('/entregador/login');
    
    carregarPedidos();
    const intervalo = setInterval(carregarPedidos, 10000);
    return () => clearInterval(intervalo);
  }, []);

  async function carregarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status_servico', 'aberto') // Só mostra o que não foi finalizado
      .order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }

  // --- 🛠 FUNÇÃO PARA DAR BAIXA NO STOCK E FINALIZAR ---
  async function finalizarServico(pedido: any) {
    if (!confirm("Confirmas que o serviço foi entregue e o stock deve ser baixado?")) return;
    
    setLoadingId(pedido.id);

    try {
      // 1. Identificar o que baixar
      if (pedido.combustivel.includes('GASOLINA')) {
        await supabase.rpc('decrement_estoque', { item_name: 'GASOLINA', qtd: 5 });
      } else if (pedido.combustivel.includes('ETANOL')) {
        await supabase.rpc('decrement_estoque', { item_name: 'ETANOL', qtd: 5 });
      }

      // 2. Se tiver Galão, baixa 1 unidade
      if (pedido.combustivel.includes('GALÃO')) {
        await supabase.rpc('decrement_estoque', { item_name: 'GALAO', qtd: 1 });
      }

      // 3. Atualizar o status do pedido para 'concluido'
      await supabase
        .from('pedidos')
        .update({ status_servico: 'concluido', status_pagamento: 'pago' })
        .eq('id', pedido.id);

      alert("✅ Serviço Finalizado e Stock Atualizado!");
      carregarPedidos();
    } catch (err) {
      alert("Erro ao dar baixa no stock. Verifica a tua ligação.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic text-yellow-500">GasSOS</h1>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
           <span className="text-[10px] font-bold uppercase text-slate-400">Em Serviço</span>
        </div>
      </header>

      <div className="space-y-6">
        {pedidos.length === 0 ? (
          <p className="text-center py-20 opacity-30 font-bold uppercase text-xs">Sem entregas pendentes...</p>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xl font-black italic">R$ {p.valor_total},00</span>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full ${p.status_pagamento === 'pago' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
                    {p.status_pagamento === 'pago' ? 'PAGO' : 'AGUARDAR PIX'}
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Item Selecionado:</p>
                  <p className="text-lg font-black text-yellow-500 uppercase italic">{p.combustivel}</p>
                  <p className="text-xs text-white/80 font-bold mt-2">📍 {p.nome_cliente} - {p.placa_veiculo}</p>
                </div>

                {/* BOTÕES DE ACÇÃO */}
                <div className="grid grid-cols-1 gap-3">
                  <a 
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    className="bg-white text-black py-4 rounded-2xl text-center font-black text-xs uppercase"
                  >
                    📍 Abrir Rota no GPS
                  </a>

                  <button 
                    onClick={() => finalizarServico(p)}
                    disabled={loadingId === p.id}
                    className="bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-green-900/20"
                  >
                    {loadingId === p.id ? 'A processar...' : '✅ Finalizar e Baixar Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}