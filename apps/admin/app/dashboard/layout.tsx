'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { canAccess, clearSession, firstAllowedPath, getSession, permissionSections, type AdminSession } from '../../lib/auth';

const navItems = [...permissionSections, { href: '/dashboard/permissions' as const, label: 'Permisos' }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (!currentSession) {
      router.push('/');
    } else if (pathname === '/dashboard/permissions' && currentSession.role !== 'admin') {
      router.push(firstAllowedPath(currentSession));
    } else if (pathname !== '/dashboard/permissions' && !canAccess(currentSession, pathname)) {
      router.push(firstAllowedPath(currentSession));
    }
  }, [pathname, router]);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wide">FELIZ</h1>
          <p className="text-gray-500 text-xs mt-1">Panel de Administracion</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.filter((item) => item.href === '/dashboard/permissions' ? session?.role === 'admin' : session && canAccess(session, item.href)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Daniel Corral</p>
            <p className="text-xs text-gray-400 truncate">{session?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesion"
            aria-label="Cerrar sesion"
            className="shrink-0 px-2 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </aside>

      <main className="ml-60 w-[calc(100%-15rem)] min-h-screen p-8 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  );
}
