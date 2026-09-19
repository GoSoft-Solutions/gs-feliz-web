'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type CampaignState = 'loading' | 'found' | 'not-found';
type Step = 'email' | 'name';

export default function CampaignNewsletterPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaignState, setCampaignState] = useState<CampaignState>('loading');
  const [campaignName, setCampaignName] = useState('');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // The link only works while the campaign it points to actually exists
  // AND is active — a fake slug and a deactivated campaign look identical
  // from here (both "not-found"), matching what the API itself enforces.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/v1/public/campaigns/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { name: string }) => {
        if (cancelled) return;
        setCampaignName(data.name);
        setCampaignState('found');
      })
      .catch(() => {
        if (!cancelled) setCampaignState('not-found');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const submit = async (nameValue?: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre: nameValue || undefined, campaignSlug: slug }),
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

  if (campaignState === 'loading') {
    return <main style={styles.page} />;
  }

  if (campaignState === 'not-found') {
    return (
      <main style={styles.page}>
        <div style={styles.glow} />
        <section style={styles.content}>
          <h1 style={styles.brand}>DANIEL CORRAL</h1>
          <p style={styles.notFoundText}>Este enlace ya no está disponible.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.content}>
        <span style={styles.kicker}>ACCESO EXCLUSIVO</span>
        <h1 style={styles.brand}>DANIEL CORRAL</h1>

        {!submitted ? (
          <>
            <div style={styles.campaignBadge}>{campaignName}</div>

            <p style={styles.lead}>Deja tu correo y recibe el contenido al instante.</p>

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
                  {submitting ? 'Enviando...' : 'Quiero mi acceso'}
                </button>
              </form>
            )}

            {error && <p style={styles.error}>{error}</p>}
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
  // Flat — no card, no border, no glass/blur. The content just sits on
  // the page; nothing "encloses" the fields.
  content: {
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
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
    color: 'rgba(240,237,230,0.55)',
    fontSize: '16px',
    lineHeight: 1.65,
    marginBottom: '28px',
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
    transition: 'background 0.2s',
    marginTop: '8px',
  },
  buttonLoading: { background: 'rgba(244,113,26,0.5)', cursor: 'default' },
  error: { color: '#FF6B6B', fontSize: '13px', marginTop: '16px' },
  notFoundText: { color: 'rgba(240,237,230,0.5)', fontSize: '16px', lineHeight: 1.6, marginTop: '4px' },
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
