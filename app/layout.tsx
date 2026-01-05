import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css' // <--- ISSO AQUI QUE FAZ O VISUAL FUNCIONAR

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GasSOS BH',
  description: 'Socorro de Combustível Rápido em Belo Horizonte',
  manifest: '/manifest.json', // Preparado para virar App de celular
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
