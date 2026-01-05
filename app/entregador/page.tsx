'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração da conexão com o banco de dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelEntregador() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [senhaAcesso, setSenhaAcesso] = useState('');
  const [autenticado, setAutenticado] = useState(false);

  // Função para buscar pedidos pendentes de entrega
  async function buscarPedidos() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setPedidos(data);
    }
    setCarregando(false);
  }

  // Efeito para carregar dados assim que autenticar
  useEffect(() => {
    if (autenticado) {
      buscarPedidos();
      // Atualização automática a cada 30 segundos
      const intervalo = setInterval(buscarPedidos, 30000);
      return () => clearInterval(intervalo);
    }
  }, [autenticado]);

  // Tela de Login do Entregador
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-sm text-center">
          <div className="text-4xl mb-4">🛵</div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Área do Entregador</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 mb-6 text-center text-pretty">Acesse a lista de chamados ativos</p>
          
          <input 
            type="password" 
            placeholder="Digite sua senha" 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center text-xl font-black focus:border-yellow-500 outline-none transition-all"
            onChange={(e) => {
              if (e.target.value === 'moto123') setAutenticado(true); // Senha padrão para os motoqueiros
            }}
          />
          <p className="text-[9px] text-slate-300 font-bold uppercase italic text-pretty">Atenção: Mantenha seu GPS ativo durante a entrega</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans pb-20">
      {/* Cabeçalho do Painel */}
      <header className="bg-slate-900 rounded-[24px] p-6 text-white shadow-xl mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Entregas Ativas</h1>
          <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Sincronizado com a Central</p>
        </div>
        <button 
          onClick={buscarPedidos}
          className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-colors"
        >
          🔄
        </button>
      </header>

      {/* Lista de Pedidos */}
      <main className="space-y-4">
        {carregando && <p className="text-center text-slate-400 font-bold animate-pulse uppercase text-xs">Buscando novos chamados...</p>}
        
        {pedidos.length === 0 && !carregando && (
          <div className="text-center py-20">
            <p className="text-slate-300 font-black text-sm uppercase">Nenhum pedido no momento</p>
          </div>
        )}

        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 relative overflow-hidden group active:scale-[0.98] transition-all">
            {/* Indicador Lateral de Status */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${pedido.status === 'aguardando_pagamento' ? 'bg-orange-400' : 'bg-green-500'}`} />
            
            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Combustível</span>
                <h2 className="text-lg font-black text-slate-800 uppercase italic leading-none">{pedido.combustivel}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Valor do Recebimento</span>
                <p className="text-lg font-black text-slate-900 leading-none">R$ {pedido.valor_total},00</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status da Transação</p>
              <p className={`font-bold text-xs uppercase ${pedido.status === 'aguardando_pagamento' ? 'text-orange-500' : 'text-green-600'}`}>
                {pedido.status === 'aguardando_pagamento' ? '⚠️ Aguardando PIX' : '✅ Pagamento Confirmado'}
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.ponto_proximo)}`, '_blank')}
                className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                📍 Abrir Rota
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/5531999999999?text=Olá, estou a caminho da entrega do pedido #${pedido.id}`, '_blank')}
                className="bg-green-100 text-green-700 px-4 rounded-xl font-black text-sm"
              >
                💬
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase">
              <span>Pedido #{pedido.id}</span>
              <span>{new Date(pedido.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </main>

      {/* Footer Informativo */}
      <footer className="fixed bottom-4 left-4 right-4">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Painel Operacional v1.0 • GasSOS BH</p>
        </div>
      </footer>
    </div>
  );
}