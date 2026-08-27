'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function CampaignNewsletterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  // Format slug for display
  const campaignName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '42px', color: '#F0EDE6', letterSpacing: '2px', marginBottom: '8px' }}>
          DANIEL CORRAL
        </h1>

        {!submitted ? (
          <>
            <p style={{ color: '#F4711A', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
              {campaignName}
            </p>

            <p style={{ color: 'rgba(240,237,230,0.55)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
              Deja tu correo para recibir el contenido exclusivo de esta campana.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: '#181818',
                  border: '1px solid rgba(240,237,230,0.10)',
                  borderRadius: '9999px',
                  color: '#F0EDE6',
                  fontSize: '15px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#F4711A'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(240,237,230,0.10)'}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Tu correo electronico"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: '#181818',
                  border: '1px solid rgba(240,237,230,0.10)',
                  borderRadius: '9999px',
                  color: '#F0EDE6',
                  fontSize: '15px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#F4711A'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(240,237,230,0.10)'}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: '#F4711A',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#0A0A0A',
                  fontSize: '15px',
                  fontWeight: '700',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FF8C35'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F4711A'}
              >
                Quiero mi acceso
              </button>
            </form>

            <p style={{ color: 'rgba(240,237,230,0.28)', fontSize: '12px', marginTop: '16px' }}>
              Sin spam. Cancela cuando quieras.
            </p>
          </>
        ) : (
          <div>
            <div style={{ width: '48px', height: '48px', background: 'rgba(244,113,26,0.18)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4711A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p style={{ color: '#F0EDE6', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Listo, {nombre || 'estas dentro'}.
            </p>
            <p style={{ color: 'rgba(240,237,230,0.55)', fontSize: '14px' }}>
              Revisa tu correo. Tu contenido va en camino.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
