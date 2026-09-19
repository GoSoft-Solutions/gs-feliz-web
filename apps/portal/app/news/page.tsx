'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const PILARES = ['Mindset', 'Finanzas', 'Relaciones', 'Identidad'];

type Step = 'email' | 'name';

export default function NewsletterPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = async (nameValue?: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre: nameValue || undefined }),
      });
      if (!res.ok) throw new Error('request failed');
      setSubmitted(true);
    } catch {
      setError('No pudimos registrar tu correo. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: only the email. A known contact sends right away; a new one
  // gets asked for their name first (step 2) — never both fields up front.
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/check-email?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as { exists: boolean };
      if (data.exists) {
        await submit();
      } else {
        setStep('name');
      }
    } catch {
      setError('Algo salió mal. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit(nombre);
  };

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.content}>
        <span style={styles.kicker}>NEWSLETTER</span>
        <h1 style={styles.brand}>DANIEL CORRAL</h1>

        {!submitted ? (
          <>
            <p style={styles.lead}>
              Ideas que transforman tu <strong style={{ color: '#F0EDE6' }}>mindset</strong>, tus{' '}
              <strong style={{ color: '#F0EDE6' }}>finanzas</strong> y tus{' '}
              <strong style={{ color: '#F0EDE6' }}>relaciones</strong>. Cada semana, directo a tu correo.
            </p>

            <div style={styles.pilares}>
              {PILARES.map((p) => (
                <span key={p} style={styles.pill}>{p}</span>
              ))}
            </div>

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} style={styles.form}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="tucorreo@ejemplo.com"
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#F4711A')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(240,237,230,0.14)')}
                />
                <button type="submit" disabled={checking} style={{ ...styles.button, ...(checking ? styles.buttonLoading : {}) }}>
                  {checking ? 'Un momento...' : 'Continuar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleNameSubmit} style={styles.form}>
                <p style={styles.emailConfirm}>
                  {email} <button type="button" onClick={() => setStep('email')} style={styles.changeLink}>cambiar</button>
                </p>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  autoFocus
                  placeholder="Tu nombre"
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#F4711A')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(240,237,230,0.14)')}
                />
                <button type="submit" disabled={submitting} style={{ ...styles.button, ...(submitting ? styles.buttonLoading : {}) }}>
                  {submitting ? 'Enviando...' : 'Quiero recibirlo'}
                </button>
              </form>
            )}

            {error && <p style={styles.error}>{error}</p>}
          </>
        ) : (
          <SuccessState name={nombre} />
        )}
      </section>
    </main>
  );
}

function SuccessState({ name }: { name?: string }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={styles.checkCircle}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={styles.successTitle}>{name ? `Listo, ${name}` : 'Listo, estas dentro'}</h2>
      <p style={styles.successText}>
        Revisa tu correo (y la carpeta de spam por si acaso). Tu primer contenido va en camino.
      </p>
    </div>
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
  // Flat — no card, no border, no glass/blur. The content just sits on
  // the page; nothing "encloses" the fields.
  content: {
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  kicker: {
    color: '#F4711A',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '3px',
  },
  brand: {
    fontFamily: "'Bebas Neue', 'Plus Jakarta Sans', sans-serif",
    fontSize: '44px',
    color: '#F0EDE6',
    letterSpacing: '3px',
    margin: '8px 0 20px',
    fontWeight: 700,
  },
  lead: {
    color: 'rgba(240,237,230,0.6)',
    fontSize: '16px',
    lineHeight: 1.65,
    marginBottom: '24px',
  },
  pilares: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  pill: {
    fontSize: '12px',
    color: 'rgba(240,237,230,0.6)',
    padding: '6px 14px',
    border: '1px solid rgba(240,237,230,0.12)',
    borderRadius: '9999px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  emailConfirm: {
    color: 'rgba(240,237,230,0.5)',
    fontSize: '13px',
    margin: '-4px 0 2px',
    textAlign: 'left',
  },
  changeLink: {
    background: 'none',
    border: 'none',
    color: '#F4711A',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginLeft: '6px',
    fontFamily: 'inherit',
  },
  input: {
    width: '100%',
    padding: '16px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(240,237,230,0.14)',
    borderRadius: 0,
    color: '#F0EDE6',
    fontSize: '16px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '16px 20px',
    background: '#F4711A',
    border: 'none',
    borderRadius: '999px',
    color: '#0A0A0A',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    marginTop: '8px',
  },
  buttonLoading: { background: 'rgba(244,113,26,0.5)', cursor: 'default' },
  error: { color: '#FF6B6B', fontSize: '13px', marginTop: '16px' },
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
