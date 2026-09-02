'use client';
import { useEffect, useState } from 'react';
import { campaignsApi, contactsApi, type Campaign, type Contact } from '../../lib/api';

function fullName(c: Contact): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '(sin nombre)';
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso).getTime();
  return Date.now() - d < 7 * 24 * 60 * 60 * 1000;
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, camps] = await Promise.all([contactsApi.list(), campaignsApi.list()]);
        setContacts(c.items);
        setCampaigns(camps);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    { label: 'Total Contactos', value: contacts.length },
    { label: 'Nuevos esta semana', value: contacts.filter((c) => isThisWeek(c.createdAt)).length },
    { label: 'Campanas Activas', value: campaigns.filter((c) => c.status === 'ACTIVE').length },
    { label: 'Emails Enviados', value: 0 },
  ];

  const recent = [...contacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const campaignName = (id: string | null | undefined) =>
    campaigns.find((c) => c.id === id)?.name ?? '-';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded capitalize">{c.sources?.[0]?.source ?? '-'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaignName(c.sources?.[0]?.campaignId)}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">{c.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
