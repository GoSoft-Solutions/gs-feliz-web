'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/contacts', label: 'Contactos' },
  { href: '/dashboard/campaigns', label: 'Campanas' },
  { href: '/dashboard/newsletter', label: 'Newsletter' },
  { href: '/dashboard/content', label: 'Contenido' },
  { href: '/dashboard/memberships', label: 'Membresias' },
  { href: '/dashboard/courses', label: 'Cursos' },
  { href: '/dashboard/analytics', label: 'Analiticas' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('feliz_auth')) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('feliz_auth');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wide">FELIZ</h1>
          <p className="text-gray-400 text-xs mt-1">Panel de Administracion</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Daniel Feliz</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
          >
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
