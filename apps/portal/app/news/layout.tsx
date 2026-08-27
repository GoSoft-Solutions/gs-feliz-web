import type { ReactNode } from 'react';

export const metadata = {
  title: 'Daniel Corral — Newsletter',
  description: 'Suscribete al newsletter de Daniel Corral',
};

export default function NewsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
