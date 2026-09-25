'use client';
import { useEffect, useState } from 'react';
import { analyticsApi, campaignsApi, contactsApi, type AnalyticsOverview, type Campaign, type Contact } from '../../lib/api';
import { PageHeader } from '../../components/page-header';
import { IconCampaigns, IconContacts, IconDashboard, IconMail, IconTrendingUp } from '../../components/icons';

function fullName(c: Contact): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '(sin nombre)';
}

// Fallback only (when the analytics call is unavailable): the current
// week starts on Monday, in the browser's local time.
function isThisWeek(iso: string): boolean {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return new Date(iso).getTime() >= start.getTime();
}

/** "22 sep" from a YYYY-MM-DD key, without a timezone shift. */
function shortDate(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, camps] = await Promise.all([contactsApi.list(), campaignsApi.list()]);
        setContacts(c.items);
        setContactsTotal(c.total);
        setCampaigns(camps);
        // Same endpoint Analíticas reads from (7-day window here, to match
        // "esta semana") — the two pages can never show different numbers
        // for the same thing since they're the same calculation. Falls
        // back to computing from the lists above (an editor without the
        // Analíticas permission gets a 403 here) rather than breaking the
        // whole dashboard.
        try {
          setOverview(await analyticsApi.overview(7));
        } catch {
          // handled by the ?? fallbacks below
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats: Array<{ label: string; value: number; icon: typeof IconContacts; hint?: string }> = [
    { label: 'Total Contactos', value: overview?.totals.contacts ?? contactsTotal, icon: IconContacts },
    {
      label: 'Nuevos esta semana',
      value: overview?.totals.newThisWeek ?? contacts.filter((c) => isThisWeek(c.createdAt)).length,
      icon: IconTrendingUp,
      // Weeks start on Monday and reset on their own every Monday.
      hint: overview ? `Desde el lunes ${shortDate(overview.totals.weekStart)}` : undefined,
    },
    { label: 'Campanas Activas', value: overview?.totals.campaignsActive ?? campaigns.filter((c) => c.status === 'ACTIVE').length, icon: IconCampaigns },
    { label: 'Emails Enviados', value: overview?.totals.emailsSent ?? 0, icon: IconMail },
  ];

  const recent = [...contacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const campaignName = (id: string | null | undefined) =>
    campaigns.find((c) => c.id === id)?.name ?? '-';

  return (
    <div>
      <PageHeader icon={<IconDashboard size={20} />} title="Dashboard" description="Lo que está pasando en FELIZ ahora mismo." />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 text-gray-500">
              <stat.icon size={16} />
              <p className="text-sm">{stat.label}</p>
            </div>
            <p className="font-display text-4xl tracking-wide text-ink mt-2">{loading ? '—' : stat.value}</p>
            {stat.hint && !loading && <p className="text-xs text-gray-400 mt-1">{stat.hint}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Contactos Recientes</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Campana</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</td></tr>
            ) : recent.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Sin contactos todavia.</td></tr>
            ) : (
              recent.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{fullName(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email ?? '-'}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-orange/10 text-orange rounded capitalize">{c.sources?.[0]?.source ?? '-'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaignName(c.sources?.[0]?.campaignId)}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">{c.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
