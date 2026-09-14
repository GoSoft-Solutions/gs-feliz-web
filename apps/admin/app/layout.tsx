import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Bebas_Neue } from 'next/font/google';
import './globals.css';

// Same brand typefaces as apps/landing (styles.css --f-t / --f-d):
// Plus Jakarta Sans for everything, Bebas Neue reserved for the wordmark
// and a few display moments (sidebar logo, stat numbers) — self-hosted
// by next/font, no external font request at runtime.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});
const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
});

export const metadata = {
  title: 'FELIZ — Admin',
  description: 'Panel administrativo FELIZ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} ${bebas.variable}`}>
      <body className="bg-gray-50 min-h-screen font-sans">{children}</body>
    </html>
  );
}
