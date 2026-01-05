'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    // Puxa TODOS os produtos da tabela sem filtro nenhum para não sumir nada
    const { data: p } = await supabase.from('produtos').select('*');
    const { data: o } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (p) setProdutos(p);
    if (o) setPedidos(o);
  }

  async function mudarPreco(id: string, valor: string) {
    await supabase.from('produtos').update({ preco: Number(valor) }).eq('id', id);
    // Não precisa dar alert, a atualização no banco é imediata
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', minHeight: '100 screen' }}>
      <h1 style={{ fontWeight: '900', fontStyle: 'italic' }}>PAINEL DE PREÇOS GasSOS</h1>
      
      {/* OS 3 PRODUTOS (Gasolina, Álcool, Spray) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        {produtos.map((item) => (
          <div key={item.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#888' }}>{item.tipo.toUpperCase()}</label>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '5px' }}>R$</span>
              <input 
                type="number" 
                defaultValue={item.preco} 
                onBlur={(e) => mudarPreco(item.id, e.target.value)}
                style={{ fontSize: '24px', fontWeight: '900', width: '100%', border: 'none', outline: 'none' }}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontWeight: '900', fontSize: '14px', color: '#444' }}>PEDIDOS AGUARDANDO</h2>
      <div style={{ marginTop: '20px' }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} style={{ background: 'white', padding: '15px', borderRadius: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{pedido.combustivel} - R$ {pedido.valor_total},00</p>
              <small style={{ color: '#aaa' }}>{new Date(pedido.created_at).toLocaleString()}</small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={pedido.ponto_proximo} target="_blank" style={{ fontSize: '10px', fontWeight: 'bold', textDecoration: 'none', color: 'blue' }}>VER MAPA</a>
              <button 
                onClick={async () => { await supabase.from('pedidos').delete().eq('id', pedido.id); carregarDados(); }}
                style={{ background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer', fontSize: '10px' }}
              >
                EXCLUIR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
