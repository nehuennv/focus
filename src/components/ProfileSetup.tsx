import { useState } from 'react';
import { supabase, type ProfileRow } from '../lib/supabase';
import { BEASTS } from '../store/useStore';
import { RitualBackdrop } from './RitualBackdrop';
import { sfx } from '../lib/sfx';
import { asset } from '../lib/asset';
import { CLASSES, ITEMS } from '../lib/lore';

const FONT = '"Press Start 2P", monospace';

const BEAST_LIST = Object.values(BEASTS);
const STEPS = ['NOMBRE', 'CLASE', 'SELLO', 'RELIQUIA', 'JURAMENTO'];

// Creación de personaje estilo Souls. "Completo" cuando char_class deja de ser null.
export function ProfileSetup({ profile, userId, onDone }: {
  profile: ProfileRow | null; userId: string; onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name && profile.display_name !== 'Anónimo' ? profile.display_name : '');
  const [avatar, setAvatar] = useState(profile?.avatar_beast ?? 'maro');
  const [charClass, setCharClass] = useState('');
  const [item, setItem] = useState('');
  const [lore, setLore] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBeast = BEASTS[avatar as keyof typeof BEASTS] ?? BEASTS.maro;
  const selectedClass = CLASSES.find(c => c.id === charClass);
  const selectedItem = ITEMS.find(i => i.id === item);

  // ¿Se puede avanzar desde el paso actual?
  const canAdvance =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? !!charClass :
    step === 2 ? !!avatar :
    step === 3 ? !!item :
    true;

  const next = () => { sfx.step(); setError(null); setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { sfx.back(); setError(null); setStep(s => Math.max(s - 1, 0)); };

  const save = async () => {
    setBusy(true);
    setError(null);
    // upsert: crea la fila si el trigger todavía no la generó.
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: name.trim() || 'Iniciado',
      avatar_beast: avatar,
      char_class: charClass,
      starting_item: item,
      lore: lore.trim() || null,
    });
    setBusy(false);
    if (error) { sfx.error(); setError(error.message); return; }
    sfx.success();
    await onDone();
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050302', fontFamily: FONT, padding: 24,
    }}>
      <RitualBackdrop />

      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 620,
        border: '2px solid #92400e', background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 60px rgba(146,64,14,0.14)',
        display: 'flex', flexDirection: 'column', maxHeight: '92vh',
      }}>
        {/* Header con progreso */}
        <div style={{ padding: '18px 26px 14px', borderBottom: '1px solid #1a0e08', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.22em' }}>⸺ EL RITO DE INICIACIÓN ⸺</span>
            <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.12em' }}>{step + 1}/{STEPS.length} · {STEPS[step]}</span>
          </div>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 5,
                background: i < step ? '#92400e' : i === step ? '#d97706' : '#1a1008',
                boxShadow: i === step ? '0 0 10px rgba(217,119,6,0.8)' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Body — cambia por paso (key reanima la entrada) */}
        <div key={step} style={{ padding: '24px 26px', overflowY: 'auto', flex: 1, animation: 'rb-fadein 0.35s ease-out' }}>

          {/* PASO 0 — NOMBRE */}
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#fbbf24', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000', marginBottom: 10 }}>¿CÓMO TE LLAMARÁN?</div>
              <p style={{ fontSize: 8, color: '#6b5040', lineHeight: 1.8, marginBottom: 28 }}>Las bestias recordarán tu nombre.<br />Tus compañeros de ritual, también.</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="NEHUÉN" autoFocus maxLength={20}
                onKeyDown={e => { if (e.key === 'Enter' && canAdvance) next(); }}
                style={{
                  width: '100%', maxWidth: 360, fontFamily: FONT, fontSize: 16, textAlign: 'center',
                  padding: '16px', background: '#0f0804', color: '#ede0c8', border: '2px solid #2a1810',
                  outline: 'none', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4)', letterSpacing: '0.1em',
                }}
                onFocus={e => (e.target.style.borderColor = '#d97706')}
                onBlur={e => (e.target.style.borderColor = '#2a1810')} />
            </div>
          )}

          {/* PASO 1 — CLASE */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 12, color: '#fbbf24', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000', marginBottom: 6 }}>ELEGÍ TU CLASE</div>
              <p style={{ fontSize: 7, color: '#6b5040', marginBottom: 18, letterSpacing: '0.08em' }}>¿QUÉ TIPO DE ESTUDIANTE SOS?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CLASSES.map(c => {
                  const sel = charClass === c.id;
                  return (
                    <button key={c.id} onClick={() => { sfx.click(); setCharClass(c.id); }} style={{
                      display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                      padding: '12px 14px', background: sel ? '#1c0e00' : '#0f0804',
                      border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
                      boxShadow: sel ? '0 0 10px rgba(217,119,6,0.3)' : 'none', transition: 'all 0.1s',
                    }}>
                      <span style={{ fontSize: 24, flexShrink: 0, filter: sel ? 'none' : 'grayscale(0.5)', opacity: sel ? 1 : 0.7 }}>{c.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 10, color: sel ? '#fbbf24' : '#8b7355' }}>{c.name}</span>
                          <span style={{ fontSize: 6, color: sel ? '#d97706' : '#4a3828', letterSpacing: '0.2em' }}>· {c.aptitude}</span>
                        </div>
                        <p style={{ fontSize: 7, color: sel ? '#a8865a' : '#4a3828', lineHeight: 1.7, marginTop: 6 }}>{c.lore}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2 — SELLO / AVATAR */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 12, color: '#fbbf24', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000', marginBottom: 6 }}>TU SELLO</div>
              <p style={{ fontSize: 7, color: '#6b5040', marginBottom: 18, letterSpacing: '0.08em' }}>LA BESTIA QUE TE REPRESENTA ANTE EL GREMIO</p>

              {/* Preview grande */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center', padding: '12px 14px', border: '2px solid #2a1810', background: '#0f0804', position: 'relative', overflow: 'hidden' }}>
                {selectedBeast.bgImg && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${asset(selectedBeast.bgImg)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                )}
                <img src={asset(selectedBeast.spriteImg)} alt={selectedBeast.name}
                  style={{ width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, position: 'relative', filter: `drop-shadow(0 0 8px ${selectedBeast.color}aa)` }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 10, color: '#fbbf24', marginBottom: 6 }}>{selectedBeast.name}</div>
                  <p style={{ fontSize: 7, color: '#6b5040', fontStyle: 'italic', lineHeight: 1.7 }}>{selectedBeast.lore.slice(0, 90)}...</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 6 }}>
                {BEAST_LIST.map(b => {
                  const sel = avatar === b.id;
                  return (
                    <button key={b.id} onClick={() => { sfx.click(); setAvatar(b.id); }} title={b.fullName} style={{
                      aspectRatio: '1', background: sel ? '#1c0e00' : '#0f0804',
                      border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
                      boxShadow: sel ? '0 0 10px rgba(217,119,6,0.35)' : 'none',
                      cursor: 'pointer', padding: 5, overflow: 'hidden', transition: 'all 0.1s',
                    }}>
                      <img src={asset(b.spriteImg)} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', opacity: sel ? 1 : 0.65 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3 — RELIQUIA */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 12, color: '#fbbf24', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000', marginBottom: 6 }}>ELEGÍ TU RELIQUIA</div>
              <p style={{ fontSize: 7, color: '#6b5040', marginBottom: 18, letterSpacing: '0.08em' }}>UN OBJETO QUE TE ACOMPAÑARÁ EN EL RITO</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ITEMS.map(it => {
                  const sel = item === it.id;
                  return (
                    <button key={it.id} onClick={() => { sfx.click(); setItem(it.id); }} style={{
                      display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', cursor: 'pointer',
                      padding: '14px 12px', background: sel ? '#1c0e00' : '#0f0804',
                      border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
                      boxShadow: sel ? '0 0 10px rgba(217,119,6,0.3)' : 'none', transition: 'all 0.1s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22, opacity: sel ? 1 : 0.7 }}>{it.icon}</span>
                        <span style={{ fontSize: 6, color: sel ? '#d97706' : '#4a3828', letterSpacing: '0.1em', lineHeight: 1.4 }}>{it.effect}</span>
                      </div>
                      <div style={{ fontSize: 8, color: sel ? '#fbbf24' : '#8b7355', lineHeight: 1.5 }}>{it.name}</div>
                      <p style={{ fontSize: 6, color: sel ? '#a8865a' : '#4a3828', lineHeight: 1.7 }}>{it.lore}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4 — JURAMENTO / RESUMEN */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 12, color: '#fbbf24', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000', marginBottom: 6 }}>EL JURAMENTO</div>
              <p style={{ fontSize: 7, color: '#6b5040', marginBottom: 18, letterSpacing: '0.08em' }}>ASÍ NACE TU INICIADO</p>

              {/* Resumen */}
              <div style={{ display: 'flex', gap: 16, padding: '14px 16px', border: '2px solid #d97706', background: '#0f0804', boxShadow: '0 0 16px rgba(217,119,6,0.2)', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                {selectedBeast.bgImg && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${asset(selectedBeast.bgImg)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }} />
                )}
                <img src={asset(selectedBeast.spriteImg)} alt={selectedBeast.name}
                  style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, position: 'relative', filter: `drop-shadow(0 0 8px ${selectedBeast.color}aa)` }} />
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8, textShadow: '2px 2px 0 #000' }}>{name.trim() || 'Iniciado'}</div>
                  <div style={{ fontSize: 7, color: '#a8865a', lineHeight: 1.9 }}>
                    <div>{selectedClass?.icon} {selectedClass?.name} <span style={{ color: '#6b5040' }}>· {selectedClass?.aptitude}</span></div>
                    <div style={{ marginTop: 4 }}>{selectedItem?.icon} {selectedItem?.name}</div>
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em' }}>TU JURAMENTO · OPCIONAL</span>
                <textarea value={lore} onChange={e => setLore(e.target.value)} rows={3} maxLength={240}
                  placeholder="Por qué entrás al ritual..."
                  style={{ width: '100%', fontFamily: FONT, fontSize: 9, lineHeight: 1.9, padding: '12px 13px', background: '#0f0804', color: '#ede0c8', border: '2px solid #2a1810', outline: 'none', resize: 'vertical', boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4)' }}
                  onFocus={e => (e.target.style.borderColor = '#d97706')}
                  onBlur={e => (e.target.style.borderColor = '#2a1810')} />
              </label>
            </div>
          )}

          {error && <div style={{ fontSize: 8, color: '#f87171', border: '1px solid #7f1d1d', background: '#160404', padding: '8px 10px', marginTop: 16 }}>⚠ {error}</div>}
        </div>

        {/* Footer — navegación */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 26px', borderTop: '1px solid #1a0e08', flexShrink: 0 }}>
          <button onClick={back} disabled={step === 0} style={{
            flex: 1, padding: '13px 0', fontFamily: FONT, fontSize: 9,
            background: '#0f0804', color: step === 0 ? '#2a1810' : '#6b5040',
            border: '2px solid #2a1810', cursor: step === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '3px 3px 0 #000', letterSpacing: '0.08em',
          }}>
            ← VOLVER
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={!canAdvance} style={{
              flex: 3, padding: '13px 0', fontFamily: FONT, fontSize: 10,
              background: canAdvance ? '#1c0e00' : '#0a0504',
              color: canAdvance ? '#fbbf24' : '#2a1810',
              border: `2px solid ${canAdvance ? '#d97706' : '#1a0e08'}`,
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              boxShadow: canAdvance ? '0 0 14px rgba(217,119,6,0.28), 3px 3px 0 #000' : 'none',
              letterSpacing: '0.1em', textShadow: '2px 2px 0 #000',
            }}>
              CONTINUAR →
            </button>
          ) : (
            <button onClick={save} disabled={busy} style={{
              flex: 3, padding: '13px 0', fontFamily: FONT, fontSize: 11,
              background: busy ? '#0a0504' : '#1c0e00', color: busy ? '#6b5040' : '#fbbf24',
              border: `2px solid ${busy ? '#2a1810' : '#d97706'}`, cursor: busy ? 'wait' : 'pointer',
              boxShadow: busy ? 'none' : '0 0 16px rgba(217,119,6,0.3), 3px 3px 0 #000',
              animation: busy ? 'none' : 'rb-throb 2.4s ease-in-out infinite',
              letterSpacing: '0.1em', textShadow: '2px 2px 0 #000',
            }}>
              {busy ? 'FORJANDO...' : '⚔  COMENZAR EL RITUAL'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
