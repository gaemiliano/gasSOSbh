import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GasSOS BH',
  description: 'Socorro de combustível 24h em Belo Horizonte',
  // Configuração para o ícone de Aplicativo (PWA)
  manifest: '/manifest.json',
  themeColor: '#020617',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        {/* Favicon e Meta Tags para Mobile */}
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/483/483497.png" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/483/483497.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950`}>
        {children}
      </body>
    </html>
  );
}