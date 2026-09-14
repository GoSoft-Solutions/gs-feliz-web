export type AdminRole = 'admin' | 'editor';

export type PermissionKey =
  | '/dashboard'
  | '/dashboard/contacts'
  | '/dashboard/campaigns'
  | '/dashboard/newsletter'
  | '/dashboard/content'
  | '/dashboard/memberships'
  | '/dashboard/courses'
  | '/dashboard/analytics'
  | '/dashboard/permissions';

export interface AdminUser {
  id?: string;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  password: string;
  permissions: PermissionKey[];
}

export interface AdminSession {
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: PermissionKey[];
}

export const permissionSections: Array<{ href: PermissionKey; label: string }> = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/contacts', label: 'Contactos' },
  { href: '/dashboard/campaigns', label: 'Campanas' },
  { href: '/dashboard/newsletter', label: 'Newsletter' },
  { href: '/dashboard/content', label: 'Contenido' },
  { href: '/dashboard/memberships', label: 'Membresias' },
  { href: '/dashboard/courses', label: 'Cursos' },
  { href: '/dashboard/analytics', label: 'Analiticas' },
];

const defaultUsers: AdminUser[] = [
  {
    username: 'daniel',
    email: 'admin@feliz.mx',
    name: 'Daniel Corral',
    role: 'admin',
    password: 'feliz2026',
    permissions: permissionSections.map((section) => section.href),
  },
  {
    username: 'editor',
    email: 'editor@feliz.mx',
    name: 'Editor FELIZ',
    role: 'editor',
    password: 'feliz2026',
    permissions: ['/dashboard/campaigns', '/dashboard/newsletter', '/dashboard/content'],
  },
];

const USERS_KEY = 'feliz_users';
const SESSION_KEY = 'feliz_session';

export function getUsers(): AdminUser[] {
  if (typeof window === 'undefined') return defaultUsers;
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  try {
    const users = JSON.parse(stored) as Array<Partial<AdminUser>>;
    const migratedUsers = users.map((user) => ({
      username: user.email === 'admin@feliz.mx' ? 'daniel' : user.username ?? user.email?.split('@')[0] ?? 'usuario',
      email: user.email ?? '',
      name: user.email === 'admin@feliz.mx' ? 'Daniel Corral' : user.name ?? user.username ?? 'Usuario',
      role: user.role ?? 'editor',
      password: user.password ?? 'feliz2026',
      permissions: user.permissions ?? [],
    }));
    localStorage.setItem(USERS_KEY, JSON.stringify(migratedUsers));
    return migratedUsers;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
}

export function saveUsers(users: AdminUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function authenticate(identifier: string, password: string): AdminSession | null {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = getUsers().find((candidate) => (candidate.username === normalizedIdentifier || candidate.email === normalizedIdentifier) && candidate.password === password);
  if (!user) return null;
  const session: AdminSession = {
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('feliz_auth', 'true');
  return session;
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  if (!localStorage.getItem('feliz_token')) return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try { return JSON.parse(stored) as AdminSession; } catch { /* reset below */ }
  }
  if (localStorage.getItem('feliz_auth') === 'true') {
    const admin = getUsers()[0];
    return { username: admin.username, email: admin.email, name: admin.name, role: admin.role, permissions: admin.permissions };
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('feliz_auth');
  localStorage.removeItem('feliz_token');
}

export function saveApiSession(token: string, user: { id: string; username: string; email: string; name: string; role: 'ADMIN' | 'EDITOR'; permissions: string[] }): AdminSession {
  const session: AdminSession = { username: user.username, email: user.email, name: user.name, role: user.role === 'ADMIN' ? 'admin' : 'editor', permissions: user.permissions as PermissionKey[] };
  localStorage.setItem('feliz_token', token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('feliz_auth', 'true');
  return session;
}

export function canAccess(session: AdminSession, path: string): boolean {
  return session.role === 'admin' || session.permissions.some((permission) => path === permission || path.startsWith(`${permission}/`));
}

export function firstAllowedPath(session: AdminSession): string {
  return session.role === 'admin' ? '/dashboard' : session.permissions[0] ?? '/';
}
