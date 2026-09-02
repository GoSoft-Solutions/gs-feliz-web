'use client';
import { useEffect, useRef, useState } from 'react';
import { contentApi, uploadToS3, type ContentItem } from '../../../lib/api';

interface FormState {
  title: string;
  category: string;
  description: string;
  downloadUrl: string;
}

const emptyForm: FormState = { title: '', category: '', description: '', downloadUrl: '' };

function humanSize(bytes: number | null): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contentApi.list();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar contenido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => { setForm(emptyForm); setFile(null); setShowCreate(false); setBusyMsg(''); };

  const handlePublish = async () => {
    if (!form.title) { setError('El titulo es obligatorio'); return; }
    if (!file && !form.downloadUrl) { setError('Sube un archivo o pega un link de descarga'); return; }
    setBusy(true);
    setError('');
    try {
      let storageKey: string | undefined;
      let contentType: string | undefined;
      let fileName: string | undefined;
      let sizeBytes: number | undefined;

      if (file) {
        setBusyMsg('Obteniendo permiso de subida...');
        const { uploadUrl, storageKey: key } = await contentApi.requestUpload(file.name, file.type);
        setBusyMsg('Subiendo archivo a S3...');
        await uploadToS3(uploadUrl, file);
        storageKey = key;
        contentType = file.type;
        fileName = file.name;
        sizeBytes = file.size;
      }

      setBusyMsg('Guardando...');
      await contentApi.create({
        title: form.title,
        category: form.category || undefined,
        description: form.description || undefined,
        contentType,
        fileName,
        sizeBytes,
        storageKey,
        downloadUrl: form.downloadUrl || undefined,
        status: 'PUBLISHED',
      });
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar');
    } finally {
      setBusy(false);
      setBusyMsg('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este contenido?')) return;
    try {
      await contentApi.remove(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const handleCopyLink = async (id: string) => {
    try {
      const { url } = await contentApi.downloadLink(id);
      await navigator.clipboard.writeText(url);
      alert('Link de descarga copiado al portapapeles.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar link');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contenido</h1>
        {!showCreate && <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-sm">+ Nuevo Contenido</button>}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Crear Nuevo Contenido</h3></div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Guia de los 4 Pilares" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Finanzas, Mindset, Relaciones" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Descripcion breve del contenido..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
              <div
                onClick={() => fileInput.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
              >
                <input ref={fileInput} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <p className="text-sm text-gray-700 font-medium">{file.name} <span className="text-gray-400">({humanSize(file.size)})</span></p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Haz click para seleccionar un archivo</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, video, imagen o cualquier tipo de archivo</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">O link externo (opcional)</label>
              <input value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://drive.google.com/..." />
              <p className="text-xs text-gray-400 mt-1">Si subes un archivo, este link se ignora. Usa esto solo para contenido ya alojado en otro lugar.</p>
            </div>

            {busyMsg && <p className="text-sm text-gray-500">{busyMsg}</p>}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={handlePublish} disabled={busy} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">{busy ? 'Procesando...' : 'Publicar'}</button>
              <button onClick={reset} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {!showCreate && (
        loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-sm text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-semibold text-gray-800">Sin contenido publicado</h3>
            <p className="text-gray-500 mt-2 text-sm">Sube PDFs, videos y recursos para entregarlos a tus contactos.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Titulo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Archivo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.fileName ?? (item.downloadUrl ? 'Link externo' : '-')} {item.sizeBytes ? `· ${humanSize(item.sizeBytes)}` : ''}</td>
                    <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded">{item.status}</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleCopyLink(item.id)} className="text-sm text-blue-600 hover:text-blue-800">Copiar link</button>
                      <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
