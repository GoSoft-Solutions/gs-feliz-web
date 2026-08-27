'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@feliz.mx' && password === 'feliz2026') {
      localStorage.setItem('feliz_auth', 'true');
      router.push('/dashboard');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FELIZ</h1>
          <p className="text-gray-500 mt-2 text-sm">Panel de Administracion</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              placeholder="admin@feliz.mx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              placeholder="********"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
          >
            Iniciar Sesion
          </button>
        </form>
      </div>
    </div>
  );
}
