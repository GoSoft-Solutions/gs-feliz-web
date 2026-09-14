'use client';
import { PageHeader } from '../../../components/page-header';
import { IconMemberships } from '../../../components/icons';

export default function MembershipsPage() {
  return (
    <div>
      <PageHeader
        icon={<IconMemberships size={20} />}
        title="Membresías"
        description="Planes y suscripciones de tu comunidad."
        actions={
          <button className="px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm" disabled>
            + Nuevo plan (próximamente)
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-bold text-gray-800">Free</h3>
          <p className="font-display text-4xl tracking-wide text-ink mt-2">$0<span className="font-sans text-sm font-normal text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Contenido básico</p>
          <p className="text-sm font-medium text-green-600 mt-4">1 miembro</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center opacity-60">
          <h3 className="text-lg font-bold text-gray-800">Premium 99</h3>
          <p className="font-display text-4xl tracking-wide text-ink mt-2">$99<span className="font-sans text-sm font-normal text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Todo el contenido + comunidad</p>
          <p className="text-sm font-medium text-gray-400 mt-4">0 miembros</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center opacity-60">
          <h3 className="text-lg font-bold text-gray-800">Premium 399</h3>
          <p className="font-display text-4xl tracking-wide text-ink mt-2">$399<span className="font-sans text-sm font-normal text-gray-500">/mes</span></p>
          <p className="text-sm text-gray-500 mt-2">Todo + sesiones 1:1 + cursos</p>
          <p className="text-sm font-medium text-gray-400 mt-4">0 miembros</p>
        </div>
      </div>
    </div>
  );
}
