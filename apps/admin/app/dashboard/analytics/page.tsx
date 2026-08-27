'use client';

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analiticas</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <h3 className="text-lg font-semibold text-gray-800">Sin datos suficientes</h3>
        <p className="text-gray-500 mt-2 text-sm">Las analiticas se mostraran cuando tengas mas contactos y actividad en la plataforma.</p>
        <p className="text-gray-400 mt-4 text-xs">Metricas disponibles: crecimiento de contactos, fuentes de adquisicion, rendimiento de campanas, tasa de apertura de emails.</p>
      </div>
    </div>
  );
}
