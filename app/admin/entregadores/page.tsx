'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function GestaoEntregadores() {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [lista, setLista] = useState<any[]>([]);

  async function buscar() {
    const { data } = await supabase.from('entregadores').select('*');
    if (data) setLista(data);
  }

  useEffect(() => { buscar(); }, []);

  async function salvar() {
    await supabase.from('entregadores').insert([{ nome, senha, whatsapp }]);
    setNome(''); setSenha(''); setWhatsapp('');
    buscar();
  }

  return (
    <div className="p-8 max-w-md mx-auto font-sans">
      <h1 className="text-2xl font-black mb-6">CADASTRAR ENTREGADOR 🛵</h1>
      <div className="space-y-4 mb-10">
        <input placeholder="Nome do Motoqueiro" className="w-full p-4 border rounded-xl" onChange={e => setNome(e.target.value)} value={nome} />
        <input placeholder="WhatsApp (ex: 319...)" className="w-full p-4 border rounded-xl" onChange={e => setWhatsapp(e.target.value)} value={whatsapp} />
        <input placeholder="Senha de Acesso" className="w-full p-4 border rounded-xl" onChange={e => setSenha(e.target.value)} value={senha} />
        <button onClick={salvar} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">SALVAR ENTREGADOR</button>
      </div>

      <h2 className="font-black text-slate-400 uppercase text-xs mb-4 tracking-widest">Equipe Ativa</h2>
      <div className="space-y-2">
        {lista.map(e => (
          <div key={e.id} className="bg-slate-50 p-4 rounded-xl flex justify-between border">
            <div>
              <p className="font-bold text-slate-800 uppercase">{e.nome}</p>
              <p className="text-[10px] text-slate-400">SENHA: {e.senha}</p>
            </div>
            <span className="text-green-500 font-bold">● Ativo</span>
          </div>
        ))}
      </div>
    </div>
  );
}