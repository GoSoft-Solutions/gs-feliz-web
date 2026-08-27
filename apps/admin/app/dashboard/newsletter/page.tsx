'use client';
import { useState } from 'react';

export default function NewsletterPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [cta, setCta] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">Link de suscripcion directa: <code className="text-green-700 bg-green-50 px-2 py-0.5 rounded">danielcorral.com.mx/news</code></p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm">
          + Nueva Campana de Email
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Suscriptores</p>
          <p className="text-2xl font-bold text-gray-800">1</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Emails Enviados</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tasa de Apertura</p>
          <p className="text-2xl font-bold text-gray-800">--</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del correo</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Esta semana en FELIZ: 3 Tips de Mindset" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enviar a</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="ALL">Todos los contactos (1)</option>
                  <option value="LEAD">Solo Leads</option>
                  <option value="ACTIVE">Solo Activos</option>
                  <option value="CUSTOMER">Solo Clientes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del email</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Hola {nombre},&#10;&#10;Esta semana quiero compartirte 3 tips que me han ayudado...&#10;&#10;1. ...&#10;2. ...&#10;3. ...&#10;&#10;Abrazo,&#10;Daniel" />
              <p className="text-xs text-gray-400 mt-1">Usa {'{nombre}'} para personalizar.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar archivo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Arrastra un archivo aqui o haz click para seleccionar</p>
                <button className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Seleccionar archivo</button>
              </div>
            </div>

            {/* Live Preview */}
            {(subject || body) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Previsualizacion</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-w-md mx-auto">
                  <div className="bg-gray-900 px-6 py-4 text-center">
                    <h2 className="text-white text-lg font-bold tracking-wide">DANIEL CORRAL</h2>
                  </div>
                  <div className="bg-white px-8 py-8">
                    <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                      {(body || '').replace('{nombre}', 'Israel')}
                    </div>
                    {cta && (
                      <div className="mt-8 text-center">
                        <span className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg text-sm shadow-sm">
                          {cta}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">danielcorral.com.mx | Cancelar suscripcion</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">Enviar Ahora</button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Programar Envio</button>
              <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">Guardar Borrador</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!showCreate && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-semibold text-gray-800">Sin campanas de email enviadas</h3>
          <p className="text-gray-500 mt-2 text-sm">Crea tu primera campana para llegar a tus suscriptores.</p>
        </div>
      )}
    </div>
  );
}
