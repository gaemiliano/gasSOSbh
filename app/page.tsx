'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function GasSOSPremium() {
  const [etapa, setEtapa] = useState('loading'); // intro, menu, dados, sucesso, rastreio
  
  // DADOS GERAIS
  const [precos, setPrecos] = useState({ gasolina: 0, etanol: 0, spray: 0, galao: 0 });
  const [disponivel, setDisponivel] = useState({ gasolina: true, etanol: true });
  
  // FORMULÁRIO E PEDIDO
  const [selecao, setSelecao] = useState(null);
  const [extras, setExtras] = useState({ spray: false, galao: false });
  const [form, setForm] = useState({ nome: '', telefone: '', localizacao: '', placa: '', marca: '', modelo: '', obs: '' });
  const [enviando, setEnviando] = useState(false);
  
  // RASTREAMENTO
  const [pedidoAtivo, setPedidoAtivo] = useState(null);

  // --- 1. INICIALIZAÇÃO INTELIGENTE ---
  useEffect(() => {
    verificarPedidoAtivo();
    buscarDadosEstoque();
    
    // Realtime do Estoque
    const canalEstoque = supabase.channel('estoque-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, buscarDadosEstoque).subscribe();
    
    return () => { supabase.removeChannel(canalEstoque); };
  }, []);

  // --- 2. VERIFICA SE JÁ TEM PEDIDO (MEMÓRIA) ---
  async function verificarPedidoAtivo() {
    const idSalvo = localStorage.getItem('gassos_pedido_id');
    if (idSalvo) {
        // Busca o status atual desse pedido
        const { data } = await supabase.from('pedidos').select('*').eq('id', idSalvo).single();
        if (data && data.status_servico !== 'concluido') {
            setPedidoAtivo(data);
            setEtapa('rastreio'); // Joga direto pro rastreio
            ativarMonitoramentoPedido(idSalvo);
        } else {
            // Se já acabou ou não existe, limpa e vai pra intro
            localStorage.removeItem('gassos_pedido_id');
            setEtapa('intro');
        }
    } else {
        setEtapa('intro');
    }
  }

  // --- 3. MONITORA MUDANÇAS NO PEDIDO (REALTIME) ---
  function ativarMonitoramentoPedido(id) {
    const canalPedido = supabase
      .channel(`pedido-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, (payload) => {
         setPedidoAtivo(payload.new);
         if (payload.new.status_servico === 'concluido') {
             alert("Seu pedido foi finalizado! Obrigado.");
             localStorage.removeItem('gassos_pedido_id');
             window.location.reload();
         }
      })
      .subscribe();
  }

  // --- BUSCA DADOS ESTOQUE ---
  async function buscarDadosEstoque() {
    const { data } = await supabase.from('estoque').select('*');
    if (data) {
      const p = { gasolina: 0, etanol: 0, spray: 0, galao: 0 };
      const d = { gasolina: true, etanol: true };
      data.forEach(item => {
        const val = Number(item.preco);
        const qtd = Number(item.quantidade);
        if (item.item.includes('GASOLINA')) { p.gasolina = val; if(qtd < 5) d.gasolina = false; }
        if (item.item.includes('ETANOL')) { p.etanol = val; if(qtd < 5) d.etanol = false; }
        if (item.item.includes('SPRAY')) p.spray = val;
        if (item.item.includes('GALÃO')) p.galao = val;
      });
      setPrecos(p);
      setDisponivel(d);
    }
  }

  // --- CÁLCULOS ---
  const valorCombustivel = selecao === 'GASOLINA' ? precos.gasolina : (selecao === 'ETANOL' ? precos.etanol : 0);
  const total = valorCombustivel + (extras.spray ? precos.spray : 0) + (extras.galao ? precos.galao : 0);

  // --- ENVIO DO PEDIDO ---
  const confirmarPedido = async () => {
    if (!form.nome || !form.telefone || !form.localizacao || !form.placa || !form.marca || !form.modelo) {
        return alert("Por favor, preencha os dados do veículo e endereço!");
    }
    setEnviando(true);
    let produtoFinal = selecao;
    if (extras.galao) produtoFinal += ' + GALÃO 5L';
    if (extras.spray) produtoFinal += ' + SPRAY';

    const localizacaoCompleta = `${form.localizacao} (${form.obs || 'Sem obs'})`;
    const veiculoCompleto = `${form.marca} ${form.modelo} - ${form.placa}`;

    const { data, error } = await supabase.from('pedidos').insert([{
      combustivel: produtoFinal,
      valor_total: total,
      nome_cliente: form.nome,
      telefone_cliente: form.telefone,
      placa_veiculo: veiculoCompleto,
      localizacao: localizacaoCompleta,
      status_servico: 'aberto'
    }]).select().single();

    setEnviando(false);

    if (!error && data) {
        setPedidoAtivo(data);
        setEtapa('sucesso');
    } else {
        alert("Erro ao pedir: " + (error?.message || "Erro desconhecido"));
    }
  };

  // --- AÇÃO "JÁ PAGUEI" ---
  const confirmarPagamentoEIrParaRastreio = () => {
      if (pedidoAtivo) {
          localStorage.setItem('gassos_pedido_id', pedidoAtivo.id); // SALVA NA MEMÓRIA
          ativarMonitoramentoPedido(pedidoAtivo.id);
          setEtapa('rastreio');
      }
  };

  if (etapa === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative selection:bg-yellow-500 selection:text-black flex flex-col">
      <div className="fixed top-[-20%] left-[-20%] w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <style jsx global>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); transform: scale(1); }
          70% { box-shadow: 0 0 0 30px rgba(234, 179, 8, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); transform: scale(1); }
        }
        .btn-sos { animation: pulse-glow 2s infinite; }
        .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass-input { background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255, 255, 255, 0.15); }
        .padding-footer { padding-bottom: 180px; } 
      `}</style>

      {/* HEADER */}
      <header className="px-6 py-4 flex justify-between items-center relative z-10 bg-black/50 backdrop-blur-md border-b border-white/5 sticky top-0">
        <div><h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Gas<span className="text-yellow-500">SOS</span></h1></div>
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${etapa === 'rastreio' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
            <span className="text-[10px] font-bold uppercase text-slate-400">{etapa === 'rastreio' ? 'Acompanhamento' : 'BH e Região'}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        
        {/* TELA 1: INTRO */}
        {etapa === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-700 p-6">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl font-black uppercase italic leading-tight text-white">Acabou o<br/>Combustível?</h2>
                <p className="text-yellow-500 text-sm font-black uppercase tracking-widest bg-yellow-500/10 px-4 py-2 rounded-full inline-block border border-yellow-500/20">Nós levamos até você</p>
            </div>
            <button onClick={() => setEtapa('menu')} className="w-52 h-52 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(234,179,8,0.3)] btn-sos active:scale-95 transition-all border-4 border-yellow-300/20">
                <span className="text-7xl font-black italic text-black drop-shadow-sm">SOS</span>
                <span className="text-[10px] font-black uppercase text-black/70 mt-1">Pedir Agora</span>
            </button>
          </div>
        )}

        {/* TELA 2: MENU */}
        {etapa === 'menu' && (
          <div className="animate-in slide-in-from-bottom duration-500 p-6 space-y-6">
            <button onClick={() => setEtapa('intro')} className="text-xs font-bold text-slate-500 uppercase hover:text-white flex items-center gap-1">← Voltar</button>
            <h2 className="text-2xl font-black italic uppercase text-center mb-6">Selecione o Serviço</h2>
            <button onClick={() => { setSelecao('GASOLINA'); setEtapa('dados'); }} disabled={!disponivel.gasolina} className={`w-full glass-card p-6 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all ${!disponivel.gasolina && 'opacity-30 grayscale'}`}>
                <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-2xl border border-yellow-500/20">⛽</div><div className="text-left"><p className="text-lg font-black italic uppercase">Gasolina</p><p className="text-[10px] font-bold text-slate-400 uppercase">Resgate Completo</p></div></div>
                <div className="text-right"><p className="text-[10px] font-bold text-slate-500 uppercase">A partir de</p><p className="text-2xl font-black text-yellow-500 italic">R$ {precos.gasolina}</p></div>
            </button>
            <button onClick={() => { setSelecao('ETANOL'); setEtapa('dados'); }} disabled={!disponivel.etanol} className={`w-full glass-card p-6 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all ${!disponivel.etanol && 'opacity-30 grayscale'}`}>
                <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-2xl border border-green-500/20">🌿</div><div className="text-left"><p className="text-lg font-black italic uppercase">Etanol</p><p className="text-[10px] font-bold text-slate-400 uppercase">Resgate Completo</p></div></div>
                <div className="text-right"><p className="text-[10px] font-bold text-slate-500 uppercase">A partir de</p><p className="text-2xl font-black text-green-500 italic">R$ {precos.etanol}</p></div>
            </button>
          </div>
        )}

        {/* TELA 3: DADOS */}
        {etapa === 'dados' && (
          <div className="animate-in slide-in-from-right duration-500 flex flex-col h-full">
            <div className="p-6 space-y-4 overflow-y-auto padding-footer">
                <button onClick={() => setEtapa('menu')} className="text-xs font-bold text-slate-500 uppercase hover:text-white mb-2">← Voltar</button>
                
                <h3 className="text-sm font-black text-white uppercase border-l-4 border-yellow-500 pl-3">Onde vamos te encontrar?</h3>
                <div className="space-y-3">
                    <input placeholder="SEU ENDEREÇO (Rua, Nº, Bairro)" value={form.localizacao} onChange={e => setForm({...form, localizacao: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                    <input placeholder="PONTO DE REFERÊNCIA / OBS" value={form.obs} onChange={e => setForm({...form, obs: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                </div>

                <h3 className="text-sm font-black text-white uppercase border-l-4 border-yellow-500 pl-3 mt-4">Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input placeholder="MARCA" value={form.marca} onChange={e => setForm({...form, marca: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                    <input placeholder="MODELO" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                </div>
                <input placeholder="PLACA DO VEÍCULO" value={form.placa} onChange={e => setForm({...form, placa: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />

                <h3 className="text-sm font-black text-white uppercase border-l-4 border-yellow-500 pl-3 mt-4">Seu Contato</h3>
                <div className="space-y-3">
                    <input placeholder="SEU NOME" value={form.nome} onChange={e => setForm({...form, nome: e.target.value.toUpperCase()})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                    <input placeholder="WHATSAPP (DDD)" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="w-full p-4 rounded-xl glass-input text-white font-bold outline-none uppercase placeholder:text-slate-600 text-xs" />
                </div>

                <h3 className="text-sm font-black text-white uppercase border-l-4 border-yellow-500 pl-3 mt-4">Adicionais</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setExtras({...extras, spray: !extras.spray})} className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${extras.spray ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/10'}`}><p className="text-[10px] font-bold uppercase text-slate-300 mb-1">Spray Partida</p><p className="text-sm font-black text-blue-400">+R$ {precos.spray}</p></div>
                    <div onClick={() => setExtras({...extras, galao: !extras.galao})} className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${extras.galao ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/5 border-white/10'}`}><p className="text-[10px] font-bold uppercase text-slate-300 mb-1">Galão Extra</p><p className="text-sm font-black text-yellow-500">+R$ {precos.galao}</p></div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 w-full p-6 bg-[#0a0a0a] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50">
                <div className="flex justify-between items-center mb-4">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total a Pagar</p><p className="text-xs text-slate-500 font-bold uppercase">{selecao} + Taxas</p></div>
                    <span className="text-4xl font-black text-yellow-500 italic tracking-tighter">R$ {total},00</span>
                </div>
                <button onClick={confirmarPedido} disabled={enviando} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black p-5 rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all">{enviando ? 'ENVIANDO...' : 'CHAMAR SOCORRO ➔'}</button>
            </div>
          </div>
        )}

        {/* TELA 4: PAGAMENTO PIX */}
        {etapa === 'sucesso' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in text-center p-6">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_40px_rgba(34,197,94,0.5)]">✓</div>
             <h2 className="text-3xl font-black italic uppercase mb-2">Pedido Criado!</h2>
             <p className="text-slate-400 text-xs font-bold uppercase mb-8">Faça o PIX para liberar o deslocamento.</p>

             <div className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl mb-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Chave PIX (Copia e Cola)</p>
                <div className="bg-black p-3 rounded-xl mb-4 font-mono text-[9px] text-slate-300 break-all border border-white/10">
                  00020126360014BR.GOV.BCB.PIX0114SUACHAVEAQUI5204000053039865405{total}.00
                </div>
                <button onClick={() => navigator.clipboard.writeText(`00020126360014BR.GOV.BCB.PIX0114SUACHAVEAQUI5204000053039865405${total}.00`)} className="bg-white/10 px-6 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/20">Copiar Código</button>
             </div>
             {/* AQUI ESTÁ A MUDANÇA: O BOTÃO LEVA PARA O RASTREIO */}
             <button onClick={confirmarPagamentoEIrParaRastreio} className="bg-yellow-500 text-black w-full p-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">JÁ PAGUEI (ACOMPANHAR)</button>
          </div>
        )}

        {/* TELA 5: RASTREIO (STATUS) */}
        {etapa === 'rastreio' && pedidoAtivo && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in p-6 text-center space-y-8">
                
                {/* STATUS ATUAL */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 rounded-full"></div>
                    <div className="w-40 h-40 bg-slate-900 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                         <span className="text-6xl animate-pulse">🏍️</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">Status do Pedido</p>
                    <h2 className="text-3xl font-black italic uppercase text-white">
                        {pedidoAtivo.status_servico === 'aberto' ? 'Procurando Entregador...' : 'Entregador a Caminho!'}
                    </h2>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto">
                        {pedidoAtivo.status_servico === 'aberto' 
                            ? 'Aguarde, estamos localizando o parceiro mais próximo da sua localização.' 
                            : 'O parceiro aceitou sua corrida e já está se deslocando até o endereço.'}
                    </p>
                </div>

                {/* DETALHES FIXOS */}
                <div className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Seu Pedido</span>
                        <span className="text-sm font-black text-white uppercase">{pedidoAtivo.combustivel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">Local</span>
                         <span className="text-[10px] font-black text-yellow-500 uppercase text-right w-1/2">{pedidoAtivo.localizacao}</span>
                    </div>
                </div>

                <div className="pt-10">
                    <button onClick={() => window.open(`https://wa.me/5531SEU_NUMERO_AQUI`, '_blank')} className="text-xs font-bold text-slate-500 uppercase hover:text-white border border-white/10 px-6 py-3 rounded-full">Preciso de Ajuda / Suporte</button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}