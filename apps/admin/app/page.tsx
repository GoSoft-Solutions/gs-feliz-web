'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api';
import { saveApiSession } from '../lib/auth';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login(identifier, password);
      saveApiSession(result.token, result.user);
      router.push('/dashboard');
    } catch {
      // Keep the message generic so the login does not reveal which field failed.
      setError('Credenciales incorrectas');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 relative overflow-hidden">
      {/* Subtle orange glow, matching the landing's dark-hero treatment. */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-orange/20 blur-[110px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-[0.08em] text-ivory">FELIZ</h1>
          <p className="text-white/40 mt-2 text-sm">Panel de administración</p>
        </div>

        <form onSubmit={handleLogin} className="bg-ivory rounded-2xl shadow-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all bg-white"
              placeholder="daniel"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all bg-white"
              placeholder="********"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ink hover:bg-ink-soft text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
