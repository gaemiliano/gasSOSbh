'use client';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vimddaeqrhtrgquyvbio.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRkYWVxcmh0cmdxdXl2YmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjMzNjYsImV4cCI6MjA4MzEzOTM2Nn0.jWrKTTevwat9DyRPyc4OLDd5LZsoJ8KX7D_0YdXnjys'
);

export default function CadastroMotoqueiro() {
  const [formData, setFormData] = useState({ nome: '', telefone: '', senha: '' });

  async function salvarCadastro() {
    // AQUI É ONDE CONFERIMOS SE SALVA
    const { error } = await supabase
      .from('entregadores')
      .insert([
        { 
          nome: formData.nome, 
          telefone: formData.telefone, 
          senha: formData.senha // Garanta que o nome da coluna no banco é 'senha'
        }
      ]);

    if (error) {
      alert("Erro ao salvar senha: " + error.message);
    } else {
      alert("Cadastro realizado com sucesso!");
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-xl mt-10">
      <h1 className="text-2xl font-black mb-6 italic italic uppercase">Cadastro de Motoqueiro</h1>
      <input 
        type="text" 
        placeholder="Nome Completo"
        className="w-full p-4 mb-4 border-2 rounded-2xl outline-none focus:border-yellow-500"
        onChange={(e) => setFormData({...formData, nome: e.target.value})}
      />
      <input 
        type="password" 
        placeholder="Crie uma Senha"
        className="w-full p-4 mb-6 border-2 rounded-2xl outline-none focus:border-yellow-500"
        onChange={(e) => setFormData({...formData, senha: e.target.value})}
      />
      <button 
        onClick={salvarCadastro}
        className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase"
      >
        Finalizar Cadastro
      </button>
    </div>
  );
}