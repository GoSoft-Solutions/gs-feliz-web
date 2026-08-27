'use client';
import { useState } from 'react';

export default function ContentPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'PDF', access: 'FREE', description: '' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contenido</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm">
          + Nuevo Contenido
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Crear Nuevo Contenido</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Guia de los 4 Pilares" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="PDF">PDF</option>
                  <option value="VIDEO">Video</option>
                  <option value="ARTICLE">Articulo</option>
                  <option value="RESOURCE">Recurso</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acceso</label>
              <select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="PUBLIC">Publico (cualquiera puede verlo)</option>
                <option value="FREE">Gratuito (requiere registro)</option>
                <option value="MEMBERS_ONLY">Solo miembros</option>
                <option value="PURCHASE_REQUIRED">Requiere compra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descripcion breve del contenido..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">Arrastra un archivo aqui o haz click para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">PDF, MP4, PNG, JPG (max 100MB)</p>
                <button className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Seleccionar archivo</button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Publicar</button>
              <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">Guardar como borrador</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {!showCreate && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-semibold text-gray-800">Sin contenido publicado</h3>
          <p className="text-gray-500 mt-2 text-sm">Sube PDFs, videos y recursos para entregarlos a tus contactos.</p>
        </div>
      )}
    </div>
  );
}
