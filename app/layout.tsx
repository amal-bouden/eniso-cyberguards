import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'ENISO CyberGuards — Operational CTF Platform',
  description: 'Official cybersecurity offensive lab and CTF platform for recruited operatives of ENISO CyberGuards — National Engineering School of Sousse.',
  keywords: ['ENISO CyberGuards', 'CTF', 'Cybersecurity', 'Capture The Flag', 'Sousse', 'Tunisia', 'Ethical Hacking'],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Share+Tech+Mono&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#040711] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600/30 selection:text-white">
        <ClientLayout>
          <div className="flex-1 flex flex-col">{children}</div>
        </ClientLayout>
      </body>
    </html>
  );
}
