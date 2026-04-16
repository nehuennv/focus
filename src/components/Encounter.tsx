import { useState, useEffect } from 'react';
import { useStore, BEASTS } from '../store/useStore';
import { RestScreen } from './RestScreen';

interface EncounterProps {
  domainId: string;
  selectedBeastId: string;
  onBack: () => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${m}m`;
};

// ── Pixel-style charge button ──────────────────────────────────────────────────
function ChargeBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border:      '2px solid #2a2a3a',
        background:  '#0c0c18',
        color:       '#a1a1aa',
        fontSize:    '8px',
        padding:     '8px 14px',
        fontFamily:  '"Press Start 2P", monospace',
        cursor:      'pointer',
        boxShadow:   '3px 3px 0 #000',
        transition:  'background 0.1s, color 0.1s',
        whiteSpace:  'nowrap',
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.background = '#161628';
        (e.target as HTMLButtonElement).style.color = '#e4e4e7';
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.background = '#0c0c18';
        (e.target as HTMLButtonElement).style.color = '#a1a1aa';
      }}
    >
      {label}
    </button>
  );
}

export function Encounter({ domainId, selectedBeastId, onBack }: EncounterProps) {
  const { completeRitual, domains } = useStore();
  const [isResting,   setIsResting]   = useState(false);
  const [chargedMins, setChargedMins] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  // flash state for damage preview pulse
  const [flashOn, setFlashOn] = useState(true);

  const domain = domains.find(d => d.id === domainId);

  // Countdown
  useEffect(() => {
    if (!isAttacking || !domain) return;
    if (timeLeft > 0) {
      const iv = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(iv);
    }
    // Countdown done → complete ritual
    completeRitual(domain.id, selectedBeastId, chargedMins);
    setIsAttacking(false);
    setChargedMins(0);
    setIsResting(true);
  }, [isAttacking, timeLeft, domain, completeRitual, selectedBeastId, chargedMins]);

  // Damage preview flash
  useEffect(() => {
    if (!chargedMins || isAttacking) return;
    const iv = setInterval(() => setFlashOn(f => !f), 500);
    return () => clearInterval(iv);
  }, [chargedMins, isAttacking]);

  if (!domain) return null;

  const beast     = BEASTS[selectedBeastId as keyof typeof BEASTS];
  const isDefeated = domain.currentDebtMins <= 0;

  // HP bar calculations (all clamped 0–100)
  const barMax             = Math.max(domain.weeklyTargetMins, domain.currentDebtMins, 1);
  const visualDebt         = Math.max(0, domain.currentDebtMins - chargedMins);
  const currentPct         = Math.min(100, (domain.currentDebtMins / barMax) * 100);
  const visualPct          = Math.max(0, Math.min(100, (visualDebt / barMax) * 100));
  const damagePct          = currentPct - visualPct;
  const hasDamagePreview   = chargedMins > 0 && !isAttacking && domain.currentDebtMins > 0;

  if (isResting) return <RestScreen onFinish={onBack} />;

  // ─── Glow color per phase ────────────────────────────────────────────────────
  const bossGlow = isAttacking
    ? 'drop-shadow(0 0 50px rgba(185,28,28,0.55)) drop-shadow(8px 8px 0 rgba(0,0,0,1))'
    : 'drop-shadow(0 0 30px rgba(107,33,168,0.35)) drop-shadow(8px 8px 0 rgba(0,0,0,1))';

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ background: '#04040a', fontFamily: '"Press Start 2P", monospace' }}
    >

      {/* ── L0: Beast background ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${beast?.bgImg})`,
          backgroundSize:  'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* ── L1: Atmospheric dark overlay ────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: isAttacking
            ? 'radial-gradient(ellipse at 50% 40%, rgba(80,0,0,0.45) 0%, rgba(0,0,0,0.82) 100%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(20,0,40,0.35) 0%, rgba(0,0,0,0.78) 100%)',
          transition: 'background 1.5s ease',
        }}
      />

      {/* ── L2: Scanlines ───────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 4px)',
          zIndex: 30,
        }}
      />

      {/* ── L3: Giant background timer (combat phase) ───────────────────────── */}
      {isAttacking && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <span
            style={{
              fontSize:    'clamp(72px, 17vw, 200px)',
              color:       'rgba(185,28,28,0.14)',
              lineHeight:  1,
              letterSpacing: '-0.02em',
              textShadow:  '4px 4px 0 rgba(0,0,0,0.4)',
              userSelect:  'none',
            }}
          >
            {fmt(timeLeft)}
          </span>
        </div>
      )}

      {/* ── L4: Boss sprite ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 10, paddingBottom: '180px', paddingTop: '60px' }}
      >
        <img
          src={beast?.spriteImg}
          alt={beast?.name}
          style={{
            maxHeight:      '62vh',
            objectFit:      'contain',
            imageRendering: 'pixelated',
            filter:         isDefeated
              ? 'grayscale(80%) brightness(0.4) drop-shadow(8px 8px 0 rgba(0,0,0,1))'
              : bossGlow,
            animation:      isDefeated ? 'none' : 'float 4s ease-in-out infinite',
            opacity:        isDefeated ? 0.5 : 1,
            transition:     'filter 0.8s ease, opacity 0.8s ease',
          }}
        />
      </div>

      {/* ── L5: Vignette corners ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 72%, rgba(0,0,0,0.5) 100%),' +
            'linear-gradient(to right,  rgba(0,0,0,0.4)  0%, transparent 12%, transparent 88%, rgba(0,0,0,0.4) 100%)',
          zIndex: 11,
        }}
      />

      {/* ── L6: TOP HUD BAR ─────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between"
        style={{
          zIndex:        20,
          background:    'rgba(4,4,10,0.88)',
          borderBottom:  '1px solid #1a1a2a',
          padding:       '10px 20px',
        }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            border:     '2px solid #252535',
            background: '#0c0c18',
            color:      '#71717a',
            fontSize:   '7px',
            padding:    '6px 12px',
            fontFamily: '"Press Start 2P", monospace',
            cursor:     'pointer',
            boxShadow:  '2px 2px 0 #000',
          }}
        >
          ← VOLVER
        </button>

        {/* Phase label */}
        <span style={{ fontSize: '7px', color: '#3a3a52', letterSpacing: '0.12em' }}>
          {isAttacking
            ? `⚔ EN COMBATE · ${fmt(timeLeft)}`
            : chargedMins > 0
            ? `OFRENDA CARGADA · ${fmtMins(chargedMins)}`
            : '⸺ PREPARACIÓN ⸺'}
        </span>

        {/* Flee (combat) or spacer */}
        {isAttacking ? (
          <button
            onClick={() => { setIsAttacking(false); setTimeLeft(0); setChargedMins(0); }}
            style={{
              border:     '2px solid #7f1d1d',
              background: '#1a0000',
              color:      '#ef4444',
              fontSize:   '7px',
              padding:    '6px 12px',
              fontFamily: '"Press Start 2P", monospace',
              cursor:     'pointer',
              boxShadow:  '2px 2px 0 #000',
            }}
          >
            HUIR
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* ── L7: BOTTOM HUD PANEL ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          zIndex:     20,
          background: 'rgba(4,4,10,0.92)',
          borderTop:  '2px solid #1a1a2a',
          padding:    '14px 20px 18px',
        }}
      >

        {/* Row A: Boss name + Domain info */}
        <div className="flex justify-between items-end mb-3">
          <div>
            <h2
              style={{
                fontSize:   '13px',
                color:      isDefeated ? '#52525b' : '#fbbf24',
                textShadow: '2px 2px 0 #000',
                letterSpacing: '0.05em',
              }}
            >
              {beast?.name}
            </h2>
            <p style={{ fontSize: '6px', color: '#3a3a52', marginTop: 4, letterSpacing: '0.06em' }}>
              {beast?.lore}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '7px', color: '#52525b', letterSpacing: '0.05em' }}>
              {domain.name}
            </p>
            <p style={{ fontSize: '6px', color: '#2a2a3a', marginTop: 3 }}>
              DEUDA SEMANAL: {fmtMins(domain.weeklyTargetMins)}
            </p>
          </div>
        </div>

        {/* Row B: HP Bar */}
        <div style={{ marginBottom: 10 }}>
          {/* Label row */}
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: '6px', color: '#3a3a52', letterSpacing: '0.1em' }}>
              DEUDA
            </span>
            <span style={{ fontSize: '6px', color: '#2a2a3a' }}>
              {isDefeated ? '— PURGADA —' : `${fmtMins(visualDebt)} restante`}
            </span>
          </div>

          {/* Bar track */}
          <div
            style={{
              position:   'relative',
              height:     14,
              background: '#07010100',
              border:     '2px solid #150000',
              overflow:   'hidden',
            }}
          >
            {/* Dark base fill (existing HP) */}
            {!isDefeated && (
              <div
                style={{
                  position:   'absolute',
                  left:       0,
                  top:        0,
                  height:     '100%',
                  width:      `${visualPct}%`,
                  background: '#7f1d1d',
                  transition: 'width 0.4s ease',
                }}
              />
            )}

            {/* Damage preview (flashing bright segment) */}
            {hasDamagePreview && damagePct > 0 && (
              <div
                style={{
                  position:   'absolute',
                  left:       `${visualPct}%`,
                  top:        0,
                  height:     '100%',
                  width:      `${damagePct}%`,
                  background: flashOn ? '#dc2626' : '#991b1b',
                  transition: 'background 0.15s',
                }}
              />
            )}

            {/* Segment dividers — every 10% */}
            <div
              style={{
                position:        'absolute',
                inset:           0,
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.5) calc(10% - 1px), rgba(0,0,0,0.5) 10%)',
                pointerEvents:   'none',
              }}
            />

            {/* Bar shine (top highlight) */}
            <div
              style={{
                position:   'absolute',
                top:        0,
                left:       0,
                right:      0,
                height:     2,
                background: 'rgba(255,255,255,0.05)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* HP numbers */}
          <div className="flex justify-between mt-1">
            <span style={{ fontSize: '6px', color: '#3a1010' }}>
              {isDefeated ? '0' : fmtMins(domain.currentDebtMins)} / {fmtMins(domain.weeklyTargetMins)}
            </span>
            {hasDamagePreview && (
              <span
                style={{
                  fontSize: '6px',
                  color:    flashOn ? '#dc2626' : '#7f1d1d',
                  transition: 'color 0.15s',
                }}
              >
                −{fmtMins(chargedMins)} si atacas
              </span>
            )}
          </div>
        </div>

        {/* Row C: Controls or victory */}
        {isDefeated ? (
          <div
            className="text-center py-2"
            style={{
              border:    '1px solid #92400e',
              background: '#1c0800',
              animation: 'ember-pulse 2s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: '8px', color: '#fbbf24', letterSpacing: '0.1em' }}>
              ✦ DEUDA PURGADA · JEFE DERROTADO ✦
            </span>
          </div>
        ) : isAttacking ? (
          <div className="flex items-center justify-center gap-4">
            <div
              style={{
                height: 2,
                flex: 1,
                background: 'linear-gradient(to right, transparent, #dc2626)',
              }}
            />
            <span style={{ fontSize: '7px', color: '#dc2626', letterSpacing: '0.12em' }}>
              ⚔ RITUAL ACTIVO
            </span>
            <div
              style={{
                height: 2,
                flex: 1,
                background: 'linear-gradient(to left, transparent, #dc2626)',
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {/* Charge buttons */}
            <div className="flex gap-2">
              <ChargeBtn label="+10m" onClick={() => setChargedMins(p => p + 10)} />
              <ChargeBtn label="+30m" onClick={() => setChargedMins(p => p + 30)} />
              <ChargeBtn label="+60m" onClick={() => setChargedMins(p => p + 60)} />
              {chargedMins > 0 && (
                <ChargeBtn label="✕" onClick={() => setChargedMins(0)} />
              )}
            </div>

            {/* Attack button */}
            <button
              disabled={chargedMins <= 0}
              onClick={() => {
                if (chargedMins > 0) {
                  setTimeLeft(chargedMins * 60);
                  setIsAttacking(true);
                }
              }}
              style={{
                border:     chargedMins > 0 ? '2px solid #7f1d1d' : '2px solid #1a1a2a',
                background: chargedMins > 0 ? '#1a0000' : '#080810',
                color:      chargedMins > 0 ? '#ef4444' : '#252535',
                fontSize:   '8px',
                padding:    '8px 16px',
                fontFamily: '"Press Start 2P", monospace',
                cursor:     chargedMins > 0 ? 'pointer' : 'not-allowed',
                boxShadow:  chargedMins > 0 ? '3px 3px 0 #000' : 'none',
                animation:  chargedMins > 0 ? 'blood-throb 1.8s ease-in-out infinite' : 'none',
                transition: 'border 0.2s, background 0.2s, color 0.2s',
                letterSpacing: '0.05em',
              }}
            >
              ⚔ ATACAR
            </button>
          </div>
        )}
      </div>

      {/* ── Keyframe defs ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes blood-throb {
          0%, 100% { box-shadow: 3px 3px 0 #000, 0 0 0 rgba(127,29,29,0); }
          50%       { box-shadow: 3px 3px 0 #000, 0 0 12px rgba(185,28,28,0.5); }
        }
        @keyframes ember-pulse {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
