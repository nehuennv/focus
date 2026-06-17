import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RitualTitle } from './RitualBackdrop';

const FONT = '"Press Start 2P", monospace';

const EMBERS = [
  { left: '6%', top: '82%', delay: '0s', dur: '7s' },
  { left: '16%', top: '90%', delay: '1.4s', dur: '9s' },
  { left: '28%', top: '85%', delay: '0.6s', dur: '8s' },
  { left: '44%', top: '92%', delay: '2.1s', dur: '6.5s' },
  { left: '58%', top: '86%', delay: '0.3s', dur: '10s' },
  { left: '72%', top: '88%', delay: '3.2s', dur: '7.5s' },
  { left: '84%', top: '80%', delay: '1.8s', dur: '8.5s' },
  { left: '93%', top: '90%', delay: '0.9s', dur: '9.5s' },
];

// Pantalla de acceso: registro / login con email + contraseña.
export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        setInfo('Iniciado forjado. Si no entra solo, iniciá sesión.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050302', fontFamily: FONT, padding: 24,
    }}>
      {/* ── Fondo atmosférico (imagen del lore) ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'url(/img/background-lore.png)',
        backgroundSize: 'cover', backgroundPosition: 'bottom center',
        imageRendering: 'pixelated', opacity: 0.4,
        animation: 'auth-bgbreathe 12s ease-in-out infinite',
      }} />

      {/* Vignette + gradiente */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 85% 75% at 50% 48%, transparent 30%, rgba(3,2,2,0.9) 100%),' +
          'linear-gradient(to bottom, rgba(3,2,2,0.7) 0%, transparent 30%, transparent 50%, rgba(3,2,2,0.85) 100%)',
      }} />

      {/* Aura ambiental pulsante */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 50% 45% at 50% 45%, rgba(217,119,6,0.16) 0%, transparent 65%),' +
          'radial-gradient(ellipse 30% 25% at 50% 38%, rgba(251,191,36,0.1) 0%, transparent 60%)',
        animation: 'auth-aura 5s ease-in-out infinite',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)',
      }} />

      {/* Líneas cromáticas */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 3, pointerEvents: 'none', background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.45) 40%, rgba(146,64,14,0.45) 60%, transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 3, pointerEvents: 'none', background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.45) 40%, rgba(146,64,14,0.45) 60%, transparent)' }} />

      {/* Embers */}
      {EMBERS.map((e, i) => (
        <div key={i} style={{
          position: 'absolute', left: e.left, top: e.top, width: 3, height: 3, borderRadius: '50%',
          background: '#fbbf24', boxShadow: '0 0 7px #f59e0b', pointerEvents: 'none', zIndex: 2,
          animation: `auth-ember ${e.dur} ${e.delay} ease-in infinite`,
        }} />
      ))}

      {/* ── Halo / aura detrás del panel ── */}
      <div style={{
        position: 'absolute', zIndex: 9, width: 520, height: 520, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(217,119,6,0.22) 0%, rgba(146,64,14,0.1) 35%, transparent 68%)',
        filter: 'blur(20px)', animation: 'auth-halo 6s ease-in-out infinite',
      }} />

      {/* ── Panel ── */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 440,
        border: '2px solid #92400e', background: 'rgba(10,5,4,0.92)',
        backdropFilter: 'blur(2px)',
        boxShadow: '8px 8px 0 #000, 0 0 50px rgba(217,119,6,0.25)',
        padding: '38px 32px', animation: 'auth-panelglow 5s ease-in-out infinite',
      }}>
        <RitualTitle subtitle={mode === 'login' ? 'EL UMBRAL' : 'FORJAR INICIADO'} />

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 10 }}>
          {mode === 'signup' && (
            <Field label="NOMBRE" value={name} onChange={setName} type="text" placeholder="NEHUÉN" />
          )}
          <Field label="EMAIL" value={email} onChange={setEmail} type="email" placeholder="vos@email.com" required />
          <Field
            label="CONTRASEÑA" value={password} onChange={setPassword}
            type={showPass ? 'text' : 'password'} placeholder="••••••" required
            toggle={{ on: showPass, onToggle: () => setShowPass(s => !s) }}
          />

          {error && (
            <div style={{ fontSize: 8, color: '#f87171', lineHeight: 1.7, border: '1px solid #7f1d1d', background: '#160404', padding: '8px 10px' }}>
              ⚠ {error}
            </div>
          )}
          {info && (
            <div style={{ fontSize: 8, color: '#4ade80', lineHeight: 1.7, border: '1px solid #14532d', background: '#060f06', padding: '8px 10px' }}>
              ✓ {info}
            </div>
          )}

          <button type="submit" disabled={busy} style={{
            marginTop: 6, padding: '15px', fontFamily: FONT, fontSize: 11,
            background: busy ? '#0a0504' : '#1c0e00', color: busy ? '#6b5040' : '#fbbf24',
            border: `2px solid ${busy ? '#2a1810' : '#d97706'}`,
            cursor: busy ? 'wait' : 'pointer', letterSpacing: '0.12em',
            textShadow: '2px 2px 0 #000', boxShadow: busy ? 'none' : '0 0 16px rgba(217,119,6,0.3), 4px 4px 0 #000',
            animation: busy ? 'none' : 'rb-throb 2.4s ease-in-out infinite',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            {busy ? '· · ·' : mode === 'login' ? '⚔  ENTRAR' : '🔥  FORJAR'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, position: 'relative', zIndex: 10 }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 7, color: '#6b5040', letterSpacing: '0.1em', lineHeight: 1.8 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d97706')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5040')}
          >
            {mode === 'login' ? '¿SIN CUENTA? FORJÁ UN INICIADO →' : '¿YA TENÉS CUENTA? ENTRÁ →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes auth-bgbreathe { 0%,100%{transform:scale(1);opacity:0.36} 50%{transform:scale(1.05);opacity:0.46} }
        @keyframes auth-aura { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes auth-halo { 0%,100%{opacity:0.6;transform:scale(0.96)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes auth-panelglow {
          0%,100%{box-shadow:8px 8px 0 #000, 0 0 40px rgba(217,119,6,0.18)}
          50%{box-shadow:8px 8px 0 #000, 0 0 70px rgba(217,119,6,0.4)}
        }
        @keyframes auth-ember {
          0%{transform:translateY(0) scale(1);opacity:0}
          10%{opacity:1} 80%{opacity:0.6}
          100%{transform:translateY(-75vh) scale(0.3);opacity:0}
        }
      `}</style>
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder, required, toggle }: {
  label: string; value: string; onChange: (v: string) => void;
  type: string; placeholder?: string; required?: boolean;
  toggle?: { on: boolean; onToggle: () => void };
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.22em' }}>{label}</span>
      <div style={{ position: 'relative', display: 'flex' }}>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          style={{
            flex: 1, fontFamily: FONT, fontSize: 10, padding: '12px 13px',
            paddingRight: toggle ? 44 : 13,
            background: '#0f0804', color: '#ede0c8', border: '2px solid #2a1810',
            outline: 'none', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#d97706'; e.target.style.boxShadow = 'inset 2px 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(217,119,6,0.25)'; }}
          onBlur={e => { e.target.style.borderColor = '#2a1810'; e.target.style.boxShadow = 'inset 2px 2px 0 rgba(0,0,0,0.4)'; }}
        />
        {toggle && (
          <button
            type="button" onClick={toggle.onToggle} tabIndex={-1}
            title={toggle.on ? 'Ocultar' : 'Mostrar'}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
              color: toggle.on ? '#fbbf24' : '#6b5040', padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d97706')}
            onMouseLeave={e => (e.currentTarget.style.color = toggle.on ? '#fbbf24' : '#6b5040')}
          >
            {toggle.on ? '🙈' : '👁'}
          </button>
        )}
      </div>
    </label>
  );
}
