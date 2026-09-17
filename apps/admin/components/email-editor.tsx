'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconChevronSmall,
  IconClearFormat,
  IconLink,
  IconListBullets,
  IconListNumbers,
  IconPalette,
  IconQuote,
  IconRedo,
  IconStrikethrough,
  IconUndo,
  IconUnlink,
} from './icons';

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

const TEXT_COLORS = ['#0A0A0A', '#5B6472', '#F4711A', '#D03B3B', '#0CA30C', '#2A78D6', '#8B5CF6'];

const STYLE_OPTIONS = [
  { value: 'p', label: 'Normal', preview: 'text-sm' },
  { value: 'h2', label: 'Título', preview: 'text-lg font-bold' },
  { value: 'h3', label: 'Subtítulo', preview: 'text-base font-bold' },
  { value: 'blockquote', label: 'Cita', preview: 'italic' },
] as const;

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
}

const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
};

/** Toolbar icon button — mousedown preventDefault keeps the editor's text
 * selection intact (a plain onClick button steals focus first, which can
 * collapse the selection before the command ever runs). */
function ToolbarButton({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`h-8 min-w-8 px-1.5 flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-orange/15 text-orange' : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />;
}

export function RichEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [active, setActive] = useState<ActiveFormats>(EMPTY_FORMATS);
  const [openPopover, setOpenPopover] = useState<'style' | 'link' | 'color' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNeedsText, setLinkNeedsText] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Chrome/Firefox default to wrapping each new line in a bare <div> on
      // Enter. Forcing <p> means every paragraph the client types picks up
      // the brand's paragraph styling (spacing, line-height) automatically,
      // both here and in the delivered email — no bare, unstyled <div>s.
      document.execCommand('defaultParagraphSeparator', false, 'p');
      // Makes foreColor (and similar) produce inline `style="color:..."`
      // instead of legacy <font color> tags, consistent with everything
      // else the server-side renderer expects.
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // Unsupported in some browsers — harmless, styleContent() on the
      // server also treats <div> the same as <p> as a safety net.
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
  }, []);

  // Close an open popover on an outside click.
  useEffect(() => {
    if (!openPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpenPopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPopover]);

  const syncActiveFormats = useCallback(() => {
    try {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
    } catch {
      // queryCommandState can throw when the document doesn't have focus —
      // harmless, the toolbar just keeps its last known state.
    }
  }, []);

  const emitChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncActiveFormats();
    emitChange();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const openLinkPopover = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel?.toString() ?? '';
    setLinkNeedsText(!selectedText);
    setLinkText(selectedText);
    setLinkUrl('');
    setOpenPopover('link');
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    const url = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    restoreSelection();
    if (linkNeedsText) {
      const safeText = escapeHtml(linkText.trim() || url);
      const safeUrl = escapeHtml(url).replace(/"/g, '&quot;');
      document.execCommand('insertHTML', false, `<a href="${safeUrl}">${safeText}</a>`);
    } else {
      document.execCommand('createLink', false, url);
    }
    emitChange();
    setOpenPopover(null);
  };

  const applyColor = (hex: string) => {
    restoreSelection();
    document.execCommand('foreColor', false, hex);
    emitChange();
    setOpenPopover(null);
  };

  const applyStyle = (tag: string) => {
    exec('formatBlock', tag);
    setOpenPopover(null);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange/20 focus-within:border-orange/50">
      <div className="flex items-center gap-0.5 p-1.5 bg-gray-50 border-b border-gray-200 flex-wrap relative">
        <ToolbarButton title="Deshacer" onClick={() => exec('undo')}>
          <IconUndo size={16} />
        </ToolbarButton>
        <ToolbarButton title="Rehacer" onClick={() => exec('redo')}>
          <IconRedo size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Paragraph style — Normal / Título / Subtítulo / Cita */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenPopover((current) => (current === 'style' ? null : 'style'))}
            title="Estilo de párrafo"
            className="h-8 px-2 flex items-center gap-1 rounded-md text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Estilo <IconChevronSmall size={13} />
          </button>
          {openPopover === 'style' && (
            <div ref={popoverRef} className="absolute z-20 top-full left-0 mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyStyle(option.value)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 ${option.preview} text-gray-800`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        <ToolbarButton title="Negrita" active={active.bold} onClick={() => exec('bold')}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton title="Cursiva" active={active.italic} onClick={() => exec('italic')}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton title="Subrayado" active={active.underline} onClick={() => exec('underline')}>
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton title="Tachado" active={active.strikeThrough} onClick={() => exec('strikeThrough')}>
          <IconStrikethrough size={16} />
        </ToolbarButton>

        {/* Text color */}
        <div className="relative">
          <ToolbarButton
            title="Color de texto"
            onClick={() => {
              saveSelection();
              setOpenPopover((current) => (current === 'color' ? null : 'color'));
            }}
          >
            <IconPalette size={16} />
          </ToolbarButton>
          {openPopover === 'color' && (
            <div ref={popoverRef} className="absolute z-20 top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg p-2.5 flex items-center gap-1.5">
              {TEXT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColor(hex)}
                  title={hex}
                  className="h-6 w-6 rounded-full border border-black/10 shrink-0"
                  style={{ background: hex }}
                />
              ))}
              <label className="h-6 w-6 rounded-full border border-dashed border-gray-300 shrink-0 relative cursor-pointer overflow-hidden flex items-center justify-center text-gray-400 text-[10px]">
                +
                <input
                  type="color"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title="Color personalizado"
                />
              </label>
            </div>
          )}
        </div>

        <ToolbarDivider />

        <ToolbarButton title="Alinear a la izquierda" active={active.justifyLeft} onClick={() => exec('justifyLeft')}>
          <IconAlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Centrar" active={active.justifyCenter} onClick={() => exec('justifyCenter')}>
          <IconAlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Alinear a la derecha" active={active.justifyRight} onClick={() => exec('justifyRight')}>
          <IconAlignRight size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Lista con viñetas" active={active.insertUnorderedList} onClick={() => exec('insertUnorderedList')}>
          <IconListBullets size={16} />
        </ToolbarButton>
        <ToolbarButton title="Lista numerada" active={active.insertOrderedList} onClick={() => exec('insertOrderedList')}>
          <IconListNumbers size={16} />
        </ToolbarButton>
        <ToolbarButton title="Cita" onClick={() => exec('formatBlock', 'blockquote')}>
          <IconQuote size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link */}
        <div className="relative">
          <ToolbarButton title="Insertar enlace" onClick={openLinkPopover}>
            <IconLink size={16} />
          </ToolbarButton>
          {openPopover === 'link' && (
            <div ref={popoverRef} className="absolute z-20 top-full left-0 mt-1 w-64 bg-white rounded-lg border border-gray-200 shadow-lg p-3 space-y-2">
              {linkNeedsText && (
                <input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto a mostrar"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-orange"
                  autoFocus
                />
              )}
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                placeholder="https://..."
                autoFocus={!linkNeedsText}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-orange"
              />
              <div className="flex justify-end gap-2 pt-0.5">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpenPopover(null)} className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800">
                  Cancelar
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyLink} className="px-3 py-1 text-xs font-medium bg-ink text-white rounded-md hover:bg-ink-soft">
                  Insertar
                </button>
              </div>
            </div>
          )}
        </div>
        <ToolbarButton title="Quitar enlace" onClick={() => exec('unlink')}>
          <IconUnlink size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Quitar formato" onClick={() => { exec('removeFormat'); exec('unlink'); }}>
          <IconClearFormat size={16} />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[220px] text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none [&_blockquote]:border-l-2 [&_blockquote]:border-orange [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500"
        onInput={emitChange}
        onMouseUp={syncActiveFormats}
        onKeyUp={syncActiveFormats}
        onFocus={syncActiveFormats}
        suppressContentEditableWarning
      />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">Usa <code className="bg-gray-200 px-1 rounded">{'{{nombre}}'}</code> para personalizar con el nombre del contacto.</p>
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
            className="prose prose-sm max-w-none text-[#222222] [&_*]:max-w-full [&_p]:mb-5 [&_p]:leading-[1.75] [&_p]:text-[15px] [&_h1]:mt-0 [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-[#0A0A0A] [&_h3]:mt-7 [&_h3]:mb-3.5 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-[#0A0A0A] [&_ul]:mb-5 [&_ul]:pl-5 [&_ol]:mb-5 [&_ol]:pl-5 [&_li]:mb-2.5 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#F4711A] [&_blockquote]:bg-[#FAF7F2] [&_blockquote]:not-italic [&_blockquote]:py-2 [&_blockquote]:px-4 [&_a]:text-[#F4711A] [&_a]:font-semibold [&_a]:no-underline"
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
      <p className="max-w-[600px] mx-auto mt-3 text-center text-[10px] text-[#ACA9A2] underline">
        Darme de baja de estos correos
      </p>
    </div>
  );
}
