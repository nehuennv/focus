import { useState, useEffect } from 'react';
import { useStore, BEASTS, calculateXpGain, calculateRankIndex, getRankDisplay } from '../store/useStore';
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

// ── Charge button ──────────────────────────────────────────────────────────────
function ChargeBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        border:     `2px solid ${accent ? 'rgba(220,38,38,0.55)' : 'rgba(120,80,40,0.5)'}`,
        background: accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)',
        color:      accent ? '#f87171' : '#c8a87a',
        fontSize:   12,
        padding:    '10px 16px',
        fontFamily: '"Press Start 2P", monospace',
        cursor:     'pointer',
        boxShadow:  '2px 2px 0 rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        backdropFilter: 'blur(4px)',
      }}
      onMouseEnter={e => {
        const b = e.currentTarget;
        b.style.background = accent ? 'rgba(140,0,0,0.6)' : 'rgba(40,24,10,0.7)';
        b.style.color      = accent ? '#fca5a5' : '#f0d8a8';
        b.style.borderColor = accent ? 'rgba(239,68,68,0.8)' : 'rgba(180,120,60,0.7)';
      }}
      onMouseLeave={e => {
        const b = e.currentTarget;
        b.style.background = accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)';
        b.style.color      = accent ? '#f87171' : '#c8a87a';
        b.style.borderColor = accent ? 'rgba(220,38,38,0.55)' : 'rgba(120,80,40,0.5)';
      }}
    >
      {label}
    </button>
  );
}

export function Encounter({ domainId, selectedBeastId, onBack }: EncounterProps) {
  const { completeRitual, domains, player } = useStore();
  const [isResting,     setIsResting]     = useState(false);
  const [chargedMins,   setChargedMins]   = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [isAttacking,   setIsAttacking]   = useState(false);
  const [flashOn,       setFlashOn]       = useState(true);
  const [entrancePhase, setEntrancePhase] = useState<'bg' | 'boss' | 'ui' | 'done'>('bg');
  const [xpPopup,       setXpPopup]       = useState<{ xp: number; bossDefeated: boolean; leveledUp: boolean; newLevel: number } | null>(null);

  const domain = domains.find(d => d.id === domainId);

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAttacking || !domain) return;
    if (timeLeft > 0) {
      const iv = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(iv);
    }
    const rankBefore    = player.rankIndex;
    const isNowDefeated = Math.max(0, domain.currentDebtMins - chargedMins) <= 0;
    const bossDefeated  = isNowDefeated && !domain.isDefeated;
    const xpGained      = calculateXpGain(chargedMins, bossDefeated);
    const rankAfter     = calculateRankIndex(player.totalAccumulatedMins + chargedMins);

    completeRitual(domain.id, selectedBeastId, chargedMins);
    setIsAttacking(false);
    setChargedMins(0);
    setXpPopup({ xp: xpGained, bossDefeated, leveledUp: rankAfter > rankBefore, newLevel: rankAfter });
    setTimeout(() => { setXpPopup(null); setIsResting(true); }, 3400);
  }, [isAttacking, timeLeft, domain, completeRitual, selectedBeastId, chargedMins, player]);

  // ── Damage flash ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chargedMins || isAttacking) return;
    const iv = setInterval(() => setFlashOn(f => !f), 500);
    return () => clearInterval(iv);
  }, [chargedMins, isAttacking]);

  // ── Entrance sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setEntrancePhase('boss'), 700);
    const t2 = setTimeout(() => setEntrancePhase('ui'),   1300);
    const t3 = setTimeout(() => setEntrancePhase('done'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!domain) return null;

  const beast      = BEASTS[selectedBeastId as keyof typeof BEASTS];
  const isDefeated = domain.currentDebtMins <= 0;

  const barMax        = Math.max(domain.weeklyTargetMins, domain.currentDebtMins, 1);
  const visualDebt    = Math.max(0, domain.currentDebtMins - chargedMins);
  const currentPct    = Math.min(100, (domain.currentDebtMins / barMax) * 100);
  const visualPct     = Math.max(0, Math.min(100, (visualDebt / barMax) * 100));
  const damagePct     = currentPct - visualPct;
  const hasDmgPreview = chargedMins > 0 && !isAttacking && domain.currentDebtMins > 0;

  const previewBossKill = hasDmgPreview && visualDebt <= 0;
  const previewXp       = hasDmgPreview ? calculateXpGain(chargedMins, previewBossKill) : 0;

  if (isResting) return <RestScreen onFinish={onBack} />;

  const bossFilter = isDefeated
    ? 'grayscale(80%) brightness(0.35) drop-shadow(8px 8px 0 rgba(0,0,0,1))'
    : isAttacking
      ? 'hue-rotate(-18deg) saturate(1.5) brightness(0.88) contrast(1.08) drop-shadow(0 0 50px rgba(200,20,20,0.75)) drop-shadow(0 0 100px rgba(160,0,0,0.4)) drop-shadow(14px 18px 0 rgba(0,0,0,0.95))'
      : 'drop-shadow(8px 10px 0 rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(0,0,0,0.5))';

  const uiVisible = entrancePhase === 'done';
  const uiSlide = (fromTop: boolean): React.CSSProperties => ({
    opacity:    uiVisible ? 1 : 0,
    transform:  uiVisible ? 'translateY(0)' : `translateY(${fromTop ? -24 : 24}px)`,
    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
  });

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ background: '#0a0504', fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* L0 — Beast background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url(${beast?.bgImg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: entrancePhase !== 'bg' ? 1 : 0,
        transition: 'opacity 1.1s ease-in-out',
      }} />

      {/* L1 — Atmospheric overlay */}
      <div className="absolute inset-0" style={{
        background: isAttacking
          ? 'radial-gradient(ellipse at 50% 40%, rgba(90,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)'
          : 'radial-gradient(ellipse at 50% 40%, rgba(20,0,40,0.3) 0%, rgba(0,0,0,0.78) 100%)',
        transition: 'background 1.5s ease',
      }} />

      {/* L2 — Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 4px)',
        zIndex: 3,
      }} />

      {/* L3 — Giant background timer */}
      {isAttacking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
          <span style={{
            fontSize: 'clamp(120px, 26vw, 380px)',
            color: 'rgba(255,255,255,0.6)', lineHeight: 1, letterSpacing: '-0.02em',
            userSelect: 'none',
          }}>
            {fmt(timeLeft)}
          </span>
        </div>
      )}

      {/* L4 — Boss sprite */}
      <div className="absolute inset-0 flex items-center justify-center" style={{
        zIndex: 10, paddingBottom: 200, paddingTop: 70,
        opacity: entrancePhase === 'bg' ? 0 : entrancePhase === 'boss' ? 0 : 1,
        transform: entrancePhase === 'bg' ? 'translateY(40px) scale(0.94)' : 'translateY(0) scale(1)',
        transition: 'opacity 0.9s ease-out, transform 0.9s ease-out',
      }}>
        <img
          src={beast?.spriteImg} alt={beast?.name}
          style={{
            maxHeight: '62vh', objectFit: 'contain', imageRendering: 'pixelated',
            filter: bossFilter,
            animation: isDefeated ? 'none' : isAttacking ? 'boss-combat 3.2s ease-in-out infinite' : 'float 4s ease-in-out infinite',
            opacity: isDefeated ? 0.45 : 1,
          }}
        />
      </div>

      {/* L5 — Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.55) 100%),' +
          'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.45) 100%)',
        zIndex: 11,
      }} />

      {/* L5b — Combat heartbeat */}
      {isAttacking && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(180,0,0,0.22) 0%, rgba(120,0,0,0.1) 50%, transparent 100%)',
          zIndex: 12,
          animation: 'combat-heartbeat 2.1s ease-in-out infinite',
        }} />
      )}

      {/* L6 — TOP HUD ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between" style={{
        zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 100%)',
        padding: '14px 24px 32px',
        ...uiSlide(true),
      }}>
        <button onClick={onBack} style={{
          border: '2px solid rgba(100,65,30,0.5)',
          background: 'rgba(10,6,2,0.55)',
          color: '#a08060',
          fontSize: 11, padding: '8px 14px',
          fontFamily: '"Press Start 2P", monospace',
          cursor: 'pointer',
          boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}>
          ← VOLVER
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#b89060', letterSpacing: '0.15em', textShadow: '1px 1px 0 #000' }}>
            {isAttacking ? '⚔  EN COMBATE' : chargedMins > 0 ? `OFRENDA LISTA · ${fmtMins(chargedMins)}` : '⸺  PREPARACIÓN  ⸺'}
          </div>
        </div>

        {isAttacking ? (
          <button onClick={() => { setIsAttacking(false); setTimeLeft(0); setChargedMins(0); }} style={{
            border: '2px solid rgba(180,30,30,0.6)',
            background: 'rgba(80,0,0,0.5)',
            color: '#ef4444',
            fontSize: 11, padding: '8px 14px',
            fontFamily: '"Press Start 2P", monospace',
            cursor: 'pointer',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}>
            HUIR
          </button>
        ) : <div style={{ width: 90 }} />}
      </div>

      {/* L7 — BOTTOM HUD ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        zIndex: 20,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)',
        padding: '36px 24px 22px',
        ...uiSlide(false),
      }}>
        {/* Row A — Boss + Domain */}
        <div className="flex justify-between items-end" style={{ marginBottom: 12 }}>
          <div>
            <h2 style={{
              fontSize: 20, letterSpacing: '0.08em', marginBottom: 3,
              color: isDefeated ? '#52525b' : '#fbbf24',
              textShadow: isDefeated ? '2px 2px 0 #000' : '0 0 24px rgba(251,191,36,0.5), 3px 3px 0 #000',
            }}>
              {beast?.name?.toUpperCase()}
            </h2>
            <p style={{ fontSize: 9, color: '#6b5040', letterSpacing: '0.14em' }}>JEFE DE DOMINIO</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: '#c8a070', letterSpacing: '0.05em', marginBottom: 3, textShadow: '1px 1px 0 #000' }}>{domain.name}</p>
            <p style={{ fontSize: 9, color: '#6b5040', letterSpacing: '0.08em' }}>META · {fmtMins(domain.weeklyTargetMins)}/sem</p>
          </div>
        </div>

        {/* Row B — HP bar */}
        <div style={{ marginBottom: 14 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: '#a08060', letterSpacing: '0.14em', textShadow: '1px 1px 0 #000' }}>
              {isDefeated ? '' : '☠ DEUDA'}
            </span>
            <span style={{ fontSize: 10, textShadow: '1px 1px 0 #000', color: isDefeated ? '#4ade80' : '#8b6040' }}>
              {isDefeated ? '✦  PURGADA  ✦' : `${fmtMins(visualDebt)} restante`}
            </span>
          </div>
          <div style={{ position: 'relative', height: 16, background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(100,20,20,0.6)', overflow: 'hidden' }}>
            {!isDefeated && (
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${visualPct}%`, background: 'linear-gradient(to right, #7f1d1d, #b91c1c)', transition: 'width 0.4s ease' }} />
            )}
            {hasDmgPreview && damagePct > 0 && (
              <div style={{ position: 'absolute', left: `${visualPct}%`, top: 0, height: '100%', width: `${damagePct}%`, background: flashOn ? '#dc2626' : '#991b1b', transition: 'background 0.15s' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.3) calc(10% - 1px), rgba(0,0,0,0.3) 10%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          </div>
          <div className="flex justify-between items-center" style={{ marginTop: 5 }}>
            <span style={{ fontSize: 10, color: '#7a6050', textShadow: '1px 1px 0 #000' }}>
              {isDefeated ? '0' : fmtMins(domain.currentDebtMins)} / {fmtMins(domain.weeklyTargetMins)}
            </span>
            {hasDmgPreview && (
              <div style={{ display: 'flex', gap: 14 }}>
                <span style={{ fontSize: 10, color: flashOn ? '#ef4444' : '#991b1b', transition: 'color 0.15s', textShadow: '1px 1px 0 #000' }}>
                  −{fmtMins(chargedMins)}
                </span>
                <span style={{ fontSize: 10, color: '#d97706', textShadow: '1px 1px 0 #000' }}>
                  +{previewXp} XP{previewBossKill ? ' ★' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Row C — Controls */}
        {isDefeated ? (
          <div className="text-center py-3" style={{
            border: '2px solid rgba(146,64,14,0.6)',
            background: 'rgba(28,8,0,0.6)',
            backdropFilter: 'blur(6px)',
            animation: 'ember-pulse 2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 13, color: '#fbbf24', letterSpacing: '0.12em', textShadow: '0 0 16px rgba(251,191,36,0.6), 2px 2px 0 #000' }}>
              ✦  DEUDA PURGADA  ·  JEFE DERROTADO  ✦
            </span>
          </div>
        ) : isAttacking ? (
          <div className="flex items-center justify-center gap-4">
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, rgba(220,38,38,0.6))' }} />
            <span style={{ fontSize: 11, color: '#ef4444', letterSpacing: '0.15em', textShadow: '0 0 12px rgba(220,38,38,0.5), 1px 1px 0 #000' }}>⚔  RITUAL ACTIVO</span>
            <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, rgba(220,38,38,0.6))' }} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              <ChargeBtn label="+10m"  onClick={() => setChargedMins(p => p + 10)} />
              <ChargeBtn label="+30m"  onClick={() => setChargedMins(p => p + 30)} />
              <ChargeBtn label="+60m"  onClick={() => setChargedMins(p => p + 60)} />
              <ChargeBtn label="+120m" onClick={() => setChargedMins(p => p + 120)} />
              {chargedMins > 0 && <ChargeBtn label="✕" onClick={() => setChargedMins(0)} accent />}
            </div>
            <button
              disabled={chargedMins <= 0}
              onClick={() => { if (chargedMins > 0) { setTimeLeft(chargedMins * 60); setIsAttacking(true); } }}
              style={{
                border: chargedMins > 0 ? '2px solid rgba(200,38,38,0.7)' : '2px solid rgba(60,40,20,0.4)',
                background: chargedMins > 0 ? 'rgba(100,0,0,0.55)' : 'rgba(8,8,16,0.45)',
                color: chargedMins > 0 ? '#ef4444' : '#3a3a50',
                fontSize: 13, padding: '12px 22px',
                fontFamily: '"Press Start 2P", monospace',
                cursor: chargedMins > 0 ? 'pointer' : 'not-allowed',
                boxShadow: chargedMins > 0 ? '3px 3px 0 rgba(0,0,0,0.7), 0 0 20px rgba(180,0,0,0.3)' : 'none',
                animation: chargedMins > 0 ? 'blood-throb 1.8s ease-in-out infinite' : 'none',
                transition: 'border 0.2s, background 0.2s, color 0.2s',
                letterSpacing: '0.08em', whiteSpace: 'nowrap',
                backdropFilter: 'blur(4px)',
              }}
            >
              ⚔  ATACAR
            </button>
          </div>
        )}
      </div>

      {/* XP Popup ──────────────────────────────────────────────────────────── */}
      {xpPopup && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 50, background: 'rgba(0,0,0,0.8)', animation: 'fadein 0.4s ease-out' }}>
          <div style={{ textAlign: 'center', animation: 'xp-rise 3.4s ease-out forwards' }}>
            <div style={{ fontSize: 'clamp(52px, 11vw, 100px)', color: '#fbbf24', textShadow: '0 0 50px rgba(251,191,36,0.9), 5px 5px 0 #000', fontFamily: '"Press Start 2P", monospace', letterSpacing: '-0.02em' }}>
              +{xpPopup.xp} XP
            </div>
            {xpPopup.bossDefeated && (
              <div style={{ marginTop: 20, fontSize: 14, color: '#fca5a5', textShadow: '2px 2px 0 #000', fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.08em' }}>
                ☠  JEFE DERROTADO  ·  +150 XP BONUS
              </div>
            )}
            {xpPopup.leveledUp && (() => {
              const rd = getRankDisplay(xpPopup.newLevel);
              return (
                <div style={{ marginTop: 24, padding: '16px 32px', border: `3px solid ${rd.era.border}`, background: rd.era.bg, fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: rd.era.color, textShadow: '2px 2px 0 #000', boxShadow: `5px 5px 0 #000, 0 0 40px ${rd.era.glow}`, animation: 'ember-pulse 0.7s ease-in-out infinite', letterSpacing: '0.08em' }}>
                  {rd.era.icon}  {rd.fullTitle.toUpperCase()} ALCANZADO  {rd.era.icon}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float         { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes boss-combat   {
          0%   { transform: translateY(0px)   rotate(0deg); }
          12%  { transform: translateY(-14px) rotate(-0.6deg) scale(1.012); }
          25%  { transform: translateY(-8px)  rotate(0.4deg); }
          40%  { transform: translateY(-22px) rotate(-0.5deg) scale(1.018); }
          55%  { transform: translateY(-12px) rotate(0.6deg); }
          70%  { transform: translateY(-18px) rotate(-0.3deg) scale(1.01); }
          85%  { transform: translateY(-6px)  rotate(0.4deg); }
          100% { transform: translateY(0px)   rotate(0deg); }
        }
        @keyframes combat-heartbeat {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          18%  { opacity: 0.15; }
          28%  { opacity: 0.85; }
          40%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes blood-throb  { 0%,100%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 0 rgba(127,29,29,0)} 50%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 20px rgba(185,28,28,0.7)} }
        @keyframes ember-pulse  { 0%,100%{opacity:0.82} 50%{opacity:1} }
        @keyframes fadein       { from{opacity:0} to{opacity:1} }
        @keyframes xp-rise      { 0%{opacity:0;transform:translateY(36px) scale(0.82)} 14%{opacity:1;transform:translateY(0) scale(1.04)} 22%{transform:scale(1)} 78%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-44px)} }
      `}</style>
    </div>
  );
}
