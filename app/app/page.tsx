'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// Carregamos o Mapa de forma dinâmica em uma função simples para não dar erro
const MapComponent = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { MapContainer, TileLayer, Marker } = mod;
    return function Map({ lat, lng, icon }: any) {
      return (
        <MapContainer center={[lat, lng]} zoom={16} zoomControl={false} className="h-full w-full yellow-map">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {icon && <Marker position={[lat, lng]} icon={icon} />}
        </MapContainer>
      );
    };
  }),
  { ssr: false }
);

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function GasSOS() {
  const [etapa, setEtapa] = useState<'pedido' | 'dados' | 'pagamento'>('pedido');
  const [combustivel, setCombustivel] = useState('GASOLINA');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [querGalao, setQuerGalao] = useState(false);
  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [coords, setCoords] = useState({ lat: -19.9167, lng: -43.9345 });
  const [isMounted, setIsMounted] = useState(false);
  const [radarIcon, setRadarIcon] = useState<any>(null);

  const total = (combustivel === 'GASOLINA' ? 65 : 55) + (partidaFrio ? 15 : 0) + (querGalao ? 30 : 0);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');
      setRadarIcon(L.divIcon({
        className: 'radar-container',
        html: `<div class="radar-dot"></div><div class="radar-pulse"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10]
      }));
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => 
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      );
    }
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      <style jsx global>{`
        .yellow-map .leaflet-tile-container { filter: invert(100%) hue-rotate(140deg) brightness(1.1) sepia(100%) saturate(1000%) hue-rotate(15deg) !important; }
        .radar-dot { width: 14px; height: 14px; background: #fbbf24; border-radius: 50%; border: 2px solid #000; position: absolute; box-shadow: 0 0 15px #fbbf24; z-index: 2; }
        .radar-pulse { width: 60px; height: 60px; background: rgba(251, 191, 36, 0.4); border-radius: 50%; position: absolute; top: -23px; left: -23px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }
        .leaflet-container { background: #050505 !important; border: none !important; height: 100%; width: 100%; }
      `}</style>

      <div className="h-[42vh] relative">
        <MapComponent lat={coords.lat} lng={coords.lng} icon={radarIcon} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-[1000] pointer-events-none" />
      </div>

      <div className="relative z-[1001] -mt-20 px-6 pb-12">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">GAS<span className="text-yellow-500">SOS</span></h1>
        
        {etapa === 'pedido' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCombustivel('GASOLINA')} className={`p-6 rounded-[35px] border-2 transition-all ${combustivel === 'GASOLINA' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <p className="font-black italic text-lg uppercase">Gasolina</p>
                <p className="text-yellow-500 font-bold text-xs">R$ 65,00</p>
              </button>
              <button onClick={() => setCombustivel('ETANOL')} className={`p-6 rounded-[35px] border-2 transition-all ${combustivel === 'ETANOL' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <p className="font-black italic text-lg uppercase">Etanol</p>
                <p className="text-green-500 font-bold text-xs">R$ 55,00</p>
              </button>
            </div>

            <div className="space-y-3">
               <div onClick={() => setPartidaFrio(!partidaFrio)} className={`p-5 rounded-2xl border-2 flex justify-between cursor-pointer ${partidaFrio ? 'border-blue-500 bg-blue-500/10' : 'border-white/5'}`}>
                 <span className="font-black italic text-xs uppercase text-slate-300">❄️ Spray Partida a Frio</span>
                 <span className="font-black text-blue-400">+R$ 15</span>
               </div>
               <div onClick={() => setQuerGalao(!querGalao)} className={`p-5 rounded-2xl border-2 flex justify-between cursor-pointer ${querGalao ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5'}`}>
                 <span className="font-black italic text-xs uppercase text-slate-300">🛢️ Incluir Galão 5L</span>
                 <span className="font-black text-yellow-500">+R$ 30</span>
               </div>
            </div>

            <button onClick={() => setEtapa('dados')} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-[0_15px_40px_rgba(234,179,8,0.4)]">
              ACIONAR RESGATE AGORA ➔
            </button>
          </div>
        )}

        {etapa === 'dados' && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
             <input placeholder="TEU NOME" value={nome} onChange={e => setNome(e.target.value.toUpperCase())} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase placeholder:text-slate-600" />
             <input placeholder="PLACA" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase placeholder:text-slate-600" />
             <input placeholder="WHATSAPP" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase placeholder:text-slate-600" />
             <div className="bg-white/5 p-7 rounded-[35px] border border-white/10 text-center">
                <p className="text-4xl font-black italic text-yellow-500">R$ {total},00</p>
             </div>
             <button onClick={() => setEtapa('pagamento')} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-xl">CONFIRMAR RESGATE ➔</button>
          </div>
        )}
      </div>
    </div>
  );
}