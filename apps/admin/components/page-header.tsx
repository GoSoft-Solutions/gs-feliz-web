import type { ReactNode } from 'react';

/**
 * Consistent header for every dashboard page: icon badge (same visual
 * language as the sidebar nav item for that section), title, optional
 * description, and a slot for page-level actions (the "+ Nueva ..."
 * button, filters, etc). Replaces each page's own hand-rolled header row.
 */
export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-ivory">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
