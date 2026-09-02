'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function CampaignNewsletterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre: nombre || undefined, campaignSlug: slug }),
      });
      if (!res.ok) throw new Error('request failed');
      setSubmitted(true);
    } catch {
      setError('No pudimos registrar tu correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const campaignName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.card}>
        <span style={styles.kicker}>ACCESO EXCLUSIVO</span>
        <h1 style={styles.brand}>DANIEL CORRAL</h1>

        {!submitted ? (
          <>
            <div style={styles.campaignBadge}>{campaignName}</div>

            <p style={styles.lead}>
              Deja tus datos y recibe el contenido al instante en tu correo.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                style={styles.input}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#F4711A')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(240,237,230,0.12)')}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                style={styles.input}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#F4711A')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(240,237,230,0.12)')}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.button, ...(loading ? styles.buttonLoading : {}) }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#FF8C35'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#F4711A'; }}
              >
                {loading ? 'Enviando...' : 'Quiero mi acceso'}
              </button>
            </form>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.trust}>
              <span style={styles.trustItem}>✓ Acceso inmediato</span>
              <span style={styles.trustDot}>•</span>
              <span style={styles.trustItem}>✓ Sin spam</span>
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={styles.checkCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={styles.successTitle}>Listo, {nombre || 'estas dentro'}</h2>
            <p style={styles.successText}>
              Revisa tu correo (y la carpeta de spam por si acaso). Tu contenido va en camino.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#0A0A0A',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(244,113,26,0.14) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: '460px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(240,237,230,0.06)',
    borderRadius: '24px',
    padding: '48px 36px',
    backdropFilter: 'blur(8px)',
  },
  kicker: { color: '#F4711A', fontSize: '12px', fontWeight: 700, letterSpacing: '3px' },
  brand: {
    fontFamily: "'Bebas Neue', 'Plus Jakarta Sans', sans-serif",
    fontSize: '44px',
    color: '#F0EDE6',
    letterSpacing: '3px',
    margin: '8px 0 20px',
    fontWeight: 700,
  },
  campaignBadge: {
    display: 'inline-block',
    color: '#F0EDE6',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '8px 18px',
    border: '1px solid rgba(244,113,26,0.4)',
    background: 'rgba(244,113,26,0.1)',
    borderRadius: '9999px',
    marginBottom: '20px',
  },
  lead: {
    color: 'rgba(240,237,230,0.6)',
    fontSize: '16px',
    lineHeight: 1.65,
    marginBottom: '28px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    width: '100%',
    padding: '16px 20px',
    background: '#151515',
    border: '1px solid rgba(240,237,230,0.12)',
    borderRadius: '14px',
    color: '#F0EDE6',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '16px 20px',
    background: '#F4711A',
    border: 'none',
    borderRadius: '14px',
    color: '#0A0A0A',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonLoading: { background: 'rgba(244,113,26,0.5)', cursor: 'default' },
  error: { color: '#FF6B6B', fontSize: '13px', marginTop: '12px' },
  trust: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  trustItem: { color: 'rgba(240,237,230,0.4)', fontSize: '12px' },
  trustDot: { color: 'rgba(240,237,230,0.2)', fontSize: '12px' },
  checkCircle: {
    width: '64px',
    height: '64px',
    background: 'rgba(244,113,26,0.15)',
    border: '1px solid rgba(244,113,26,0.3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successTitle: { color: '#F0EDE6', fontSize: '22px', fontWeight: 700, marginBottom: '10px' },
  successText: { color: 'rgba(240,237,230,0.55)', fontSize: '15px', lineHeight: 1.6 },
};
