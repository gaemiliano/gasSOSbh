'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Importação do Mapa Real
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuração do ícone do marcador (correção de bug do Leaflet)
const icon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Componente para centralizar o mapa automaticamente no GPS
function RecenterMap({ coords }: { coords: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 16);
  }, [coords, map]);
  return null;
}

export default function GasSOS() {
  const [etapa, setEtapa] = useState<'pedido' | 'pagamento'>('pedido');
  const [combustivel, setCombustivel] = useState('gasolina');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [precos, setPrecos] = useState({ gasolina: 65, etanol: 55, taxa: 15 });
  const [loading, setLoading] = useState(false);
  // Coordenadas padrão (Centro de BH) caso o GPS demore
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -19.9167,
    lng: -43.9345,
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Aguardando permissão de GPS...')
      );
    }
  }, []);

  useEffect(() => {
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

  const total =
    (combustivel === 'gasolina' ? precos.gasolina : precos.etanol) +
    (partidaFrio ? precos.taxa : 0);

  const finalizarPedido = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const mapaLink = `https://www.google.com/maps?q=${lat},${lng}`;

      try {
        await supabase.from('pedidos').insert([
          {
            combustivel: combustivel.toUpperCase(),
            valor_total: total,
            status: 'aguardando_pagamento',
            ponto_proximo: mapaLink,
          },
        ]);

        const zapLink = `https://wa.me/5531988089870?text=${encodeURIComponent(
          `🚨 *NOVO PEDIDO GasSOS*\n\n⛽ *Produto:* ${combustivel.toUpperCase()}\n💰 *Valor:* R$ ${total},00\n📍 *Localização:* ${mapaLink}`
        )}`;

        window.open(zapLink, '_blank');
        setEtapa('pagamento');
      } catch (error) {
        alert('Erro no banco de dados.');
      } finally {
        setLoading(false);
      }
    });
  };

  if (etapa === 'pagamento') {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg animate-bounce">
            ✓
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Pedido Pronto!
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 mb-8">
            Pague o PIX para liberar o socorro
          </p>
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">
              Código PIX
            </p>
            <div className="bg-white p-4 rounded-xl text-[10px] font-mono break-all text-slate-600 border border-slate-100">
              00020126360014BR.GOV.BCB.PIX0114+55319880898705204000053039865405
              {total}.00
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `00020126360014BR.GOV.BCB.PIX0114+55319880898705204000053039865405${total}.00`
              );
              alert('Copiado!');
            }}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase mb-4 shadow-xl"
          >
            Copiar PIX
          </button>
          <button
            onClick={() => setEtapa('pedido')}
            className="text-slate-400 text-[10px] font-black uppercase"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* MAPA REAL DINÂMICO */}
      <div className="h-[45vh] w-full relative z-0">
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={16}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[coords.lat, coords.lng]} icon={icon} />
          <RecenterMap coords={coords} />
        </MapContainer>

        {/* Overlay do Header */}
        <div className="absolute top-6 left-6 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <h1 className="text-sm font-black tracking-tighter italic uppercase">
            GasSOS <span className="text-yellow-500">Belo Horizonte</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[45px] -mt-10 relative z-10 p-8 flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCombustivel('gasolina')}
              className={`p-6 rounded-[32px] border-4 transition-all ${
                combustivel === 'gasolina'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-slate-50 bg-slate-50 opacity-40'
              }`}
            >
              <span className="text-4xl block mb-2">⛽</span>
              <span className="font-black text-[10px] uppercase text-slate-500">
                Gasolina
              </span>
              <p className="font-black text-lg text-slate-900 italic">
                R$ {precos.gasolina},00
              </p>
            </button>
            <button
              onClick={() => setCombustivel('etanol')}
              className={`p-6 rounded-[32px] border-4 transition-all ${
                combustivel === 'etanol'
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-50 bg-slate-50 opacity-40'
              }`}
            >
              <span className="text-4xl block mb-2">🎋</span>
              <span className="font-black text-[10px] uppercase text-slate-500">
                Etanol
              </span>
              <p className="font-black text-lg text-slate-900 italic">
                R$ {precos.etanol},00
              </p>
            </button>
          </div>
          <div
            onClick={() => setPartidaFrio(!partidaFrio)}
            className={`p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${
              partidaFrio
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-100 bg-slate-50 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl">❄️</span>
              <div className="text-left">
                <p className="font-black text-[10px] uppercase italic">
                  Partida a Frio
                </p>
                <p className="text-[8px] font-bold opacity-60">
                  ESSENCIAL NO INVERNO
                </p>
              </div>
            </div>
            <span className="font-black">+{precos.taxa},00</span>
          </div>
        </div>

        <button
          onClick={finalizarPedido}
          disabled={loading}
          className="w-full bg-slate-900 text-white mt-8 py-6 rounded-[24px] shadow-2xl font-black text-lg tracking-[0.2em] uppercase italic active:scale-95 transition-all flex justify-between px-10 items-center disabled:opacity-50"
        >
          <span>{loading ? 'OBTENDO GPS...' : 'SOLICITAR SOS'}</span>
          {!loading && (
            <span className="text-yellow-400 font-mono">R$ {total},00</span>
          )}
        </button>
      </div>
    </div>
  );
}
