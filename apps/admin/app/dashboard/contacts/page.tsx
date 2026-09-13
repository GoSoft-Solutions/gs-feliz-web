'use client';
import { Fragment, useEffect, useState } from 'react';
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={expanded ? 'm6 9 6 6 6-6' : 'm9 6 6 6-6 6'} />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
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

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

  // Contact editor modal state
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ email: '', firstName: '', lastName: '', phone: '', status: 'LEAD' });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const openEdit = (c: Contact) => {
    setEditTarget(c);
    setEditForm({
      email: c.email ?? '',
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      phone: c.phone ?? '',
      status: c.status,
    });
    setError('');
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    setError('');
    try {
      const updated = await contactsApi.update(editTarget.id, {
        email: editForm.email.trim() || undefined,
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        status: editForm.status,
      });
      setContacts((current) => current.map((contact) => contact.id === updated.id ? { ...contact, ...updated } : contact));
      setEditTarget(null);
      setToast('Contacto actualizado');
      setTimeout(() => setToast(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar el contacto');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleHistory = (id: string) => {
    setExpandedContacts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
                <Fragment key={c.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{fullName(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email ?? '-'}</td>
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">{c.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sourceLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{campaignLabel(c)}</span>
                      {!!c.sources?.length && (
                        <button
                          type="button"
                          onClick={() => toggleHistory(c.id)}
                          title="Ver historial de campañas"
                          aria-label="Ver historial de campañas"
                          aria-expanded={expandedContacts.has(c.id)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                        >
                          <HistoryIcon />
                          <span>{c.sources.length}</span>
                          <ChevronIcon expanded={expandedContacts.has(c.id)} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        title="Editar contacto"
                        aria-label="Editar contacto"
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                      >
                        <EditIcon />
                      </button>
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
                {expandedContacts.has(c.id) && (
                  <tr className="bg-slate-50/80">
                    <td colSpan={7} className="px-6 pb-4 pt-0">
                      <div className="ml-[calc(25%+0.5rem)] border-l-2 border-gray-200 pl-5 pt-3">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Historial de campañas</p>
                          <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500">{c.sources?.length ?? 0} registros</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(c.sources ?? []).map((source) => (
                            <div key={source.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-semibold text-gray-800">{source.campaign?.name ?? '-'}</span>
                                <span className="shrink-0 text-[11px] text-gray-400">{new Date(source.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <span className="mt-1 block text-xs text-gray-500">{source.source ?? '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
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
                <p className="text-xs text-gray-400 mt-1">Consejo: usa {'{{nombre}}'} y {'{{email}}'} para personalizar.</p>
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

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Editar contacto</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombre</label>
                  <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Apellido</label>
                  <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Telefono</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm">
                    <option value="LEAD">LEAD</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button onClick={() => void saveEdit()} disabled={savingEdit} className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
