'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminSimples() {
  const [precos, setPrecos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: p } = await supabase.from('produtos').select('*');
    const { data: o } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (p) setPrecos(p);
    if (o) setPedidos(o);
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ADMINISTRAÇÃO GasSOS</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>ALTERAR PREÇOS</h2>
        {precos.map((p) => (
          <div key={p.id} style={{ marginBottom: '10px' }}>
            <label>{p.tipo.toUpperCase()}: </label>
            <input 
              type="number" 
              defaultValue={p.preco} 
              onBlur={async (e) => {
                await supabase.from('produtos').update({ preco: e.target.value }).eq('id', p.id);
                alert('Preço Alterado');
              }}
            />
          </div>
        ))}
      </div>

      <div>
        <h2>PEDIDOS RECEBIDOS</h2>
        {pedidos.map((ped) => (
          <div key={ped.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <p><strong>{ped.combustivel}</strong> - R$ {ped.valor_total},00</p>
            <a href={ped.ponto_proximo} target="_blank">VER LOCALIZAÇÃO NO MAPA</a>
            <button 
              style={{ marginLeft: '10px', color: 'red' }} 
              onClick={async () => {
                await supabase.from('pedidos').delete().eq('id', ped.id);
                carregar();
              }}
            >
              EXCLUIR PEDIDO
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
