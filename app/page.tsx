'use client';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase Blindado
const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function GasSOS() {
  const [etapa, setEtapa] = useState('pedido');
  const [combustivel, setCombustivel] = useState('GASOLINA');
  const [partidaFrio, setPartidaFrio] = useState(false);
  const [querGalao, setQuerGalao] = useState(false);
  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  // Lógica de Preços Completa
  const precos = { gasolina: 65, etanol: 55, spray: 15, galao: 30 };
  const total = (combustivel === 'GASOLINA' ? precos.gasolina : precos.etanol) + (partidaFrio ? precos.spray : 0) + (querGalao ? precos.galao : 0);

  const finalizarPedido = async () => {
    if (!nome || !placa || !telefone) return alert("Por favor, preencha todos os campos!");
    setLoading(true);
    
    const { error } = await supabase.from('pedidos').insert([{
      combustivel: `${combustivel}${partidaFrio ? ' + SPRAY' : ''}${querGalao ? ' + GALÃO' : ''}`,
      valor_total: total,
      nome_cliente: nome,
      telefone_cliente: telefone,
      placa_veiculo: placa,
      status_servico: 'aberto'
    }]);

    if (!error) {
      setEtapa('pagamento');
    } else {
      alert("Erro ao conectar com o servidor. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 selection:bg-yellow-500">
      <style jsx global>{`
        .radar-container { width: 160px; height: 160px; border: 1px solid rgba(251,191,36,0.2); border-radius: 50%; position: relative; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; }
        .radar-sweep { width: 50%; height: 50%; background: linear-gradient(45deg, transparent 50%, rgba(251,191,36,0.3) 100%); position: absolute; top: 0; right: 0; transform-origin: bottom left; animation: radar-anim 4s linear infinite; border-right: 2px solid #fbbf24; }
        @keyframes radar-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER TECH COM RADAR */}
      <div className="flex flex-col items-center pt-10">
        <div className="radar-container">
          <div className="radar-sweep"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_15px_#fbbf24] animate-pulse"></div>
        </div>
        <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">GAS<span className="text-yellow-500">SOS</span></h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mt-2">Emergência BH 24h</p>
      </div>

      <div className="max-w-md mx-auto mt-10">
        {etapa === 'pedido' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-2 gap-4">
              {/* BOTÃO GASOLINA COM ÍCONE */}
              <button onClick={() => setCombustivel('GASOLINA')} className={`p-6 rounded-[35px] border-2 transition-all flex flex-col items-center gap-2 ${combustivel === 'GASOLINA' ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <span className="text-3xl">⛽</span>
                <p className="font-black italic uppercase">Gasolina</p>
                <p className="text-yellow-500 font-bold text-xs italic">R$ 65,00</p>
              </button>
              {/* BOTÃO ETANOL COM ÍCONE */}
              <button onClick={() => setCombustivel('ETANOL')} className={`p-6 rounded-[35px] border-2 transition-all flex flex-col items-center gap-2 ${combustivel === 'ETANOL' ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                <span className="text-3xl">🌿</span>
                <p className="font-black italic uppercase">Etanol</p>
                <p className="text-green-500 font-bold text-xs italic">R$ 55,00</p>
              </button>
            </div>

            <div className="space-y-3">
              <div onClick={() => setPartidaFrio(!partidaFrio)} className={`p-5 rounded-2xl border-2 flex justify-between cursor-pointer transition-all ${partidaFrio ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'}`}>
                <span className="font-black uppercase italic text-[10px] tracking-widest text-slate-300">❄️ Spray Partida a Frio</span>
                <span className="font-black text-blue-500">+R$ 15</span>
              </div>
              <div onClick={() => setQuerGalao(!querGalao)} className={`p-5 rounded-2xl border-2 flex justify-between cursor-pointer transition-all ${querGalao ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/5'}`}>
                <span className="font-black uppercase italic text-[10px] tracking-widest text-slate-300">🛢️ Incluir Galão 5L</span>
                <span className="font-black text-yellow-500">+R$ 30</span>
              </div>
            </div>

            <button onClick={() => setEtapa('dados')} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-[0_15px_40px_rgba(234,179,8,0.4)]">
              SOLICITAR RESGATE AGORA ➔
            </button>
          </div>
        )}

        {etapa === 'dados' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <input placeholder="TEU NOME" value={nome} onChange={e => setNome(e.target.value.toUpperCase())} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
            <input placeholder="PLACA DO VEÍCULO" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
            <input placeholder="WHATSAPP (DDD)" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-5 bg-white/5 border-2 border-white/5 rounded-2xl outline-none focus:border-yellow-500 font-bold uppercase" />
            
            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 text-center">
              <p className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest mb-1 italic">Total do Resgate</p>
              <p className="text-5xl font-black italic text-yellow-500 tracking-tighter">R$ {total},00</p>
            </div>

            <button onClick={finalizarPedido} disabled={loading} className="w-full bg-yellow-500 text-black p-6 rounded-[30px] font-black uppercase italic shadow-xl">
              {loading ? 'ENVIANDO...' : 'CONFIRMAR RESGATE ➔'}
            </button>
            <button onClick={() => setEtapa('pedido')} className="w-full text-slate-600 text-[10px] font-black uppercase mt-4 text-center">Voltar</button>
          </div>
        )}

        {etapa === 'pagamento' && (
          <div className="text-center space-y-6 pt-6 animate-in zoom-in">
            <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_30px_#22c55e]">✓</div>
            <h2 className="text-3xl font-black italic uppercase">Chamado Ativo!</h2>
            <div className="bg-white p-6 rounded-3xl text-black font-mono text-[10px] break-all">
              00020126360014BR.GOV.BCB.PIX0114SUACHAVEAQUI5204000053039865405{total}.00
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-slate-100 text-black p-5 rounded-2xl font-black uppercase text-sm italic">
                Já realizei o pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}