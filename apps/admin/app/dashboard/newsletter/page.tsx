'use client';
import { useEffect, useState } from 'react';
import { contactsApi, contentApi, type ContentItem } from '../../../lib/api';
import { composeHtml, EmailPreview, RichEditor } from '../../../components/email-editor';
import { PageHeader } from '../../../components/page-header';
import { IconMail, IconNewsletter } from '../../../components/icons';

export default function NewsletterPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [cta, setCta] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentError, setContentError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    contentApi.list()
      .then((result) => setContentItems(result.items.filter((item) => item.status === 'PUBLISHED')))
      .catch(() => setContentError('No se pudo cargar el contenido publicado. Puedes usar un enlace manual.'));
  }, []);

  const attachContent = (contentId: string) => {
    const item = contentItems.find((content) => content.id === contentId);
    if (!item) return;
    setCta((current) => current || `Descargar ${item.title}`);
    setCtaUrl(contentApi.stableLink(item.id));
  };

  const sendEmail = async () => {
    if (!subject || !body) return;
    setBusy(true);
    setError('');
    try {
      const result = await contactsApi.sendBulkEmail({ subject, html: composeHtml(body, cta, ctaUrl), audience: audience as 'ALL' | 'LEAD' | 'NEWSLETTER', fromName: 'Daniel Corral' });
      alert(`Correo enviado a ${result.sent} contacto(s).`);
      setShowCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el correo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<IconNewsletter size={20} />}
        title="Newsletter"
        description={<>Link de suscripción directa: <code className="text-orange bg-orange/10 px-2 py-0.5 rounded">danielcorral.com.mx/news</code></>}
        actions={
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-ink hover:bg-ink-soft text-white font-medium rounded-lg transition-colors text-sm">
            + Nueva campaña de email
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Suscriptores</p>
          <p className="font-display text-3xl tracking-wide text-ink mt-1">1</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Emails Enviados</p>
          <p className="font-display text-3xl tracking-wide text-ink mt-1">0</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tasa de Apertura</p>
          <p className="font-display text-3xl tracking-wide text-ink mt-1">--</p>
        </div>
      </div>

      {/* Create Email */}
      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Crear Campana de Email</h3>
            <p className="text-sm text-gray-500 mt-1">Disena el correo y selecciona a quien enviarlo.</p>
          </div>
          <div className="p-6 space-y-5">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del correo</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Esta semana en FELIZ: 3 Tips de Mindset" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enviar a</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="ALL">Todos los contactos</option>
                  <option value="LEAD">Solo Leads</option>
                  <option value="NEWSLETTER">Solo Newsletter (/news)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del email</label>
              <RichEditor value={body} onChange={setBody} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Boton (opcional)</label>
                <input value={cta} onChange={(e) => setCta(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Ver Contenido Completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del boton</label>
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://danielcorral.com.mx/..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enlace del boton</label>
              <select defaultValue="" onChange={(e) => attachContent(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Selecciona contenido publicado o usa el enlace manual</option>
                {contentItems.map((item) => <option key={item.id} value={item.id}>{item.title}{item.category ? ` · ${item.category}` : ''}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Al elegir contenido, el enlace estable se coloca automáticamente en el campo URL.</p>
              {contentError && <p className="text-xs text-amber-600 mt-1">{contentError}</p>}
            </div>

            {(subject || body) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Previsualizacion</h4>
                <div className="max-w-md mx-auto"><EmailPreview html={body} cta={cta} ctaUrl={ctaUrl} /></div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => void sendEmail()} disabled={busy || !subject || !body} className="px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft font-medium disabled:opacity-50">{busy ? 'Enviando...' : 'Enviar ahora'}</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!showCreate && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange mb-4">
            <IconMail size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Sin campañas de email enviadas</h3>
          <p className="text-gray-500 mt-2 text-sm">Crea tu primera campaña para llegar a tus suscriptores.</p>
        </div>
      )}
    </div>
  );
}
