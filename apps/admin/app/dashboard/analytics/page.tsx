'use client';
import { PageHeader } from '../../../components/page-header';
import { IconAnalytics } from '../../../components/icons';

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader icon={<IconAnalytics size={20} />} title="Analíticas" description="Rendimiento de contactos, campañas y correos." />
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange mb-4">
          <IconAnalytics size={20} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Sin datos suficientes</h3>
        <p className="text-gray-500 mt-2 text-sm">Las analíticas se mostrarán cuando tengas más contactos y actividad en la plataforma.</p>
        <p className="text-gray-400 mt-4 text-xs">Métricas disponibles: crecimiento de contactos, fuentes de adquisición, rendimiento de campañas, tasa de apertura de emails.</p>
      </div>
    </div>
  );
}
