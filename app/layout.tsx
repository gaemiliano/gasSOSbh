import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GasSOS - Resgate de Combustível 24h',
  description: 'Acabou a gasolina? Não abandone seu veículo. Levamos combustível até você em minutos. Atendimento BH e Região.',
  generator: 'Next.js',
  applicationName: 'GasSOS',
  keywords: ['gasolina', 'pane seca', 'socorro', 'combustivel', 'motoqueiro', 'bh', 'resgate'],
  themeColor: '#eab308',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
  openGraph: {
    title: 'GasSOS - Pane Seca? Resgate Imediato 24h ⛽',
    description: 'Acabou o combustível? Nós levamos até você! Clique e peça socorro agora.',
    url: 'https://gassos.vercel.app', // <-- SEU LINK FINAL AQUI
    siteName: 'GasSOS Resgate',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>{children}</body>
    </html>
  )
}