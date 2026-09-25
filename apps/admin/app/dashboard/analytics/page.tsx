'use client';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi, type AnalyticsOverview } from '../../../lib/api';
import { PageHeader } from '../../../components/page-header';
import { IconAnalytics, IconCampaigns, IconContacts, IconMail, IconTrendingUp } from '../../../components/icons';

const WINDOW_OPTIONS = [7, 30, 90] as const;
type WindowDays = (typeof WINDOW_OPTIONS)[number];

// Fixed entity -> color/label mapping (never by sort position — see
// dataviz guidance: "color follows the entity, never its rank"). Status
// order is the lifecycle order (lead -> active -> customer -> inactive),
// not a count-sorted order, so the stacked bar reads the same way every time.
const STATUS_ORDER = ['LEAD', 'ACTIVE', 'CUSTOMER', 'INACTIVE'] as const;
const STATUS_META: Record<string, { label: string; color: string }> = {
  LEAD: { label: 'Lead', color: '#F4711A' },
  ACTIVE: { label: 'Activo', color: '#2a78d6' },
  CUSTOMER: { label: 'Cliente', color: '#0ca30c' },
  INACTIVE: { label: 'Inactivo', color: '#c3c2b7' },
};

const EVENT_META: Record<string, { label: string; color: string }> = {
  LEAD_CREATED: { label: 'Nuevo lead', color: '#0ca30c' },
  CONTACT_UPDATED: { label: 'Contacto actualizado', color: '#898781' },
  EMAIL_SENT: { label: 'Correo enviado', color: '#F4711A' },
  EMAIL_OPENED: { label: 'Correo abierto', color: '#F4711A' },
  UNSUBSCRIBED: { label: 'Se dio de baja', color: '#d03b3b' },
  CONTENT_DELIVERED: { label: 'Contenido entregado', color: '#2a78d6' },
  CONTENT_VIEWED: { label: 'Contenido visto', color: '#2a78d6' },
  OFFER_VIEWED: { label: 'Oferta vista', color: '#2a78d6' },
};

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-gray-500">{formatDay(label)}</p>
      <p className="text-sm font-semibold text-ink mt-0.5">{payload[0].value} {payload[0].value === 1 ? 'contacto' : 'contactos'}</p>
    </div>
  );
}

function BarList({ items, color, emptyLabel }: { items: Array<{ label: string; value: number }>; color: string; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-sm text-gray-700 truncate">{item.label}</span>
            <span className="text-sm font-semibold text-ink shrink-0 tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<WindowDays>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    analyticsApi
      .overview(days)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar las analíticas'))
      .finally(() => setLoading(false));
  }, [days]);

  const statusSegments = useMemo(() => {
    if (!data) return [];
    const total = data.totals.contacts || 1;
    return STATUS_ORDER.map((status) => {
      const count = data.statusBreakdown.find((s) => s.status === status)?.count ?? 0;
      return { status, count, pct: Math.round((count / total) * 1000) / 10, ...STATUS_META[status] };
    });
  }, [data]);

  const statusRow = useMemo(
    () => Object.fromEntries(statusSegments.map((s) => [s.status, s.count])),
    [statusSegments],
  );

  return (
    <div>
      <PageHeader
        icon={<IconAnalytics size={20} />}
        title="Analíticas"
        description="Cómo está creciendo FELIZ y qué está funcionando."
        actions={
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {WINDOW_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  days === option ? 'bg-ink text-white' : 'text-gray-500 hover:text-ink'
                }`}
              >
                {option}d
              </button>
            ))}
          </div>
        }
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading && !data ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center text-sm text-gray-400">
          Cargando analíticas...
        </div>
      ) : data && data.totals.contacts === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange mb-4">
            <IconAnalytics size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Todavía no hay datos</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            En cuanto lleguen los primeros contactos desde tus campañas, aquí vas a ver su crecimiento, de dónde
            vienen y cómo responden tus correos.
          </p>
        </div>
      ) : data ? (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-500">
                <IconContacts size={16} />
                <p className="text-sm">Total contactos</p>
              </div>
              <p className="font-display text-4xl tracking-wide text-ink mt-2">{data.totals.contacts}</p>
              {/* Real unsubscribes — contacts who hit "Cancelar suscripción"
                  in an email. */}
              <p className="text-xs text-gray-400 mt-1">
                {data.totals.unsubscribed === 0
                  ? 'Nadie ha cancelado su suscripción'
                  : `${data.totals.unsubscribed} ${data.totals.unsubscribed === 1 ? 'canceló' : 'cancelaron'} su suscripción (${data.totals.unsubscribeRate}%)`}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-500">
                <IconTrendingUp size={16} />
                <p className="text-sm">Nuevos ({days}d)</p>
              </div>
              <p className="font-display text-4xl tracking-wide text-ink mt-2">{data.totals.newInWindow}</p>
              <p className="text-xs text-gray-400 mt-1">contactos en los últimos {days} días</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-500">
                <IconCampaigns size={16} />
                <p className="text-sm">Campañas activas</p>
              </div>
              <p className="font-display text-4xl tracking-wide text-ink mt-2">{data.totals.campaignsActive}</p>
              <p className="text-xs text-gray-400 mt-1">de {data.totals.campaigns} en total</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-500">
                <IconMail size={16} />
                <p className="text-sm">Emails enviados</p>
              </div>
              <p className="font-display text-4xl tracking-wide text-ink mt-2">{data.totals.emailsSent}</p>
              <p className="text-xs text-gray-400 mt-1">total histórico</p>
            </div>
          </div>

          {/* Growth chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Crecimiento de contactos</h3>
            <p className="text-xs text-gray-400 mb-4">Nuevos contactos por día, últimos {days} días.</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.growth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4711A" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#F4711A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e1e0d9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDay}
                  tick={{ fontSize: 11, fill: '#898781' }}
                  axisLine={{ stroke: '#c3c2b7' }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<GrowthTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#F4711A"
                  strokeWidth={2}
                  fill="url(#growthFill)"
                  activeDot={{ r: 5, fill: '#F4711A', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status breakdown — single stacked bar, part-to-whole */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Contactos por estado</h3>
                <p className="text-sm text-gray-500">
                  <span className="font-display text-2xl tracking-wide text-ink">{data.totals.contacts}</span>{' '}
                  contactos
                </p>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
                {statusSegments.map((s) =>
                  s.count > 0 ? (
                    <div
                      key={s.status}
                      style={{ width: `${Math.max(s.pct, s.count > 0 ? 1.5 : 0)}%`, background: s.color }}
                      title={`${s.label}: ${s.count} (${s.pct}%)`}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-5">
                {statusSegments.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-semibold text-ink tabular-nums">{s.count}</span>
                    <span className="text-gray-400 text-xs">({s.pct}%)</span>
                  </div>
                ))}
              </div>
              {/* The rules behind the numbers, so nobody has to guess. */}
              <p className="mt-5 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400">
                <strong className="font-medium text-gray-500">Activo:</strong> ha estado en {data.totals.activeMinCampaigns} o más campañas (cerca del 80% de las que has lanzado) ·{' '}
                <strong className="font-medium text-gray-500">Inactivo:</strong> canceló su suscripción ·{' '}
                <strong className="font-medium text-gray-500">Lead:</strong> el resto.
              </p>
            </div>

            {/* Source breakdown — ranked bar list, magnitude */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Fuentes de adquisición</h3>
              <BarList
                items={data.sourceBreakdown.map((s) => ({ label: s.source, value: s.count }))}
                color="#F4711A"
                emptyLabel="Sin datos de fuente todavía."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign performance — ranked bar list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Campañas con más alcance</h3>
              <p className="text-xs text-gray-400 mb-4">Contactos asociados a cada campaña.</p>
              <BarList
                items={data.campaignPerformance.map((c) => ({ label: c.name, value: c.contacts }))}
                color="#0A0A0A"
                emptyLabel="Crea tu primera campaña para verla aquí."
              />
            </div>

            {/* Recent activity feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Actividad reciente</h3>
              {data.recentEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">Sin actividad todavía.</p>
              ) : (
                <div className="space-y-4">
                  {data.recentEvents.map((event) => {
                    const meta = EVENT_META[event.eventType] ?? { label: event.eventType, color: '#898781' };
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: meta.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">{meta.label}</span>
                            <span className="text-gray-400"> · {event.contactName}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {event.campaignName ?? event.source ?? event.contactEmail ?? ''}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{relativeTime(event.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
