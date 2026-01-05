'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Importamos o "dynamic" do Next.js
import dynamic from 'next/dynamic';

// 1. IMPORTAÇÃO DINÂMICA (Isso resolve o erro 'window is not defined')
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

// Importamos o CSS do Leaflet normalmente
import 'leaflet/dist/leaflet.css';

// Componente interno que usa o mapa (também deve ser tratado com cuidado)
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
  // ... (mantenha seus estados e useEffects de preços e GPS aqui)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -19.9167,
    lng: -43.9345,
  });
  const [isMounted, setIsMounted] = useState(false);

  // 2. Só permite renderizar o mapa após o componente "montar" no navegador
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ... (sua função finalizarPedido e lógica do total)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* MAPA REAL DINÂMICO */}
      <div className="h-[45vh] w-full relative z-0 bg-slate-800">
        {isMounted && (
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={16}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapContent coords={coords} />
          </MapContainer>
        )}
      </div>

      {/* ... (resto do seu código do Painel de Seleção) */}
    </div>
  );
}
