import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RitualBackdrop, RitualTitle } from './RitualBackdrop';

const FONT = '"Press Start 2P", monospace';

// Pantalla de acceso: registro / login con email + contraseña.
export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <RitualBackdrop />

      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 440,
        border: '2px solid #92400e', background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 60px rgba(146,64,14,0.14)',
        padding: '36px 32px', animation: 'rb-fadein 0.5s ease-out',
      }}>
        <RitualTitle subtitle={mode === 'login' ? 'EL UMBRAL' : 'FORJAR INICIADO'} />

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 10 }}>
          {mode === 'signup' && (
            <Field label="NOMBRE" value={name} onChange={setName} type="text" placeholder="NEHUÉN" />
          )}
          <Field label="EMAIL" value={email} onChange={setEmail} type="email" placeholder="vos@email.com" required />
          <Field label="CONTRASEÑA" value={password} onChange={setPassword} type="password" placeholder="••••••" required />

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
    </div>
  );
}

function Field({ label, value, onChange, type, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.22em' }}>{label}</span>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          fontFamily: FONT, fontSize: 10, padding: '12px 13px',
          background: '#0f0804', color: '#ede0c8', border: '2px solid #2a1810',
          outline: 'none', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#d97706'; e.target.style.boxShadow = 'inset 2px 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(217,119,6,0.25)'; }}
        onBlur={e => { e.target.style.borderColor = '#2a1810'; e.target.style.boxShadow = 'inset 2px 2px 0 rgba(0,0,0,0.4)'; }}
      />
    </label>
  );
}
