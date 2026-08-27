'use client';

export default function MembershipsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Membresias</h1>
        <button className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm" disabled>
          + Nuevo Plan (proximamente)
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-bold text-gray-800">Free</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">$0<span className="text-sm text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Contenido basico</p>
          <p className="text-sm font-medium text-green-600 mt-4">1 miembro</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center opacity-60">
          <h3 className="text-lg font-bold text-gray-800">Premium 99</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">$99<span className="text-sm text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Todo el contenido + comunidad</p>
          <p className="text-sm font-medium text-gray-400 mt-4">0 miembros</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center opacity-60">
          <h3 className="text-lg font-bold text-gray-800">Premium 399</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">$399<span className="text-sm text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Todo + sesiones 1:1 + cursos</p>
          <p className="text-sm font-medium text-gray-400 mt-4">0 miembros</p>
        </div>
      </div>
    </div>
  );
}
