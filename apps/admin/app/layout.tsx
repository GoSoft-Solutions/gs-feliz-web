import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'FELIZ — Admin',
  description: 'Panel administrativo FELIZ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
