'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

import 'leaflet/dist/leaflet.css';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function GasSOS() {
  const [etapa, setEtapa] = useState<'pedido' | 'dados' | 'pagamento'>('pedido');
  const [combustivel, setCombustivel] = useState('GASOLINA');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [querGalao, setQuerGalao] = useState(false);
  const [coords, setCoords] = useState({ lat: -19.9167, lng: -43.9345 });
  const [isMounted, setIsMounted] = useState(false);

  // Ícone de Radar Amarelo
  const radarIcon = isMounted ? L.divIcon({
    className: 'radar-container',
    html: `
      <div class="radar-dot"></div>
      <div class="radar-pulse"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }) : null;

  useEffect(() => {
    setIsMounted(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const precos = { gasolina: 65, etanol: 55, spray: 15, galao: 30 };
  const total = (combustivel === 'GASOLINA' ? precos.gasolina : precos.etanol) + 
                (partidaFrio ? precos.spray : 0) + (querGalao ? precos.galao : 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      
      {/* ESTILOS CSS PARA MAPA AMARELO E RADAR */}
      <style jsx global>{`
        /* Deixa as linhas do mapa amareladas/neon */
        .yellow-map {
          filter: invert(100%) hue-rotate(150deg) brightness(1.2) saturate(0.8) sepia(100%) saturate(1000%) hue-rotate(10deg);
        }
        .radar-dot {
          width: 14px;
          height: 14px;
          background-color: #eab308;
          border-radius: 50%;
          border: 2px solid #000;
          position: absolute;
          z-index: 2;
          box-shadow: 0 0 15px #eab308;
        }
        .radar-pulse {
          width: 50px;
          height: 50px;
          background-color: rgba(234, 179, 8, 0.4);
          border-radius: 50%;
          position: absolute;
          top: -18px;
          left: -18px;
          animation: pulse-radar 2s infinite;
          z-index: 1;
        }
        @keyframes pulse-radar {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .leaflet-container { background: #050505 !important; }
      `}</style>

      {/* MAPA PREMIUM AMARELO */}
      <div className="h-[42vh] w-full relative">
        {isMounted && (
          <MapContainer center={[coords.lat, coords.lng]} zoom={16} zoomControl={false} className="h-full w-full yellow-map">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[coords.lat, coords.lng]} icon={radarIcon!} />
          </MapContainer>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-[1000] pointer-events-none" />
      </div>

      <div className="relative z-[1001] -mt-20 px-6 pb-12">
        
        {/* LOGO */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-white">
              GAS<span className="text-yellow-500 shadow-yellow-500/50">SOS</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">ACABOU COMBUSTÍVEL?</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black text-yellow-500 uppercase italic animate-pulse">Localizado</span>
          </div>
        </div>

        {etapa === 'pedido' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCombustivel('GASOLINA')} className={`relative p-6 rounded-[35px] border-2 transition-all duration-300 ${combustivel === 'GASOLINA' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <span className="text-2xl block mb-2">⛽</span>
                <p className="font-black italic uppercase text-lg">Gasolina</p>
                <p className="text-[10px] font-bold text-yellow-500">R$ {precos.gasolina},00</p>
              </button>

              <button onClick={() => setCombustivel('ETANOL')} className={`relative p-6 rounded-[35px] border-2 transition-all duration-300 ${combustivel === 'ETANOL' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <span className="text-2xl block mb-2">⛽</span>
                <p className="font-black italic uppercase text-lg">Etanol</p>
                <p className="text-[10px] font-bold text-green-500">R$ {precos.etanol},00</p>
              </button>
            </div>

            <div className="space-y-3">
              <div onClick={() => setPartidaFrio(!partidaFrio)} className={`p-5 rounded-[26px] border-2 flex justify-between items-center transition-all cursor-pointer ${partidaFrio ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                <span className="text-[11px] font-black uppercase italic tracking-tighter">❄️ Spray Partida a Frio</span>
                <span className="font-black text-xs">+{precos.spray},00</span>
              </div>

              <div onClick={() => setQuerGalao(!querGalao)} className={`p-5 rounded-[26px] border-2 flex justify-between items-center transition-all cursor-pointer ${querGalao ? 'border-yellow-500 bg-yellow-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                <span className="text-[11px] font-black uppercase italic tracking-tighter">🛢️ Incluir Galão (5L)</span>
                <span className="font-black text-xs text-yellow-500">+{precos.galao},00</span>
              </div>
            </div>

            <button onClick={() => setEtapa('dados')} className="w-full bg-yellow-500 text-black p-6 rounded-[28px] font-black uppercase italic tracking-widest shadow-[0_20px_50px_rgba(234,179,8,0.3)] flex justify-between items-center">
              <span className="text-sm">SOLICITAR RESGATE AGORA!</span>
              <span className="text-2xl font-normal">➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}