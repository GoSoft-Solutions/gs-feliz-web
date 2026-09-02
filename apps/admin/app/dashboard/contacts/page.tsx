'use client';
import { useEffect, useState } from 'react';
import { contactsApi, type Contact } from '../../../lib/api';

function fullName(c: Contact): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return name || '(sin nombre)';
}

function sourceLabel(c: Contact): string {
  return c.sources?.[0]?.source || '-';
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await contactsApi.list(q);
      setContacts(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contactos</h1>
        <span className="text-sm text-gray-500">{contacts.length} contacto(s) total</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load(search); }}
          placeholder="Buscar por nombre o email... (Enter)"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Sin contactos todavia.</td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{fullName(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email ?? '-'}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">{c.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sourceLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
