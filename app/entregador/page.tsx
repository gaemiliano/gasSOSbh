'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function PainelEntregador() {
  const [pedidos, setPedidos] = useState([]);
  const [ganhosHoje, setGanhosHoje] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [nomeEntregador, setNomeEntregador] = useState('');
  const [lastCount, setLastCount] = useState(0);
  const router = useRouter();
  
  // Som
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('entregador_id');
    const nome = localStorage.getItem('entregador_nome');
    
    // Inicializa o som ao carregar
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    if (!id) {
      router.push('/login-entregador'); 
    } else {
      setNomeEntregador(nome || 'Parceiro');
      carregarDados();
      const intervalo = setInterval(carregarDados, 5000); // Verifica a cada 5s
      return () => clearInterval(intervalo);
    }
  }, []);

  async function carregarDados() {
    const { data: dataPedidos } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status_servico', 'aberto')
      .order('created_at', { ascending: false });
    
    if (dataPedidos) {
        setPedidos(dataPedidos);
        // Toca o som se tiver pedido novo
        if (dataPedidos.length > lastCount) {
            audioRef.current?.play().catch(() => console.log("Toque na tela para liberar o som"));
        }
        setLastCount(dataPedidos.length);
    }

    const hoje = new Date().toISOString().split('T')[0];
    const { data: dataHistorico } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('status_servico', 'concluido')
        .filter('created_at', 'gte', `${hoje}T00:00:00`);
    
    if (dataHistorico) {
        setGanhosHoje(dataHistorico.reduce((acc, curr) => acc + (curr.valor_total || 0), 0)); 
    }
  }

  // --- WHATSAPP REFINADO ---
  const abrirWhatsApp = (telefone, nomeCli, pedido) => {
    const telLimpo = telefone.replace(/\D/g, '');
    
    // MENSAGEM PROFISSIONAL E COMPLETA
    const msg = `Olá *${nomeCli}*! 👋\n\nSou o *${nomeEntregador}* da *GasSOS BH* e recebi seu chamado de emergência.\n\n⛽ *Pedido:* ${pedido.combustivel}\n📍 *Local:* Estou confirmando sua localização.\n\nJá estou me deslocando. Chego em breve! 🏍️💨`;
    
    window.open(`https://wa.me/55${telLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirMapa = (endereco, app) => {
    const urlEndereco = encodeURIComponent(endereco);
    if (app === 'waze') window.open(`https://waze.com/ul?q=${urlEndereco}&navigate=yes`, '_blank');
    else window.open(`https://www.google.com/maps/dir/?api=1&destination=${urlEndereco}`, '_blank');
  };

  async function finalizarServico(pedido) {
    if (!confirm(`Confirmar entrega?`)) return;
    setLoadingId(pedido.id);
    try {
      if (pedido.combustivel.includes('GASOLINA')) await supabase.rpc('decrement_estoque', { item_name: 'GASOLINA', qtd: 5 });
      if (pedido.combustivel.includes('ETANOL')) await supabase.rpc('decrement_estoque', { item_name: 'ETANOL', qtd: 5 });
      if (pedido.combustivel.includes('GALÃO')) await supabase.rpc('decrement_estoque', { item_name: 'GALÃO 5L', qtd: 1 });
      if (pedido.combustivel.includes('SPRAY')) await supabase.rpc('decrement_estoque', { item_name: 'SPRAY DE PARTIDA', qtd: 1 });

      await supabase.from('pedidos').update({ status_servico: 'concluido' }).eq('id', pedido.id);
      carregarDados();
    } catch (err) { alert("Erro: " + err.message); } 
    finally { setLoadingId(null); }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white font-sans pb-20">
      <div className="bg-slate-900 p-6 rounded-[35px] border border-white/5 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500 blur-[50px] opacity-20 rounded-full"></div>
        <div className="flex justify-between items-end relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Minha Carteira (Hoje)</p>
                <h2 className="text-4xl font-black italic text-white">R$ {ganhosHoje},00</h2>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1 justify-end"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online</p>
                <p className="text-xs font-black uppercase text-slate-300 mt-1">{nomeEntregador}</p>
                {/* Botão para ativar som no mobile se necessário */}
                <button onClick={() => audioRef.current?.play()} className="text-[9px] text-slate-600 mt-2 border border-slate-700 px-2 rounded">🔊 Ativar Som</button>
            </div>
        </div>
      </div>

      <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest ml-4 mb-4">Chamados em Aberto ({pedidos.length})</h3>

      <div className="space-y-6">
        {pedidos.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-50">
            <p className="text-4xl mb-4">💤</p>
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Aguardando chamados...</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-slate-900 rounded-[35px] border border-white/10 overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-500"></div>
              <div className="p-6 pl-8">
                <div className="flex justify-between items-start mb-4">
                   <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black rounded-lg uppercase backdrop-blur-md border border-white/10">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   <span className="text-xl font-black text-green-500 italic">R$ {p.valor_total},00</span>
                </div>
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-black italic text-white uppercase leading-none mb-3">{p.combustivel}</h2>
                  <p className="text-xs font-bold uppercase text-slate-300">👤 {p.nome_cliente}</p>
                  <p className="text-xs font-bold uppercase text-yellow-500">🚗 {p.placa_veiculo}</p>
                  <p className="text-[10px] font-black uppercase text-blue-400 mt-2 bg-slate-950 p-3 rounded-xl border border-white/5">📍 {p.localizacao}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => abrirMapa(p.localizacao, 'waze')} className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border border-blue-500/20">🚙 Waze</button>
                    <button onClick={() => abrirMapa(p.localizacao, 'google')} className="bg-white/10 hover:bg-white text-white hover:text-black py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border border-white/10">🗺️ Maps</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   <button onClick={() => abrirWhatsApp(p.telefone_cliente, p.nome_cliente, p)} className="w-full bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase transition-all border border-green-600/30 flex items-center justify-center gap-2">💬 Avisar que estou indo</button>
                  <button onClick={() => finalizarServico(p)} disabled={loadingId === p.id} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">{loadingId === p.id ? 'BAIXANDO ESTOQUE...' : '✅ FINALIZAR ENTREGA'}</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="text-center mt-10">
        <button onClick={() => { localStorage.clear(); router.push('/login-entregador'); }} className="text-[10px] font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest">Sair do Turno</button>
      </div>
    </div>
  );
}