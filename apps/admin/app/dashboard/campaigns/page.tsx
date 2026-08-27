'use client';
import { useState, useRef } from 'react';

interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: string;
  source: string;
  contacts: number;
  link: string;
  emailSubject: string;
  emailHtml: string;
  emailCta: string;
  emailCtaUrl: string;
}

const initialCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Guia Gratuita',
    slug: 'guia-gratuita',
    status: 'ACTIVE',
    source: 'Instagram',
    contacts: 1,
    link: 'https://danielcorral.com.mx/news/guia-gratuita',
    emailSubject: 'Tu Guia Gratuita esta lista',
    emailHtml: '<p>Hola <strong>{nombre}</strong>,</p><p>Gracias por unirte. Aqui tienes la guia que te prometi con los <strong>4 pilares</strong> para transformar tu vida.</p><p>Descargala ahora y empieza tu camino hacia una version mas completa de ti.</p><p>Abrazo,<br/>Daniel</p>',
    emailCta: 'Descargar Guia',
    emailCtaUrl: 'https://danielcorral.com.mx/contenido/guia-4-pilares',
  },
];

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button type="button" onClick={() => exec('bold')} className="px-3 py-1.5 text-sm font-bold hover:bg-gray-200 rounded" title="Negrita">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-3 py-1.5 text-sm italic hover:bg-gray-200 rounded" title="Cursiva">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-3 py-1.5 text-sm underline hover:bg-gray-200 rounded" title="Subrayado">U</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => { const url = prompt('URL del enlace:'); if (url) exec('createLink', url); }} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-gray-200 rounded" title="Insertar enlace">Link</button>
        <button type="button" onClick={() => exec('unlink')} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded" title="Quitar enlace">Unlink</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded" title="Lista">Lista</button>
        <button type="button" onClick={() => exec('formatBlock', 'h3')} className="px-3 py-1.5 text-sm font-semibold hover:bg-gray-200 rounded" title="Subtitulo">H3</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded" title="Parrafo">P</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded" title="Izquierda">Izq</button>
        <button type="button" onClick={() => exec('justifyCenter')} className="px-3 py-1.5 text-sm hover:bg-gray-200 rounded" title="Centro">Centro</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        suppressContentEditableWarning
      />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">Usa <code className="bg-gray-200 px-1 rounded">{'{nombre}'}</code> para personalizar con el nombre del contacto.</p>
      </div>
    </div>
  );
}

function EmailPreview({ subject, html, cta, ctaUrl }: { subject: string; html: string; cta: string; ctaUrl: string }) {
  const previewHtml = html.replace(/\{nombre\}/g, 'Israel');
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-900 px-8 py-5 text-center">
        <h2 className="text-white text-xl font-bold tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>DANIEL CORRAL</h2>
      </div>
      <div className="bg-white px-8 py-8">
        {subject && <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">Asunto: {subject}</p>}
        <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        {cta && (
          <div className="mt-8 text-center">
            <a href={ctaUrl || '#'} className="inline-block px-8 py-3 bg-[#F4711A] text-white font-semibold rounded-lg text-sm no-underline shadow-md hover:shadow-lg transition-shadow">
              {cta}
            </a>
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">danielcorral.com.mx &middot; Cancelar suscripcion</p>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', source: 'Instagram',
    emailSubject: '', emailHtml: '', emailCta: '', emailCtaUrl: '',
  });

  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleCreate = () => {
    const slug = form.slug || generateSlug(form.name);
    setCampaigns([...campaigns, {
      id: String(Date.now()), name: form.name, slug, status: 'ACTIVE', source: form.source, contacts: 0,
      link: `https://danielcorral.com.mx/news/${slug}`,
      emailSubject: form.emailSubject, emailHtml: form.emailHtml, emailCta: form.emailCta, emailCtaUrl: form.emailCtaUrl,
    }]);
    setShowCreate(false);
    setForm({ name: '', slug: '', source: 'Instagram', emailSubject: '', emailHtml: '', emailCta: '', emailCtaUrl: '' });
  };

  const handleDelete = (id: string) => setCampaigns(campaigns.filter((c) => c.id !== id));

  const handleUpdate = (id: string) => {
    setCampaigns(campaigns.map((c) => c.id === id ? { ...c, name: form.name || c.name, emailSubject: form.emailSubject || c.emailSubject, emailHtml: form.emailHtml || c.emailHtml, emailCta: form.emailCta || c.emailCta, emailCtaUrl: form.emailCtaUrl || c.emailCtaUrl } : c));
    setEditId(null);
    setForm({ name: '', slug: '', source: 'Instagram', emailSubject: '', emailHtml: '', emailCta: '', emailCtaUrl: '' });
  };

  const previewCampaign = campaigns.find((c) => c.id === previewId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Campanas</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm">+ Nueva Campana</button>
      </div>

      {/* CREATE */}
      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Crear Nueva Campana</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Informacion</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Masterclass Gratis" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                  {form.slug && <p className="text-xs text-green-700 mt-1">danielcorral.com.mx/news/{form.slug}</p>}
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
                    <input value={form.emailCtaUrl} onChange={(e) => setForm({ ...form, emailCtaUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://danielcorral.com.mx/..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Live preview */}
            {(form.emailSubject || form.emailHtml) && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Previsualizacion</h4>
                <div className="max-w-md mx-auto">
                  <EmailPreview subject={form.emailSubject} html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">Crear Campana</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{previewCampaign.name}</h3>
                <p className="text-xs text-gray-500">Asunto: {previewCampaign.emailSubject}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">x</button>
            </div>
            <div className="p-4">
              <EmailPreview subject="" html={previewCampaign.emailHtml} cta={previewCampaign.emailCta} ctaUrl={previewCampaign.emailCtaUrl} />
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      {!showCreate && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {editId === campaign.id ? (
                <div className="space-y-4">
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
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contenido del correo</label>
                    <RichEditor value={form.emailHtml} onChange={(v) => setForm({ ...form, emailHtml: v })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Boton</label>
                      <input value={form.emailCta} onChange={(e) => setForm({ ...form, emailCta: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">URL del boton</label>
                      <input value={form.emailCtaUrl} onChange={(e) => setForm({ ...form, emailCtaUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  {form.emailHtml && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Previsualizacion</h4>
                      <div className="max-w-md mx-auto"><EmailPreview subject={form.emailSubject} html={form.emailHtml} cta={form.emailCta} ctaUrl={form.emailCtaUrl} /></div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleUpdate(campaign.id)} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Guardar</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Fuente: {campaign.source} &middot; Contactos: {campaign.contacts}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded">{campaign.status}</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Link para ManyChat:</p>
                    <code className="text-sm text-green-700 font-mono break-all">{campaign.link}</code>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button onClick={() => setPreviewId(campaign.id)} className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg">Ver correo</button>
                    <button onClick={() => { setEditId(campaign.id); setForm({ name: campaign.name, slug: campaign.slug, source: campaign.source, emailSubject: campaign.emailSubject, emailHtml: campaign.emailHtml, emailCta: campaign.emailCta, emailCtaUrl: campaign.emailCtaUrl }); }} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">Editar</button>
                    <button onClick={() => handleDelete(campaign.id)} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg">Eliminar</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
