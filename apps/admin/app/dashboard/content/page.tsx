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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => current === id ? null : current), 1800);
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((item) => (
              <article key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[245px] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate" title={item.title}>{item.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{item.category || 'Sin categoría'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold tracking-wide text-green-700">{item.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600 line-clamp-3">{item.description || 'Recurso listo para compartir en una campaña.'}</p>
                <div className="mt-auto pt-4">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-500">
                    <p className="truncate font-medium text-gray-700">{item.fileName ?? (item.downloadUrl ? 'Enlace externo' : 'Recurso')}</p>
                    {item.sizeBytes ? <p className="mt-1">{humanSize(item.sizeBytes)}</p> : null}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => void handleCopyLink(item.id)}
                      title={copiedId === item.id ? 'Enlace copiado' : 'Copiar enlace de descarga'}
                      aria-label={copiedId === item.id ? 'Enlace copiado' : 'Copiar enlace de descarga'}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${copiedId === item.id ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                    >
                      {copiedId === item.id ? 'Copiado' : 'Copiar enlace'}
                    </button>
                    <button onClick={() => void handleDelete(item.id)} title="Eliminar contenido" aria-label="Eliminar contenido" className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <span aria-hidden="true">&#128465;</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}
