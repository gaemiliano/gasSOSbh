import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GasSOS BH | Gestão de Combustível',
  description: 'Socorro de combustível 24h e Gestão de Frotas',
  manifest: '/manifest.json', // Habilita a instalação como App
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        {/* Meta tag crucial para evitar que o layout "quebre" no celular ao digitar */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" 
        />
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Ícone que aparece na tela do celular */}
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/483/483497.png" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/483/483497.png" />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}