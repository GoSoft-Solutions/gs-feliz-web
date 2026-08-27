'use client';

export default function CoursesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>
        <button className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm" disabled>
          + Nuevo Curso (proximamente)
        </button>
      </div>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <h3 className="text-lg font-semibold text-gray-800">Modulo de cursos</h3>
        <p className="text-gray-500 mt-2 text-sm">Crea cursos con modulos y lecciones. Tus alumnos podran avanzar a su ritmo.</p>
        <p className="text-gray-400 mt-4 text-xs">Disponible proximamente</p>
      </div>
    </div>
  );
}
