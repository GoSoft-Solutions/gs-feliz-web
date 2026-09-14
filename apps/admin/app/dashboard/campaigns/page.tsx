'use client';
import { useEffect, useState } from 'react';
import { contactsApi, campaignsApi, contentApi, type Campaign, type ContentItem } from '../../../lib/api';
import { composeHtml, decompose, EmailPreview, RichEditor } from '../../../components/email-editor';
import { PageHeader } from '../../../components/page-header';
import { IconCampaigns, IconCheck, IconCopy, IconEdit, IconEye, IconSend, IconTrash } from '../../../components/icons';

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

const slugify = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendAudience, setSendAudience] = useState<Record<string, 'ALL' | 'LEAD' | 'NEWSLETTER'>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [campaignsResult, contentResult] = await Promise.all([campaignsApi.list(), contentApi.list()]);
      setCampaigns(campaignsResult);
      setContentItems(contentResult.items.filter((item) => item.status === 'PUBLISHED'));
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

  const attachContent = (contentId: string) => {
    const item = contentItems.find((content) => content.id === contentId);
    if (!item) return;
    setForm((current) => ({
      ...current,
      emailCta: current.emailCta || `Descargar ${item.title}`,
      emailCtaUrl: contentApi.stableLink(item.id),
    }));
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

  const sendCampaign = async (campaign: Campaign) => {
    if (!campaign.emailSubject || !campaign.emailHtml) {
      setError('La campaña necesita asunto y contenido antes de enviarse.');
      return;
    }
    const audience = sendAudience[campaign.id] ?? 'ALL';
    if (!confirm(`¿Enviar esta campaña a la audiencia ${audience}?`)) return;
    setSendingId(campaign.id);
    setError('');
    try {
      const result = await contactsApi.sendBulkEmail({ subject: campaign.emailSubject, html: campaign.emailHtml, audience, campaignId: campaign.id, fromName: campaign.emailFromName ?? 'Daniel Corral' });
      alert(`Correo enviado a ${result.sent} contacto(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la campaña');
    } finally {
      setSendingId(null);
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
  const editCampaign = campaigns.find((c) => c.id === editId);

  return (
    <div>
      <PageHeader
        icon={<IconCampaigns size={20} />}
        title="Campañas"
        description="Cada campaña tiene su propio link y su correo de bienvenida."
        actions={!showCreate && !editId && (
          <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="px-4 py-2 bg-ink hover:bg-ink-soft text-white font-medium rounded-lg text-sm">+ Nueva campaña</button>
        )}
      />

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
                  <input value={form.slug} readOnly aria-readonly="true" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Se genera desde el nombre y queda fijo porque forma parte del enlace público.</p>
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
                {contentItems.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-1">Enlace del botón</label>
                    <select defaultValue="" onChange={(e) => attachContent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="">Selecciona contenido publicado o usa una URL manual</option>
                      {contentItems.map((item) => <option key={item.id} value={item.id}>{item.title}{item.category ? ` · ${item.category}` : ''}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">El enlace estable se coloca automáticamente en URL del botón.</p>
                  </div>
                )}
              </div>
            </div>
            {(form.emailSubject || form.emailHtml) && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Previsualizacion</h4>
                <div className="max-w-md mx-auto"><EmailPreview html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} /></div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={handleCreate} disabled={busy || !form.name} className="px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft font-medium disabled:opacity-50">{busy ? 'Creando...' : 'Crear Campana'}</button>
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
                {contentItems.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Adjuntar contenido publicado</label>
                    <select defaultValue="" onChange={(e) => attachContent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="">Selecciona un recurso para llenar el enlace</option>
                      {contentItems.map((item) => <option key={item.id} value={item.id}>{item.title}{item.category ? ` · ${item.category}` : ''}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">El enlace será estable y generará una descarga S3 nueva cada vez que el usuario haga clic.</p>
                  </div>
                )}
              </div>
            </div>
            {form.emailHtml && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Previsualización</h4>
                <div className="max-w-xl mx-auto"><EmailPreview html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} /></div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => handleUpdate(editCampaign.id)} disabled={busy} className="px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft font-medium disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar cambios'}</button>
              <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {previewCampaign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          {/* max-h + flex column so a long email scrolls INSIDE the card
              instead of growing the card past the viewport — the header
              (with the close button) always stays visible and reachable. */}
          <div className="bg-gray-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{previewCampaign.name}</h3>
                <p className="text-xs text-gray-500">Asunto: {previewCampaign.emailSubject}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">x</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0"><EmailPreview html={previewCampaign.emailHtml ?? ''} cta="" ctaUrl="" /></div>
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
                        {copiedId === campaign.id ? <IconCheck size={17} /> : <IconCopy size={17} />}
                      </button>
                    </div>
                    <code className="block text-xs leading-5 text-gray-700 font-mono break-all">{SITE}/news/{campaign.slug}</code>
                  </div>
                  <div className="mt-auto pt-5 flex items-center justify-end gap-1.5 border-t border-gray-100">
                    {/* Grouped as one control: pick the audience, then hit
                        send — the icon reads as "send to whoever's
                        selected", not a generic action, so it never gets
                        confused with the eye/edit/trash cluster. */}
                    <div className="mr-auto flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white pl-1">
                      <select value={sendAudience[campaign.id] ?? 'ALL'} onChange={(event) => setSendAudience((current) => ({ ...current, [campaign.id]: event.target.value as 'ALL' | 'LEAD' | 'NEWSLETTER' }))} className="max-w-[110px] py-2 text-xs text-gray-600 bg-transparent border-none outline-none" aria-label="Audiencia de envío">
                        <option value="ALL">Todos</option><option value="LEAD">Leads</option><option value="NEWSLETTER">Newsletter</option>
                      </select>
                      <button
                        onClick={() => void sendCampaign(campaign)}
                        disabled={sendingId === campaign.id}
                        title="Enviar de forma masiva a la audiencia seleccionada"
                        aria-label="Enviar de forma masiva a la audiencia seleccionada"
                        className="m-0.5 p-2 text-white bg-ink hover:bg-ink-soft rounded-md transition disabled:opacity-50"
                      >
                        {sendingId === campaign.id ? <span className="block h-[17px] w-[17px] rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <IconSend size={17} />}
                      </button>
                    </div>
                    <button onClick={() => setPreviewId(campaign.id)} title="Ver correo" aria-label="Ver correo" className="p-2.5 text-orange hover:bg-orange/10 rounded-lg transition"><IconEye size={17} /></button>
                    <button onClick={() => startEdit(campaign)} title="Editar campaña" aria-label="Editar campaña" className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"><IconEdit size={17} /></button>
                    <button onClick={() => handleDelete(campaign.id)} disabled={busy} title="Eliminar campaña" aria-label="Eliminar campaña" className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"><IconTrash size={17} /></button>
                  </div>
              </>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
