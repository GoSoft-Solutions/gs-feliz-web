'use client';
import { useEffect, useState, type ReactElement } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { canAccess, clearSession, firstAllowedPath, getSession, permissionSections, type AdminSession, type PermissionKey } from '../../lib/auth';
import {
  IconAnalytics,
  IconCampaigns,
  IconClose,
  IconContacts,
  IconContent,
  IconCourses,
  IconDashboard,
  IconLogout,
  IconMemberships,
  IconMenu,
  IconNewsletter,
  IconPermissions,
} from '../../components/icons';

// One icon per section, reused in the nav item AND as that page's
// PageHeader badge — same visual language everywhere in the app.
const SECTION_ICON: Record<PermissionKey, (props: { size?: number }) => ReactElement> = {
  '/dashboard': IconDashboard,
  '/dashboard/contacts': IconContacts,
  '/dashboard/campaigns': IconCampaigns,
  '/dashboard/newsletter': IconNewsletter,
  '/dashboard/content': IconContent,
  '/dashboard/memberships': IconMemberships,
  '/dashboard/courses': IconCourses,
  '/dashboard/analytics': IconAnalytics,
  '/dashboard/permissions': IconPermissions,
};

const navItems = [...permissionSections, { href: '/dashboard/permissions' as const, label: 'Permisos' }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close the mobile drawer automatically on every navigation.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  const visibleItems = navItems.filter((item) =>
    item.href === '/dashboard/permissions' ? session?.role === 'admin' : session && canAccess(session, item.href),
  );

  const initial = (session?.name || session?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar — only the menu button + wordmark, sidebar itself
          stays off-screen until opened. */}
      <div className="md:hidden fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-ink px-4 py-3">
        <span className="font-display text-2xl tracking-[0.08em] text-ivory">FELIZ</span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2 text-ivory/80 hover:text-ivory rounded-lg hover:bg-white/5"
        >
          <IconMenu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink text-white flex flex-col transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl tracking-[0.08em] text-ivory">FELIZ</h1>
            <p className="text-white/35 text-xs mt-1">Panel de administración</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = SECTION_ICON[item.href];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-white/10 text-white font-medium' : 'text-white/55 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Active-state accent bar, same role the orange top strip
                    played on the old landing header — reserved as the
                    one accent color, not used as a fill. */}
                <span
                  className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-orange transition-opacity ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/20 text-orange text-sm font-semibold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80 truncate">{session?.name}</p>
              <p className="text-[11px] text-white/40 truncate">{session?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <IconLogout size={17} />
          </button>
        </div>
      </aside>

      <main className="md:ml-64 w-full md:w-[calc(100%-16rem)] min-h-screen p-5 pt-20 md:p-8 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
