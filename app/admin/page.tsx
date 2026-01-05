'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPanel() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [autorizado, setAutorizado] = useState(false);
  const [aba, setAba] = useState<'precos' | 'pedidos'>('precos');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (autorizado) {
      fetchPrecos();
      fetchPedidos();
    }
  }, [autorizado]);

  async function fetchPrecos() {
    const { data } = await supabase.from('produtos').select('*').order('id', { ascending: true });
    if (data) setProdutos(data);
  }

  async function fetchPedidos() {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setPedidos(data);
  }

  async function atualizarPreco(id: number, novoPreco: string) {
    const valor = parseFloat(novoPreco.replace(',', '.'));
    const { error } = await supabase.from('produtos').update({ preco: valor }).eq('id', id);
    if (!error) {
      setMensagem('✅ Preço Atualizado!');
      fetchPrecos();
      setTimeout(() => setMensagem(''), 2000);
    }
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <h1 className="text-2xl font-black mb-6">Acesso Administrativo</h1>
          <input 
            type="password" 
            placeholder="Senha de Acesso" 
            className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 text-center text-xl outline-none focus:border-yellow-500 font-black"
            onChange={(e) => e.target.value === '1234' && setAutorizado(true)}
          />
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Painel de Controle GasSOS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter italic">Painel GasSOS BH</h1>
          {mensagem && <p className="text-yellow-400 text-sm font-bold mt-2 animate-bounce">{mensagem}</p>}
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b">
          <button 
            onClick={() => setAba('precos')}
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest ${aba === 'precos' ? 'bg-white text-slate-900 border-b-4 border-yellow-500' : 'bg-slate-50 text-slate-400'}`}
          >
            💰 Preços
          </button>
          <button 
            onClick={() => setAba('pedidos')}
            className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest ${aba === 'pedidos' ? 'bg-white text-slate-900 border-b-4 border-yellow-500' : 'bg-slate-50 text-slate-400'}`}
          >
            📋 Pedidos
          </button>
        </div>

        {/* Conteúdo Aba Preços */}
        {aba === 'precos' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-300">
            {produtos.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.nome}</label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-slate-300 text-2xl font-mono">R$</span>
                  <input 
                    type="number" 
                    defaultValue={p.preco}
                    onBlur={(e) => atualizarPreco(p.id, e.target.value)}
                    className="w-full bg-white p-3 rounded-xl border-2 border-transparent focus:border-yellow-500 outline-none font-black text-2xl text-slate-800 shadow-inner"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conteúdo Aba Pedidos */}
        {aba === 'pedidos' && (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto animate-in fade-in duration-300">
            <h2 className="text-[10px] font-black text-slate-400 uppercase mb-4 text-center">Últimos 10 Chamados</h2>
            {pedidos.length === 0 ? (
              <p className="text-center text-slate-400 py-10">Nenhum pedido ainda.</p>
            ) : (
              pedidos.map((ped) => (
                <div key={ped.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{ped.combustivel}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(ped.created_at).toLocaleDateString('pt-BR')} às {new Date(ped.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p className={`text-[10px] font-black mt-1 ${ped.localizacao_segura ? 'text-blue-500' : 'text-orange-500'}`}>
                      {ped.localizacao_segura ? '🛡️ PONTO SEGURO' : '📍 VIA PÚBLICA'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-slate-900">R$ {ped.valor_total}</p>
                    <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">{ped.ponto_proximo}</p>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={fetchPedidos} 
              className="w-full text-[10px] font-bold text-blue-500 py-4 hover:underline"
            >
              🔄 ATUALIZAR LISTA
            </button>
          </div>
        )}

        <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 tracking-widest uppercase">
          <span>Status: Online</span>
          <span>Logado como Admin</span>
        </div>
      </div>
    </div>
  );
}