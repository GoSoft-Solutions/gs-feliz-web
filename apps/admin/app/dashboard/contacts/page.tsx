'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { contactsApi, CONTACTS_PAGE_SIZE, type Contact } from '../../../lib/api';
import { PageHeader } from '../../../components/page-header';
import { IconChevron, IconContacts, IconEdit, IconHistory, IconMail, IconSearch, IconTrash } from '../../../components/icons';
import { EmailPreview, RichEditor } from '../../../components/email-editor';

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

/** Page numbers to show, with "…" for skipped ranges: always the first,
 * last and current page (plus its neighbours), so it stays compact no
 * matter how many pages there are. */
function pageWindow(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // The search that's actually applied — separate from what's typed in
  // the box, so paging keeps using the last *submitted* search.
  const [appliedSearch, setAppliedSearch] = useState('');
  const tableTopRef = useRef<HTMLDivElement>(null);
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

  const load = async (q: string = appliedSearch, p: number = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await contactsApi.list(q || undefined, p);
      // Deleted the only row on the last page → land on the previous one
      // instead of an empty page.
      if (res.items.length === 0 && p > 1) {
        await load(q, p - 1);
        return;
      }
      setContacts(res.items);
      // Real counts from the API, not res.items.length (one page only).
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
      setAppliedSearch(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = async (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    await load(appliedSearch, p);
    tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const remove = async (c: Contact) => {
    const label = fullName(c) === '(sin nombre)' ? c.email : fullName(c);
    if (!window.confirm(`Eliminar el contacto "${label}"? Esta accion no se puede deshacer.`)) return;
    setError('');
    try {
      await contactsApi.remove(c.id);
      await load(); // re-fetch this page so it stays full and totals stay right
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
      await contactsApi.sendEmail(emailTarget.id, { subject: subject.trim(), html: body });
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
      <PageHeader
        icon={<IconContacts size={20} />}
        title="Contactos"
        description={appliedSearch ? `${total} resultado(s) para "${appliedSearch}"` : `${total} contacto(s) en total`}
      />

      {toast && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {toast}
        </div>
      )}

      <div className="mb-4 relative max-w-md">
        <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load(search.trim(), 1); }}
          placeholder="Buscar por nombre o email... (Enter)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none"
        />
      </div>

      {error && !emailTarget && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div ref={tableTopRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6">
        {/* Scrolls horizontally on its own (discreet native scrollbar)
            instead of letting the table squish or spill past the card —
            min-w keeps every column readable, no matter the screen. */}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
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
                  <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">{c.status}</span></td>
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
                          <IconHistory size={15} />
                          <span>{c.sources.length}</span>
                          <IconChevron size={16} direction={expandedContacts.has(c.id) ? 'up' : 'down'} />
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
                        <IconEdit size={18} />
                      </button>
                      <button
                        onClick={() => openEmail(c)}
                        title="Enviar correo personalizado"
                        disabled={!c.email}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <IconMail size={18} />
                      </button>
                      <button
                        onClick={() => void remove(c)}
                        title="Eliminar contacto"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <IconTrash size={18} />
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

        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Mostrando {(page - 1) * CONTACTS_PAGE_SIZE + 1}–{(page - 1) * CONTACTS_PAGE_SIZE + contacts.length} de {total}
            </p>
            {totalPages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Paginación de contactos">
                <button
                  type="button"
                  onClick={() => void goToPage(page - 1)}
                  disabled={page === 1 || loading}
                  aria-label="Página anterior"
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <IconChevron size={14} className="rotate-90" /> Anterior
                </button>
                {pageWindow(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`gap-${i}`} className="px-1 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => void goToPage(p)}
                      disabled={loading}
                      aria-label={`Página ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                      className={`h-8 min-w-8 rounded-lg px-2 text-sm tabular-nums transition-colors ${
                        p === page ? 'bg-ink font-medium text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => void goToPage(page + 1)}
                  disabled={page === totalPages || loading}
                  aria-label="Página siguiente"
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Siguiente <IconChevron size={14} className="-rotate-90" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Email composer modal — same rich editor as Campañas/Newsletter, so
          composing a one-off note looks and feels identical, and (via
          buildEmailDocument on the backend) actually arrives styled. */}
      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Enviar correo</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Para: <span className="font-medium text-gray-800">{fullName(emailTarget)}</span> &lt;{emailTarget.email}&gt;
                </p>
              </div>
              <button onClick={() => setEmailTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del correo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mensaje</label>
                <RichEditor value={body} onChange={setBody} />
              </div>
              {body && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Previsualización</h4>
                  <div className="max-w-md mx-auto"><EmailPreview html={body} cta="" ctaUrl="" /></div>
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setEmailTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => void sendEmail()}
                disabled={sending}
                className="px-4 py-2 text-sm font-medium bg-ink text-white rounded-lg hover:bg-ink-soft disabled:opacity-50"
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
                  <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Apellido</label>
                  <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Telefono</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange text-sm">
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
              <button onClick={() => void saveEdit()} disabled={savingEdit} className="px-4 py-2 text-sm font-medium bg-ink text-white rounded-lg hover:bg-ink-soft disabled:opacity-50">
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
