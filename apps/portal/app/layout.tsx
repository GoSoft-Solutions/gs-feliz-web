import type { ReactNode } from 'react';

export const metadata = {
  title: 'Daniel Corral',
  description: 'Daniel Corral — Plataforma',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #0A0A0A; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          input::placeholder { color: rgba(240,237,230,0.3); }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
