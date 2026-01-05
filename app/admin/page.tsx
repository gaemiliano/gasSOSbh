'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Conexão direta para evitar erros de importação
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPanel() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');

  // 1. Carregar preços atuais do banco
  useEffect(() => {
    fetchPrecos();
  }, []);

  async function fetchPrecos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: true });

    if (data) setProdutos(data);
    setLoading(false);
  }

  // 2. Função para salvar o novo preço
  async function atualizarPreco(id: number, novoPreco: string) {
    const valorFormatado = parseFloat(novoPreco.replace(',', '.'));
    
    const { error } = await supabase
      .from('produtos')
      .update({ preco: valorFormatado })
      .eq('id', id);

    if (error) {
      setMensagem('❌ Erro ao atualizar');
    } else {
      setMensagem('✅ Preço atualizado com sucesso!');
      fetchPrecos();
      setTimeout(() => setMensagem(''), 3000);
    }
  }

  if (loading) return <div className="p-10 text-center">Carregando Painel...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Cabeçalho */}
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-black">Painel GasSOS</h1>
          <p className="text-slate-400 text-sm">Gerenciamento de Preços em Tempo Real</p>
        </div>

        <div className="p-6 space-y-6">
          {mensagem && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold animate-bounce">
              {mensagem}
            </div>
          )}

          <div className="space-y-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {produto.nome}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-400 font-mono">R$</span>
                  <input 
                    type="number" 
                    defaultValue={produto.preco}
                    onBlur={(e) => atualizarPreco(produto.id, e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-xl font-black focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  * Clique fora do campo ou mude de item para salvar automaticamente.
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={() => window.open('/', '_blank')}
              className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition-colors"
            >
              Visualizar App do Cliente
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Sistema Conectado ao Supabase Cloud
          </p>
        </div>
      </div>
    </div>
  );
}
