'use client';
import { useEffect, useRef, useState } from 'react';
import { campaignsApi, type Campaign } from '../../../lib/api';

const SITE = 'https://danielcorral.com.mx';

interface FormState {
  name: string;
  slug: string;
  source: string;
  emailSubject: string;
  emailHtml: string;
  emailCta: string;
  emailCtaUrl: string;
}

const emptyForm: FormState = {
  name: '', slug: '', source: 'Instagram',
  emailSubject: '', emailHtml: '', emailCta: '', emailCtaUrl: '',
};

const CTA_MARKER = '<!--cta-->';

/** Appends the CTA button as HTML so the whole email is stored in emailHtml. */
function composeHtml(body: string, cta: string, ctaUrl: string): string {
  const clean = body.split(CTA_MARKER)[0];
  if (!cta) return clean;
  return `${clean}${CTA_MARKER}<p style="text-align:center;margin:40px 0 0"><a href="${ctaUrl || '#'}" style="display:inline-block;padding:12px 28px;background:#F4711A;color:#fff;font-weight:600;border-radius:8px;text-decoration:none">${cta}</a></p>`;
}

/** Splits stored html back into body + cta for editing. */
function decompose(html: string | null): { body: string; cta: string; ctaUrl: string } {
  if (!html) return { body: '', cta: '', ctaUrl: '' };
  const [body, ctaPart] = html.split(CTA_MARKER);
  if (!ctaPart) return { body, cta: '', ctaUrl: '' };
  const cta = ctaPart.match(/>([^<]+)<\/a>/)?.[1] ?? '';
  const ctaUrl = ctaPart.match(/href="([^"]*)"/)?.[1] ?? '';
  return { body, cta, ctaUrl };
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set the initial HTML ONCE on mount. We deliberately do NOT bind the div's
  // innerHTML to `value` on every render: doing so (e.g. via
  // dangerouslySetInnerHTML on a controlled contentEditable) resets the
  // caret to the start on each keystroke, which makes typed text appear
  // reversed. The DOM is the source of truth while editing; we only push
  // changes out via onChange.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const btn = 'px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-400">
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button type="button" onClick={() => exec('bold')} className={`${btn} font-bold`}>B</button>
        <button type="button" onClick={() => exec('italic')} className={`${btn} italic`}>I</button>
        <button type="button" onClick={() => exec('underline')} className={`${btn} underline`}>U</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => { const url = prompt('URL del enlace:'); if (url) exec('createLink', url); }} className={`${btn} text-blue-600`}>Enlace</button>
        <button type="button" onClick={() => exec('unlink')} className={`${btn} text-gray-500`}>Quitar enlace</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btn}>Lista</button>
        <button type="button" onClick={() => exec('formatBlock', 'h3')} className={`${btn} font-semibold`}>Titulo</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} className={btn}>Parrafo</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className={btn}>Izq</button>
        <button type="button" onClick={() => exec('justifyCenter')} className={btn}>Centro</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[220px] text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none"
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        suppressContentEditableWarning
      />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">Usa <code className="bg-gray-200 px-1 rounded">{'{{nombre}}'}</code> para personalizar con el nombre del contacto.</p>
      </div>
    </div>
  );
}

function EmailPreview({ html, cta, ctaUrl }: { html: string; cta: string; ctaUrl: string }) {
  const previewHtml = html.replace(/\{\{\s*nombre\s*\}\}/g, 'Israel');
  return (
    <div className="bg-[#f3f4f6] p-3 sm:p-6 border border-gray-200 rounded-xl">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-[600px] mx-auto">
        <div className="bg-gray-900 px-6 py-7 text-center">
          <h2 className="text-white text-xl font-bold tracking-[0.25em]">DANIEL CORRAL</h2>
        </div>
        <div className="bg-white px-6 sm:px-8 pt-8 pb-11">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        {cta && (
          <div className="mt-10 text-center">
            <a href={ctaUrl || '#'} className="inline-block px-8 py-3 bg-[#F4711A] text-white font-semibold rounded-lg text-sm no-underline shadow-md">{cta}</a>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function EditIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
}

function TrashIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg>;
}

function CopyIcon({ copied }: { copied: boolean }) {
  return copied
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}

const slugify = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCampaigns(await campaignsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar campanas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => { setForm(emptyForm); setShowCreate(false); setEditId(null); };

  const copyCampaignLink = async (campaign: Campaign) => {
    const link = `${SITE}/news/${campaign.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(campaign.id);
      setTimeout(() => setCopiedId((current) => current === campaign.id ? null : current), 1800);
    } catch {
      setError('No se pudo copiar el enlace');
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    try {
      await campaignsApi.create({
        name: form.name,
        slug: form.slug || slugify(form.name),
        source: form.source,
        status: 'ACTIVE',
        emailSubject: form.emailSubject || undefined,
        emailHtml: composeHtml(form.emailHtml, form.emailCta, form.emailCtaUrl) || undefined,
        emailFromName: 'Daniel Corral',
      });
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear campana');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      await campaignsApi.update(id, {
        name: form.name,
        emailSubject: form.emailSubject,
        emailHtml: composeHtml(form.emailHtml, form.emailCta, form.emailCtaUrl),
      });
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar campana');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta campana?')) return;
    setBusy(true);
    try {
      await campaignsApi.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar campana');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: Campaign) => {
    const { body, cta, ctaUrl } = decompose(c.emailHtml);
    setEditId(c.id);
    setForm({ name: c.name, slug: c.slug, source: c.source ?? 'Instagram', emailSubject: c.emailSubject ?? '', emailHtml: body, emailCta: cta, emailCtaUrl: ctaUrl });
  };

  const previewCampaign = campaigns.find((c) => c.id === previewId);
  const previewDecomposed = previewCampaign ? decompose(previewCampaign.emailHtml) : null;
  const editCampaign = campaigns.find((c) => c.id === editId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Campanas</h1>
        {!showCreate && !editId && <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-sm">+ Nueva Campana</button>}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Crear Nueva Campana</h3></div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Informacion</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Masterclass Gratis" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                  {form.slug && <p className="text-xs text-gray-500 mt-1">{SITE}/news/{form.slug}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fuente</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Instagram</option><option>TikTok</option><option>Landing</option><option>Google</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Correo de la campana</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Asunto</label>
                  <input value={form.emailSubject} onChange={(e) => setForm({ ...form, emailSubject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Tu contenido exclusivo esta listo" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contenido</label>
                  <RichEditor value={form.emailHtml} onChange={(v) => setForm({ ...form, emailHtml: v })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Boton (CTA)</label>
                    <input value={form.emailCta} onChange={(e) => setForm({ ...form, emailCta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descargar Ahora" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">URL del boton</label>
                    <input value={form.emailCtaUrl} onChange={(e) => setForm({ ...form, emailCtaUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={`${SITE}/...`} />
                  </div>
                </div>
              </div>
            </div>
            {(form.emailSubject || form.emailHtml) && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Previsualizacion</h4>
                <div className="max-w-md mx-auto"><EmailPreview html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} /></div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={handleCreate} disabled={busy || !form.name} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50">{busy ? 'Creando...' : 'Crear Campana'}</button>
              <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editCampaign && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-800">Editar campaña</h3>
              <p className="text-sm text-gray-500 mt-1">Actualiza el contenido sin perder el espacio de edición.</p>
            </div>
            <button type="button" onClick={() => setEditId(null)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">Cancelar</button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Información</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Asunto</label>
                  <input value={form.emailSubject} onChange={(e) => setForm({ ...form, emailSubject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Correo de la campaña</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Contenido</label>
                  <RichEditor key={`edit-${editCampaign.id}`} value={form.emailHtml} onChange={(v) => setForm({ ...form, emailHtml: v })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Botón (CTA)</label>
                    <input value={form.emailCta} onChange={(e) => setForm({ ...form, emailCta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">URL del botón</label>
                    <input value={form.emailCtaUrl} onChange={(e) => setForm({ ...form, emailCtaUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>
            {form.emailHtml && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Previsualización</h4>
                <div className="max-w-xl mx-auto"><EmailPreview html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} /></div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => handleUpdate(editCampaign.id)} disabled={busy} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar cambios'}</button>
              <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {previewCampaign && previewDecomposed && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{previewCampaign.name}</h3>
                <p className="text-xs text-gray-500">Asunto: {previewCampaign.emailSubject}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">x</button>
            </div>
            <div className="p-4"><EmailPreview html={previewDecomposed.body} cta={previewDecomposed.cta} ctaUrl={previewDecomposed.ctaUrl} /></div>
          </div>
        </div>
      )}

      {!showCreate && !editId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-sm text-gray-400">Cargando...</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-sm text-gray-400">Sin campanas todavia. Crea la primera.</div>
          ) : campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col min-h-[290px] hover:shadow-md transition-shadow">
              <>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate" title={campaign.name}>{campaign.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{campaign.source ?? 'Sin fuente'}</p>
                    </div>
                    <span className="shrink-0 inline-flex px-2 py-1 text-[11px] font-semibold tracking-wide bg-green-50 text-green-700 rounded-full">{campaign.status}</span>
                  </div>
                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Link de campaña</p>
                      <button
                        type="button"
                        onClick={() => void copyCampaignLink(campaign)}
                        title={copiedId === campaign.id ? 'Enlace copiado' : 'Copiar enlace'}
                        aria-label={copiedId === campaign.id ? 'Enlace copiado' : 'Copiar enlace'}
                        className={`p-2 rounded-lg transition ${copiedId === campaign.id ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
                      >
                        <CopyIcon copied={copiedId === campaign.id} />
                      </button>
                    </div>
                    <code className="block text-xs leading-5 text-gray-700 font-mono break-all">{SITE}/news/{campaign.slug}</code>
                  </div>
                  <div className="mt-auto pt-5 flex items-center justify-end gap-1 border-t border-gray-100">
                    <button onClick={() => setPreviewId(campaign.id)} title="Ver correo" aria-label="Ver correo" className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><EyeIcon /></button>
                    <button onClick={() => startEdit(campaign)} title="Editar campaña" aria-label="Editar campaña" className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"><EditIcon /></button>
                    <button onClick={() => handleDelete(campaign.id)} disabled={busy} title="Eliminar campaña" aria-label="Eliminar campaña" className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"><TrashIcon /></button>
                  </div>
              </>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
