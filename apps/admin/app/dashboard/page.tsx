'use client';

const stats = [
  { label: 'Total Contactos', value: '1' },
  { label: 'Nuevos esta semana', value: '1' },
  { label: 'Campanas Activas', value: '1' },
  { label: 'Emails Enviados', value: '0' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Contactos Recientes</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Campana</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-800">Israel Jesus</td>
              <td className="px-6 py-4 text-sm text-gray-600">jesus2102.garcia@gmail.com</td>
              <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">Instagram</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">Guia Gratuita</td>
              <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">LEAD</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
