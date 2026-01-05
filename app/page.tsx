'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GasSOS() {
  // Estados do Sistema
  const [etapa, setEtapa] = useState<'pedido' | 'pagamento'>('pedido');
  const [combustivel, setCombustivel] = useState('gasolina');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [precos, setPrecos] = useState({ gasolina: 65, etanol: 55, taxa: 15 });
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // 1. Tenta capturar a localização assim que o app abre
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Erro ao obter GPS:", err)
      );
    }
  }, []);

  // Carregar preços reais do banco de dados
  useEffect(() => {
    async function carregarPrecos() {
      const { data } = await supabase.from('produtos').select('*');
      if (data) {
        const p = { ...precos };
        data.forEach(item => {
          if (item.tipo === 'gasolina') p.gasolina = Number(item.preco);
          if (item.tipo === 'etanol') p.etanol = Number(item.preco);
          if (item.tipo === 'taxa') p.taxa = Number(item.preco);
        });
        setPrecos(p);
      }
    }
    carregarPrecos();
  }, []);

  const total = (combustivel === 'gasolina' ? precos.gasolina : precos.etanol) + (partidaFrio ? precos.taxa : 0);

  // Função para registrar o pedido com GPS e abrir WhatsApp
  const finalizarPedido = async () => {
    setLoading(true);
    
    // Tenta pegar a localização atualizada antes de enviar
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const mapaLink = `https://www.google.com/maps?q=${lat},${lng}`;

      try {
        // Salva no banco com o link do mapa
        await supabase.from('pedidos').insert([{
          combustivel: combustivel.toUpperCase(),
          valor_total: total,
          status: 'aguardando_pagamento',
          ponto_proximo: mapaLink // O entregador verá este link
        }]);

        // Abre o WhatsApp com o seu número real
        const zapLink = `https://wa.me/5531988089870?text=${encodeURIComponent(
          `🚨 *NOVO PEDIDO GasSOS*\n\n⛽ *Produto:* ${combustivel.toUpperCase()}\n💰 *Valor:* R$ ${total},00\n📍 *Localização:* ${mapaLink}`
        )}`;
        
        window.open(zapLink, '_blank');
        setEtapa('pagamento');
      } catch (error) {
        alert("Erro ao processar pedido. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, () => {
      alert("Por favor, ative o GPS para solicitar o socorro.");
      setLoading(false);
    });
  };

  // TELA 2: PAGAMENTO (PIX)
  if (etapa === 'pagamento') {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg animate-bounce">✓</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Pedido Pronto!</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 mb-8 text-center">Finalize o pagamento via PIX</p>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Código PIX Copia e Cola</p>
              <div className="bg-white p-4 rounded-xl text-[10px] font-mono break-all text-slate-600 border border-slate-100">
                00020126360014BR.GOV.BCB.PIX0114+55319880898705204000053039865405{total}.00
              </div>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(`00020126360014BR.GOV.BCB.PIX0114+55319880898705204000053039865405${total}.00`);
                alert("Código PIX copiado!");
              }}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Copiar Código PIX
            </button>

            <button 
              onClick={() => window.open(`https://wa.me/5531988089870?text=Enviei o PIX de R$${total}. Favor iniciar o socorro.`, '_blank')}
              className="w-full bg-green-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Já paguei / Chamar Zap</span>
            </button>
            
            <button onClick={() => setEtapa('pedido')} className="text-slate-400 text-[10px] font-black uppercase hover:text-slate-600 transition-colors">Voltar e alterar pedido</button>
          </div>
        </div>
      </div>
    );
  }

  // TELA 1: PEDIDO (MAPA + ESCOLHA)
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 overflow-hidden">
      
      {/* MAPA CARTOGRÁFICO */}
      <div className="h-[45vh] w-full relative overflow-hidden bg-slate-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(#fbbf24 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
        <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Mapa BH" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-yellow-500 rounded-full animate-ping opacity-20" />
            <div className="relative bg-yellow-500 p-4 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] border-2 border-white">
              <span className="text-2xl">📍</span>
            </div>
            {coords && (
              <div className="absolute top-12 bg-black/50 px-2 py-1 rounded text-[8px] font-bold">
                LAT: {coords.lat.toFixed(4)} | LNG: {coords.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAINEL DE SELEÇÃO */}
      <div className="flex-1 bg-white rounded-t-[45px] -mt-12 relative z-10 p-8 flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.3)]">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setCombustivel('gasolina')}
              className={`p-6 rounded-[32px] border-4 transition-all ${combustivel === 'gasolina' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-50 bg-slate-50 opacity-40'}`}
            >
              <span className="text-4xl block mb-2">⛽</span>
              <span className="font-black text-[10px] uppercase text-slate-500">Gasolina</span>
              <p className="font-black text-lg text-slate-900 uppercase tracking-tighter italic">R$ {precos.gasolina},00</p>
            </button>

            <button 
              onClick={() => setCombustivel('etanol')}
              className={`p-6 rounded-[32px] border-4 transition-all ${combustivel === 'etanol' ? 'border-green-500 bg-green-50' : 'border-slate-50 bg-slate-50 opacity-40'}`}
            >
              <span className="text-4xl block mb-2">🎋</span>
              <span className="font-black text-[10px] uppercase text-slate-500">Etanol</span>
              <p className="font-black text-lg text-slate-900 uppercase tracking-tighter italic">R$ {precos.etanol},00</p>
            </button>
          </div>

          <div 
            onClick={() => setPartidaFrio(!partidaFrio)}
            className={`p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${partidaFrio ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl">❄️</span>
              <div className="text-left">
                <p className="font-black text-[10px] uppercase italic">Partida a Frio</p>
                <p className="text-[8px] font-bold opacity-60">SUPLEMENTO DE INVERNO</p>
              </div>
            </div>
            <span className="font-black">+{precos.taxa},00</span>
          </div>
        </div>

        {/* BOTÃO FINAL COM LOADING */}
        <button 
          onClick={finalizarPedido}
          disabled={loading}
          className="w-full bg-slate-900 text-white mt-8 py-6 rounded-[24px] shadow-2xl font-black text-lg tracking-[0.2em] uppercase italic active:scale-95 transition-all flex justify-between px-10 items-center disabled:opacity-50"
        >
          <span>{loading ? 'BUSCANDO LOCALIZAÇÃO...' : 'SOLICITAR SOS'}</span>
          {!loading && <span className="text-yellow-400 font-mono">R$ {total},00</span>}
        </button>
      </div>
    </div>
  );
}