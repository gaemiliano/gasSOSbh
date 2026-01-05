'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Importação dinâmica para evitar erro de SSR (Server Side Rendering)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// Configuração do Supabase
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
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: -19.9167, lng: -43.9345 });
  const [isMounted, setIsMounted] = useState(false);

  const precos = { gasolina: 65, etanol: 55, spray: 15, galao: 30 };
  const total = (combustivel === 'GASOLINA' ? precos.gasolina : precos.etanol) + (partidaFrio ? precos.spray : 0) + (querGalao ? precos.galao : 0);

  // Ícone do Radar Amarelo
  const radarIcon = isMounted ? L.divIcon({
    className: 'radar-container',
    html: `<div class="radar-dot"></div><div class="radar-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }) : null;

  useEffect(() => {
    setIsMounted(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Localização padrão ativada")
      );
    }
  }, []);

  const finalizarPedido = async () => {
    if (!nome || !placa || !telefone) return alert("Preencha todos os campos!");
    setLoading(true);
    
    const { error } = await supabase.from('pedidos').insert([{
      combustivel: `${combustivel}${partidaFrio ? ' + SPRAY' : ''}${querGalao ? ' + GALÃO' : ''}`,
      valor_total: total,
      nome_cliente: nome,
      telefone_cliente: telefone,
      placa_veiculo: placa,
      latitude: coords.lat,
      longitude: coords.lng,
      status_servico: 'aberto'
    }]);

    if (!error) {
      setEtapa('pagamento');
    } else {
      alert("Erro ao enviar chamado. Verifique sua conexão.");
    }
    setLoading(false);
  };

  if (!isMounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      
      <style jsx global>{`
        .yellow-map .leaflet-tile-container { filter: invert(100%) hue-rotate(140deg) brightness(1.1) sepia(100%) saturate(1000%) hue-rotate(15deg); }
        .radar-dot { width: 14px; height: 14px; background: #fbbf24; border-radius: 50%; border: 2px solid #000; position: absolute; box-shadow: 0 0 15px #fbbf24; z-index: 2; }
        .radar-pulse { width: 60px; height: 60px; background: rgba(251, 191, 36, 0.4); border-radius: 50%; position: absolute; top: -23px; left: -23px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.4); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }
        .leaflet-container { background: #050505 !important; }
      `}</style>

      <div className="h-[40vh] relative">
        <MapContainer center={[coords.lat, coords.lng]} zoom={16} zoomControl={false} className="h-full w-full yellow-map">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[coords.lat, coords.lng]} icon={radarIcon!} />
        </MapContainer>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-[1000]" />
      </div>

      <div className="relative z-[1001] -mt-16 px-6 pb-12">
        <header className="mb-8">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">GAS<span className="text-yellow-500">SOS</span></h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mt-1">Radar de Emergência 24h</p>
        </header>

        {etapa === 'pedido' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCombustivel('GASOLINA')} className={`p-6 rounded-[35px] border-2 transition-all ${combustivel === 'GASOLINA' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <p className="font-black italic uppercase text-lg">Gasolina</p>
                <p className="text-yellow-500 font-bold text-xs">R$ 65,00</p>
              </button>
              <button onClick={() => setCombustivel('ETANOL')} className={`p-6 rounded-[35px] border-2 transition-all ${combustivel === 'ETANOL' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <p className="font-black italic uppercase text-lg">Etanol</p>
                <p className="text-green-500 font-bold text-xs">R$ 55,00</p>
              </button>
            </div>

            <div className="space-y-3">
              <div onClick={() => setPartidaFrio(!partidaFrio)} className={`p-5 rounded-[26px] border-2 flex justify-between cursor-pointer transition-all ${partidaFrio ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'}`}>
                <span className="font-black uppercase italic text-[11px] tracking-tighter">❄️ Spray Partida a Frio</span>
                <span className="font-black text-blue-500">+R$ 15</span>
              </div>
              <div onClick={() => setQuerGalao(!querGalao)} className={`p-5 rounded-[26px] border-2 flex justify-between cursor-pointer transition-all ${querGalao ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5'}`}>
                <span className="font-black uppercase italic text-[11px] tracking-tighter">🛢️ Incluir Galão 5L</span>
                <span className="font-black text-yellow-500">+R$ 30</span>
              </div>
            </div>

            <button onClick={() => setEtapa('dados')} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-[0_15px_40px_rgba(234,179,8,0.3)] hover:bg-yellow-400 transition-all">
              SOLICITAR RESGATE AGORA ➔
            </button>
          </div>
        )}

        {etapa === 'dados' && (
          <div className="space-y-4 animate-in fade-in duration-500">
             <input placeholder="TEU NOME" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
             <input placeholder="PLACA DO VEÍCULO" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
             <input placeholder="WHATSAPP (DDD)" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
             
             <div className="bg-white/5 p-7 rounded-[35px] border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1 text-center">Valor Total do Resgate</p>
                <p className="text-5xl font-black italic text-yellow-500 tracking-tighter text-center">R$ {total},00</p>
             </div>

             <button onClick={finalizarPedido} disabled={loading} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-xl">
               {loading ? 'PROCESSANDO...' : 'CONFIRMAR E ENVIAR ➔'}
             </button>
             <button onClick={() => setEtapa('pedido')} className="w-full text-slate-600 text-[10px] font-black uppercase mt-2">Voltar</button>
          </div>
        )}

        {etapa === 'pagamento' && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 pt-6">
            <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_30px_#22c55e]">✓</div>
            <h2 className="text-3xl font-black italic uppercase">Pedido Enviado!</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Pague o PIX para o motoqueiro<br/>ser acionado imediatamente.</p>
            
            <div className="bg-white p-4 rounded-3xl">
                {/* QR Code de exemplo ou Chave PIX */}
                <p className="text-black font-mono text-[10px] break-all p-4 border-2 border-dashed border-slate-200 rounded-xl">
                   00020126360014BR.GOV.BCB.PIX0114SUACHAVEAQUI5204000053039865405{total}.005802BR5913GASSOS_BH6009BELOHORIZONTE62070503***6304D171
                </p>
            </div>

            <button onClick={() => window.location.reload()} className="w-full bg-slate-100 text-black p-5 rounded-2xl font-black uppercase text-sm italic">
                Copiado! Já realizei o pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
