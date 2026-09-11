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

function campaignLabel(c: Contact): string {
  return c.sources?.[0]?.campaign?.name || '-';
}

// --- Inline icons (no extra dependency) ---
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Email composer modal state
  const [emailTarget, setEmailTarget] = useState<Contact | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

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

  const remove = async (c: Contact) => {
    const label = fullName(c) === '(sin nombre)' ? c.email : fullName(c);
    if (!window.confirm(`Eliminar el contacto "${label}"? Esta accion no se puede deshacer.`)) return;
    setError('');
    try {
      await contactsApi.remove(c.id);
      setContacts((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el contacto');
    }
  };

  const openEmail = (c: Contact) => {
    setEmailTarget(c);
    setSubject('');
    setBody('');
    setError('');
  };

  const sendEmail = async () => {
    if (!emailTarget) return;
    if (!subject.trim() || !body.trim()) {
      setError('El asunto y el mensaje son obligatorios');
      return;
    }
    setSending(true);
    setError('');
    try {
      // Plain text newlines -> <br> so the message keeps its line breaks.
      const html = body.replace(/\n/g, '<br/>');
      await contactsApi.sendEmail(emailTarget.id, { subject: subject.trim(), html });
      setToast(`Correo enviado a ${emailTarget.email}`);
      setEmailTarget(null);
      setTimeout(() => setToast(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar el correo');
    } finally {
      setSending(false);
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

      {toast && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {toast}
        </div>
      )}

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

      {error && !emailTarget && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Campana</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">Cargando...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">Sin contactos todavia.</td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{fullName(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email ?? '-'}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">{c.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sourceLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{campaignLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEmail(c)}
                        title="Enviar correo personalizado"
                        disabled={!c.email}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MailIcon />
                      </button>
                      <button
                        onClick={() => void remove(c)}
                        title="Eliminar contacto"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Email composer modal */}
      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Enviar correo</h2>
              <button onClick={() => setEmailTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-500">
                Para: <span className="font-medium text-gray-800">{fullName(emailTarget)}</span> &lt;{emailTarget.email}&gt;
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del correo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mensaje</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Escribe tu mensaje... Puedes usar {{nombre}} para personalizar."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-y"
                />
                <p className="text-xs text-gray-400 mt-1">Consejo: usa {'{{nombre}}'} y {'{{email}}'} para personalizar. Se agrega un pie con la opcion de baja automaticamente.</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEmailTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => void sendEmail()}
                disabled={sending}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar correo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
