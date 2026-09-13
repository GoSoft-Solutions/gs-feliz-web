'use client';
import { useEffect, useRef } from 'react';

export const CTA_MARKER = '<!--cta-->';

export function composeHtml(body: string, cta: string, ctaUrl: string): string {
  const clean = body.split(CTA_MARKER)[0];
  if (!cta) return clean;
  return `${clean}${CTA_MARKER}<p style="text-align:center;margin:40px 0 0"><a href="${ctaUrl || '#'}" style="display:inline-block;padding:12px 28px;background:#F4711A;color:#fff;font-weight:600;border-radius:8px;text-decoration:none">${cta}</a></p>`;
}

export function decompose(html: string | null): { body: string; cta: string; ctaUrl: string } {
  if (!html) return { body: '', cta: '', ctaUrl: '' };
  const [body, ctaPart] = html.split(CTA_MARKER);
  if (!ctaPart) return { body, cta: '', ctaUrl: '' };
  const cta = ctaPart.match(/>([^<]+)<\/a>/)?.[1] ?? '';
  const ctaUrl = ctaPart.match(/href="([^"]*)"/)?.[1] ?? '';
  return { body, cta, ctaUrl };
}

export function RichEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, []);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const buttonClass = 'px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-400">
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button type="button" onClick={() => exec('bold')} className={`${buttonClass} font-bold`}>B</button>
        <button type="button" onClick={() => exec('italic')} className={`${buttonClass} italic`}>I</button>
        <button type="button" onClick={() => exec('underline')} className={`${buttonClass} underline`}>U</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => { const url = prompt('URL del enlace:'); if (url) exec('createLink', url); }} className={`${buttonClass} text-blue-600`}>Enlace</button>
        <button type="button" onClick={() => exec('unlink')} className={`${buttonClass} text-gray-500`}>Quitar enlace</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={buttonClass}>Lista</button>
        <button type="button" onClick={() => exec('formatBlock', 'h3')} className={`${buttonClass} font-semibold`}>Titulo</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} className={buttonClass}>Parrafo</button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className={buttonClass}>Izq</button>
        <button type="button" onClick={() => exec('justifyCenter')} className={buttonClass}>Centro</button>
      </div>
      <div ref={editorRef} contentEditable className="p-4 min-h-[220px] text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none" onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }} suppressContentEditableWarning />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">Usa <code className="bg-gray-200 px-1 rounded">{'{{nombre}}'}</code> para personalizar con el nombre del contacto.</p>
      </div>
    </div>
  );
}

export function EmailPreview({ html, cta, ctaUrl }: { html: string; cta: string; ctaUrl: string }) {
  const previewHtml = html.replace(/\{\{\s*nombre\s*\}\}/g, 'Israel');
  return (
    <div className="bg-[#f3f4f6] p-3 sm:p-6 border border-gray-200 rounded-xl">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-[600px] mx-auto">
        <div className="bg-gray-900 px-6 py-7 text-center"><h2 className="text-white text-xl font-bold tracking-[0.25em]">DANIEL CORRAL</h2></div>
        <div className="bg-white px-6 sm:px-8 pt-8 pb-11">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          {cta && <div className="mt-10 text-center"><a href={ctaUrl || '#'} className="inline-block px-8 py-3 bg-[#F4711A] text-white font-semibold rounded-lg text-sm no-underline shadow-md">{cta}</a></div>}
        </div>
      </div>
    </div>
  );
}
