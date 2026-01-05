'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// 1. CARREGAMENTO DINÂMICO DO MAPA (Resolve erro de SSR na Vercel)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

import 'leaflet/dist/leaflet.css';

// Lógica interna do mapa para ícones e centralização
const MapContent = ({ coords }: { coords: { lat: number; lng: number } }) => {
  const { useMap } = require('react-leaflet');
  const L = require('leaflet');
  const map = useMap();

  useEffect(() => {
    map.setView([coords.lat, coords.lng], 16);
  }, [coords, map]);

  const icon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });

  return <Marker position={[coords.lat, coords.lng]} icon={icon} />;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function GasSOS() {
  const [etapa, setEtapa] = useState<'pedido' | 'dados' | 'pagamento'>('pedido');
  const [combustivel, setCombustivel] = useState('GASOLINA');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [precos, setPrecos] = useState({ gasolina: 65, etanol: 55, taxa: 15 });
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: -19.9167, lng: -43.9345 });
  const [isMounted, setIsMounted] = useState(false);

  // Dados do Cliente
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [placa, setPlaca] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Aguardando permissão de GPS...')
      );
    }

    async function carregarPrecos() {
      const { data } = await supabase.from('produtos').select('*');
      if (data) {
        const p = { ...precos };
        data.forEach((item) => {
          if (item.tipo === 'gasolina') p.gasolina = Number(item.preco);
          if (item.tipo === 'etanol') p.etanol = Number(item.preco);
          if (item.tipo === 'taxa') p.taxa = Number(item.preco);
        });
        setPrecos(p);
      }
    }
    carregarPrecos();
  }, []);

  const total = (combustivel === 'GASOLINA' ? precos.gasolina : precos.etanol) + (partidaFrio ? precos.taxa : 0);

  const finalizarPedido = async () => {
    if (!nome || !telefone || !placa) {
      alert("Preencha Nome, Placa e Telefone!");
      return;
    }
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const mapaLink = `https://www.google.com/maps?q=${lat},${lng}`;

      try {
        await supabase.from('pedidos').insert([{
          combustivel: combustivel + (partidaFrio ? ' + SPRAY' : ''),
          valor_total: total,
          nome_cliente: nome,
          telefone_cliente: telefone,
          placa_veiculo: placa,
          ponto_proximo: mapaLink,
          status_pagamento: 'pendente'
        }]);

        const zapLink = `https://wa.me/5531988089870?text=${encodeURIComponent(
          `🚨 *NOVO PEDIDO GasSOS*\n\n⛽ *Produto:* ${combustivel}\n👤 *Cliente:* ${nome}\n🚗 *Placa:* ${placa}\n💰 *Valor:* R$ ${total},00\n📍 *Localização:* ${mapaLink}`
        )}`;

        window.open(zapLink, '_blank');
        setEtapa('pagamento');
      } catch (e) {
        alert('Erro ao salvar pedido.');
      } finally {
        setLoading(false);
      }
    });
  };

  const avisarPagamento = async () => {
    await supabase.from('pedidos').update({ status_pagamento: 'pagamento_informado' }).eq('telefone_cliente', telefone);
    alert("Pagamento informado! Aguarde a confirmação.");
  };

  // TELA DE PAGAMENTO (PIX)
  if (etapa === 'pagamento') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md text-center border border-slate-100">
          <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-black italic uppercase italic">Pedido Recebido!</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase mb-6 tracking-widest">Pague para liberar o entregador</p>
          
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Chave PIX (Telefone)</p>
            <p className="text-xl font-black select-all tracking-tighter">(31) 98808-9870</p>
            <p className="text-3xl font-black mt-4 text-slate-900">R$ {total},00</p>
          </div>

          <button onClick={avisarPagamento} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-sm mb-4 shadow-lg active:scale-95 transition-all">
            ✅ JÁ REALIZEI O PAGAMENTO
          </button>
          <button onClick={() => setEtapa('pedido')} className="text-slate-400 text-[10px] font-black uppercase">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* MAPA */}
      <div className="h-[40vh] w-full relative z-0 bg-slate-800">
        {isMounted && (
          <MapContainer center={[coords.lat, coords.lng]} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapContent coords={coords} />
          </MapContainer>
        )}
      </div>

      <div className="flex-1 bg-white rounded-t-[45px] -mt-10 relative z-10 p-6 flex flex-col shadow-2xl">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

        {etapa === 'pedido' ? (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCombustivel('GASOLINA')} className={`p-4 rounded-[28px] border-4 transition-all ${combustivel === 'GASOLINA' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-50 bg-slate-50 opacity-40'}`}>
                  <span className="text-3xl block">⛽</span>
                  <span className="font-black text-xs text-slate-900 italic">GASOLINA</span>
                  <p className="font-black text-sm text-slate-900">R$ {precos.gasolina},00</p>
                </button>
                <button onClick={() => setCombustivel('ETANOL')} className={`p-4 rounded-[28px] border-4 transition-all ${combustivel === 'ETANOL' ? 'border-green-500 bg-green-50' : 'border-slate-50 bg-slate-50 opacity-40'}`}>
                  <span className="text-3xl block">🎋</span>
                  <span className="font-black text-xs text-slate-900 italic">ETANOL</span>
                  <p className="font-black text-sm text-slate-900">R$ {precos.etanol},00</p>
                </button>
             </div>
             <div onClick={() => setPartidaFrio(!partidaFrio)} className={`p-4 rounded-2xl border-2 flex justify-between items-center ${partidaFrio ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>
                <span className="font-black text-[10px] text-slate-600 uppercase italic">❄️ Spray Partida a Frio</span>
                <span className="font-black text-blue-600">+{precos.taxa},00</span>
             </div>
             <button onClick={() => setEtapa('dados')} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase text-sm italic shadow-xl">
               PRÓXIMO PASSO ➔
             </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase text-slate-900">Seus Dados</h2>
            <input placeholder="Nome Completo" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 outline-none" onChange={e => setNome(e.target.value)} />
            <input placeholder="Placa do Veículo" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 outline-none" onChange={e => setPlaca(e.target.value)} />
            <input placeholder="WhatsApp com DDD" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 outline-none" onChange={e => setTelefone(e.target.value)} />
            
            <button onClick={finalizarPedido} disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase text-sm italic disabled:opacity-50">
              {loading ? 'SOLICITANDO...' : `CONFIRMAR R$ ${total},00`}
            </button>
            <button onClick={() => setEtapa('pedido')} className="w-full text-slate-400 text-[10px] font-bold uppercase">Voltar aos combustíveis</button>
          </div>
        )}
      </div>
    </div>
  );
}