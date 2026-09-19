'use client';
import { useEffect, useRef, useState } from 'react';
import { contentApi, uploadToS3, type ContentItem } from '../../../lib/api';
import { PageHeader } from '../../../components/page-header';
import { IconContent, IconEdit, IconEye, IconLink, IconTrash } from '../../../components/icons';

interface FormState {
  title: string;
  category: string;
  description: string;
  downloadUrl: string;
}

const emptyForm: FormState = { title: '', category: '', description: '', downloadUrl: '' };

function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [customMode, setCustomMode] = useState(() => Boolean(value && !categories.includes(value)));
  return (
    <div className="space-y-2">
      <select
        value={customMode ? '__new__' : value}
        onChange={(event) => {
          if (event.target.value === '__new__') {
            setCustomMode(true);
            onChange('');
          } else {
            setCustomMode(false);
            onChange(event.target.value);
          }
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
      >
        <option value="">Sin categoría</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        <option value="__new__">+ Crear nueva categoría</option>
      </select>
      {customMode && (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-4 py-2 border border-orange/30 rounded-lg text-sm bg-orange/5 outline-none focus:ring-2 focus:ring-orange"
          placeholder="Escribe la nueva categoría"
          autoFocus
        />
      )}
    </div>
  );
}

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
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
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

  const openEdit = (item: ContentItem) => {
    setEditItem(item);
    setForm({ title: item.title, category: item.category ?? '', description: item.description ?? '', downloadUrl: item.downloadUrl ?? '' });
    setFile(null);
    setError('');
  };

  const categories = Array.from(
    new Set(items.map((item) => item.category?.trim()).filter((category): category is string => Boolean(category))),
  ).sort((first, second) => first.localeCompare(second, 'es'));
  const visibleItems = activeCategory === 'ALL'
    ? items
    : items.filter((item) => item.category === activeCategory);

  const handleUpdate = async () => {
    if (!editItem || !form.title.trim()) { setError('El titulo es obligatorio'); return; }
    setBusy(true);
    setError('');
    try {
      let replacement: { storageKey: string; contentType: string; fileName: string; sizeBytes: number } | null = null;
      if (file) {
        setBusyMsg('Subiendo reemplazo a S3...');
        const { uploadUrl, storageKey } = await contentApi.requestUpload(file.name, file.type);
        await uploadToS3(uploadUrl, file);
        replacement = { storageKey, contentType: file.type, fileName: file.name, sizeBytes: file.size };
      }
      const updated = await contentApi.update(editItem.id, {
        title: form.title,
        category: form.category || undefined,
        description: form.description || undefined,
        ...(replacement ? { ...replacement, downloadUrl: null } : { downloadUrl: form.downloadUrl || undefined }),
      });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditItem(null);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar contenido');
    } finally {
      setBusy(false);
      setBusyMsg('');
    }
  };

  return (
    <div>
      <PageHeader
        icon={<IconContent size={20} />}
        title="Contenido"
        description="Archivos y enlaces que tus campañas pueden entregar."
        actions={!showCreate && (
          <button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="px-4 py-2 bg-ink hover:bg-ink-soft text-white font-medium rounded-lg text-sm">+ Nuevo contenido</button>
        )}
      />

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <CategoryPicker categories={categories} value={form.category} onChange={(category) => setForm({ ...form, category })} />
                <p className="text-xs text-gray-400 mt-1">Reutiliza una categoría existente o crea una nueva.</p>
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
              <button onClick={handlePublish} disabled={busy} className="px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft disabled:opacity-50">{busy ? 'Procesando...' : 'Publicar'}</button>
              <button onClick={reset} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {!showCreate && !editItem && (
        loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-sm text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-semibold text-gray-800">Sin contenido publicado</h3>
            <p className="text-gray-500 mt-2 text-sm">Sube PDFs, videos y recursos para entregarlos a tus contactos.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Categorías</span>
              <button type="button" onClick={() => setActiveCategory('ALL')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === 'ALL' ? 'bg-ink text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}>Todas <span className="ml-1 opacity-70">{items.length}</span></button>
              {categories.map((category) => {
                const count = items.filter((item) => item.category === category).length;
                return <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === category ? 'bg-orange text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange/40'}`}>{category} <span className="ml-1 opacity-70">{count}</span></button>;
              })}
            </div>
            {visibleItems.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-sm text-gray-500">No hay contenido en esta categoría.</div>
            ) : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
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
                      onClick={() => setPreviewItem(item)}
                      title="Ver contenido (sin descargar)"
                      aria-label="Ver contenido"
                      className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100 transition"
                    >
                      <IconEye size={17} />
                    </button>
                    <button
                      onClick={() => void handleCopyLink(item.id)}
                      title={copiedId === item.id ? 'Enlace copiado' : 'Copiar enlace de descarga'}
                      aria-label={copiedId === item.id ? 'Enlace copiado' : 'Copiar enlace de descarga'}
                      className={`rounded-lg p-2.5 transition ${copiedId === item.id ? 'bg-green-50 text-green-700' : 'text-orange hover:bg-orange/10'}`}
                    >
                      <IconLink size={17} />
                    </button>
                    <button onClick={() => openEdit(item)} title="Editar contenido" aria-label="Editar contenido" className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100">
                      <IconEdit size={17} />
                    </button>
                    <button onClick={() => void handleDelete(item.id)} title="Eliminar contenido" aria-label="Eliminar contenido" className="rounded-lg p-2.5 text-red-500 hover:bg-red-50">
                      <IconTrash size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            </div>}
          </>
        )
      )}

      {editItem && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div><h3 className="font-semibold text-gray-800">Editar contenido</h3><p className="text-sm text-gray-500 mt-1">Actualiza los datos o reemplaza el archivo.</p></div>
            <button onClick={() => setEditItem(null)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label><CategoryPicker categories={categories} value={form.category} onChange={(category) => setForm({ ...form, category })} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reemplazar archivo (opcional)</label><div onClick={() => fileInput.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"><input ref={fileInput} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{file ? <p className="text-sm font-medium text-gray-700">{file.name} <span className="text-gray-400">({humanSize(file.size)})</span></p> : <p className="text-sm text-gray-500">Haz click para seleccionar un nuevo archivo</p>}</div></div>
            {!file && <div><label className="block text-sm font-medium text-gray-700 mb-1">Link externo</label><input value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" /></div>}
            {busyMsg && <p className="text-sm text-gray-500">{busyMsg}</p>}
            <div className="flex gap-3 pt-4 border-t border-gray-100"><button onClick={() => void handleUpdate()} disabled={busy} className="px-4 py-2 bg-ink text-white text-sm rounded-lg disabled:opacity-50">{busy ? 'Guardando...' : 'Guardar cambios'}</button><button onClick={() => setEditItem(null)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg">Cancelar</button></div>
          </div>
        </div>
      )}

      {/* Content preview modal — same bounded-height pattern as the
          campaign "Ver correo" preview: header pinned, only the content
          itself scrolls, so it never runs past the screen. */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-800 text-sm truncate pr-4">{previewItem.title}</h3>
              <button onClick={() => setPreviewItem(null)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">×</button>
            </div>
            <div className="flex-1 min-h-0 bg-gray-100">
              <iframe
                src={contentApi.previewLink(previewItem.id)}
                title={previewItem.title}
                className="w-full h-full min-h-[60vh] border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
