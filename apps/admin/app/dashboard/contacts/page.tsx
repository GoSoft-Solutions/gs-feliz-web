'use client';

export default function ContactsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contactos</h1>
        <span className="text-sm text-gray-500">1 contacto total</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Campana</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 text-sm font-medium text-gray-800">Israel Jesus</td>
              <td className="px-6 py-4 text-sm text-gray-600">jesus2102.garcia@gmail.com</td>
              <td className="px-6 py-4"><span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">LEAD</span></td>
              <td className="px-6 py-4 text-sm text-gray-600">Instagram</td>
              <td className="px-6 py-4 text-sm text-gray-600">Guia Gratuita</td>
              <td className="px-6 py-4 text-sm text-gray-500">27 Ago 2026</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
