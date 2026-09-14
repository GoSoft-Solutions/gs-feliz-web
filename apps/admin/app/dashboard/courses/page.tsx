'use client';
import { PageHeader } from '../../../components/page-header';
import { IconCourses } from '../../../components/icons';

export default function CoursesPage() {
  return (
    <div>
      <PageHeader
        icon={<IconCourses size={20} />}
        title="Cursos"
        description="Módulos y lecciones para que tus alumnos avancen a su ritmo."
        actions={
          <button className="px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm" disabled>
            + Nuevo curso (próximamente)
          </button>
        }
      />
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange mb-4">
          <IconCourses size={20} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Módulo de cursos</h3>
        <p className="text-gray-500 mt-2 text-sm">Crea cursos con módulos y lecciones. Tus alumnos podrán avanzar a su ritmo.</p>
        <p className="text-gray-400 mt-4 text-xs">Disponible próximamente</p>
      </div>
    </div>
  );
}
