'use client';
import { useEffect, useRef } from 'react';

export const CTA_MARKER = '<!--cta-->';

export function composeHtml(body: string, cta: string, ctaUrl: string): string {
  const clean = body.split(CTA_MARKER)[0];
  if (!cta) return clean;
  return `${clean}${CTA_MARKER}<p style="text-align:center;margin:40px 0 0"><a href="${ctaUrl || '#'}" style="display:inline-block;padding:14px 32px;background:#F4711A;color:#fff;font-weight:700;border-radius:10px;text-decoration:none">${cta}</a></p>`;
}

export function decompose(html: string | null): { body: string; cta: string; ctaUrl: string } {
  if (!html) return { body: '', cta: '', ctaUrl: '' };
  const [body, ctaPart] = html.split(CTA_MARKER);
  if (ctaPart) {
    return extractCta(body, ctaPart);
  }

  // Keep older campaigns editable: before the marker was added, the CTA
  // could already exist as a regular anchor in the stored HTML.
  const anchor = html.match(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (!anchor) return { body: html, cta: '', ctaUrl: '' };
  const cta = anchor[2].replace(/<[^>]+>/g, '').trim();
  return { body: html.replace(anchor[0], ''), cta, ctaUrl: anchor[1] };
}

function extractCta(body: string, ctaPart: string): { body: string; cta: string; ctaUrl: string } {
  const anchor = ctaPart.match(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (!anchor) return { body, cta: '', ctaUrl: '' };
  return { body, cta: anchor[2].replace(/<[^>]+>/g, '').trim(), ctaUrl: anchor[1] };
}

export function RichEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Chrome/Firefox default to wrapping each new line in a bare <div> on
    // Enter. Forcing <p> means every paragraph the client types picks up
    // the brand's paragraph styling (spacing, line-height) automatically,
    // both here and in the delivered email — no bare, unstyled <div>s.
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      // Unsupported in some browsers — harmless, styleContent() on the
      // server also treats <div> the same as <p> as a safety net.
    }
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

/**
 * Mirrors the branded template the API actually sends
 * (apps/api/src/modules/email/email-render.util.ts) so what the client
 * sees here is what lands in the inbox — same colors and spacing, not
 * just an approximation.
 */
export function EmailPreview({ html, cta, ctaUrl }: { html: string; cta: string; ctaUrl: string }) {
  const storedCta = html.match(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  const visibleCta = cta || storedCta?.[2]?.replace(/<[^>]+>/g, '').trim() || '';
  const visibleCtaUrl = ctaUrl || storedCta?.[1] || '#';
  const previewHtml = html
    .replace(CTA_MARKER, '')
    .replace(/<p\b[^>]*>\s*<a\b[^>]*href\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/a>\s*<\/p>/i, '')
    .replace(/\{\{\s*nombre\s*\}\}/g, 'Israel');

  return (
    <div className="bg-[#EEF1F5] p-4 sm:p-10 rounded-2xl">
      <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.15)] max-w-[600px] mx-auto">
        <div className="bg-[#0A0A0A] px-6 py-11 text-center">
          <span className="inline-block text-[#F0EDE6] text-2xl font-bold tracking-[6px]">DANIEL CORRAL</span>
        </div>
        <div className="bg-white px-8 sm:px-10 pt-11 pb-12">
          <div
            className="prose prose-sm max-w-none text-[#222222] [&_*]:max-w-full [&_p]:mb-5 [&_p]:leading-[1.75] [&_p]:text-[15px] [&_h1]:mt-0 [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-[#0A0A0A] [&_h3]:mt-7 [&_h3]:mb-3.5 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-[#0A0A0A] [&_ul]:mb-5 [&_ul]:pl-5 [&_li]:mb-2.5 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#F4711A] [&_blockquote]:bg-[#FAF7F2] [&_blockquote]:not-italic [&_blockquote]:py-2 [&_blockquote]:px-4 [&_a]:text-[#F4711A] [&_a]:font-semibold [&_a]:no-underline"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          {visibleCta && (
            <div className="mt-10 mb-1 text-center">
              <a href={visibleCtaUrl} className="inline-block px-8 py-3.5 bg-[#F4711A] text-white font-bold rounded-[10px] text-sm no-underline">
                {visibleCta}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
