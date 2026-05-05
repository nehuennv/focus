import { useState, useEffect, useRef } from 'react';
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
        border: `2px solid ${accent ? 'rgba(220,38,38,0.55)' : 'rgba(120,80,40,0.5)'}`,
        background: accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)',
        color: accent ? '#f87171' : '#c8a87a',
        fontSize: 12,
        padding: '10px 16px',
        fontFamily: '"Press Start 2P", monospace',
        cursor: 'pointer',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        backdropFilter: 'blur(4px)',
      }}
      onMouseEnter={e => {
        const b = e.currentTarget;
        b.style.background = accent ? 'rgba(140,0,0,0.6)' : 'rgba(40,24,10,0.7)';
        b.style.color = accent ? '#fca5a5' : '#f0d8a8';
        b.style.borderColor = accent ? 'rgba(239,68,68,0.8)' : 'rgba(180,120,60,0.7)';
      }}
      onMouseLeave={e => {
        const b = e.currentTarget;
        b.style.background = accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)';
        b.style.color = accent ? '#f87171' : '#c8a87a';
        b.style.borderColor = accent ? 'rgba(220,38,38,0.55)' : 'rgba(120,80,40,0.5)';
      }}
    >
      {label}
    </button>
  );
}

export function Encounter({ domainId, selectedBeastId, onBack }: EncounterProps) {
  const { completeRitual, domains, player } = useStore();
  const [isResting, setIsResting] = useState(false);
  const [chargedMins, setChargedMins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [flashOn, setFlashOn] = useState(true);
  const [entrancePhase, setEntrancePhase] = useState<'bg' | 'boss' | 'ui' | 'done'>('bg');
  const [victory, setVictory] = useState<{ xp: number; bossDefeated: boolean; leveledUp: boolean; newLevel: number; mins: number; beastName: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'back' | 'flee'; message: string } | null>(null);
  const [exiting, setExiting] = useState(false);
  const ritualFiredRef = useRef(false);

  const domain = domains.find(d => d.id === domainId);

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAttacking || !domain) return;
    if (timeLeft > 0) {
      const iv = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(iv);
    }
    // Timer reached 0 — fire ritual exactly once
    if (ritualFiredRef.current) return;
    ritualFiredRef.current = true;

    const rankBefore = player.rankIndex;
    const isNowDefeated = Math.max(0, domain.currentDebtMins - chargedMins) <= 0;
    const bossDefeated = isNowDefeated && !domain.isDefeated;
    const xpGained = calculateXpGain(chargedMins, bossDefeated);
    const rankAfter = calculateRankIndex(player.totalAccumulatedMins + chargedMins);
    const minsOffered = chargedMins;
    const bName = BEASTS[selectedBeastId as keyof typeof BEASTS]?.name ?? selectedBeastId;

    completeRitual(domain.id, selectedBeastId, chargedMins);
    setIsAttacking(false);
    setChargedMins(0);
    setVictory({ xp: xpGained, bossDefeated, leveledUp: rankAfter > rankBefore, newLevel: rankAfter, mins: minsOffered, beastName: bName });
    setTimeout(() => { setVictory(null); setIsResting(true); }, 5000);
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
    const t2 = setTimeout(() => setEntrancePhase('ui'), 1300);
    const t3 = setTimeout(() => setEntrancePhase('done'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!domain) return null;

  const beast = BEASTS[selectedBeastId as keyof typeof BEASTS];
  const bossScale = beast?.scale ?? 1.0;
  const isDefeated = domain.currentDebtMins <= 0;

  const barMax = Math.max(domain.weeklyTargetMins, domain.currentDebtMins, 1);
  const visualDebt = Math.max(0, domain.currentDebtMins - chargedMins);
  const currentPct = Math.min(100, (domain.currentDebtMins / barMax) * 100);
  const visualPct = Math.max(0, Math.min(100, (visualDebt / barMax) * 100));
  const damagePct = currentPct - visualPct;
  const hasDmgPreview = chargedMins > 0 && !isAttacking && domain.currentDebtMins > 0;

  const previewBossKill = hasDmgPreview && visualDebt <= 0;
  const previewXp = hasDmgPreview ? calculateXpGain(chargedMins, previewBossKill) : 0;

  if (isResting) return <RestScreen onFinish={onBack} />;

  const bossColor = beast?.color ?? '#888888';
  const bossFilter = isDefeated
    ? 'grayscale(90%) brightness(0.3) drop-shadow(4px 4px 0 rgba(0,0,0,1)) drop-shadow(0 8px 16px rgba(0,0,0,0.8))'
    : isAttacking
      ? `brightness(1.12) contrast(1.08) saturate(1.25)
         drop-shadow(4px 4px 0 rgba(0,0,0,0.98))
         drop-shadow(0 0 22px ${bossColor}ee)
         drop-shadow(0 0 55px ${bossColor}99)
         drop-shadow(0 0 100px ${bossColor}44)`
      : `drop-shadow(4px 4px 0 rgba(0,0,0,0.95))
         drop-shadow(0 8px 18px rgba(0,0,0,0.7))
         drop-shadow(0 0 22px ${bossColor}55)`;

  const uiVisible = entrancePhase === 'done';
  const uiSlide = (fromTop: boolean): React.CSSProperties => ({
    opacity: uiVisible ? 1 : 0,
    transform: uiVisible ? 'translateY(0)' : `translateY(${fromTop ? -24 : 24}px)`,
    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
  });

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{
        background: '#0a0504',
        fontFamily: '"Press Start 2P", monospace',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.5s ease-in',
      }}
    >
      {/* Blurred ambient fill for ultra-wide (outside 16:9) */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url(img/originales/${beast?.id}Bg.png)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(32px) brightness(0.28)',
        transform: 'scale(1.1)',
        opacity: entrancePhase !== 'bg' ? 1 : 0,
        transition: 'opacity 1.2s ease-in-out',
        zIndex: 0,
      }} />

      {/* 16:9 centered scene container */}
      <div className="absolute top-0 bottom-0 overflow-hidden" style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(100vw, calc(100vh * 21 / 9))',
        zIndex: 1,
      }}>

      {/* L0 — Full-screen boss background wallpaper */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url(img/originales/${beast?.id}Bg.png)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        imageRendering: 'pixelated',
        opacity: entrancePhase !== 'bg' ? 1 : 0,
        transform: entrancePhase !== 'bg' ? 'scale(1)' : 'scale(1.04)',
        transition: 'opacity 1.2s ease-in-out, transform 1.6s ease-out',
      }} />

      {/* L1 — Atmospheric tint (soft, lets bg breathe) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isAttacking
          ? 'radial-gradient(ellipse at 50% 50%, rgba(80,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%)'
          : 'radial-gradient(ellipse at 50% 50%, rgba(20,10,30,0.15) 0%, rgba(0,0,0,0.38) 100%)',
        transition: 'background 1.5s ease',
        zIndex: 1,
      }} />

      {/* L2 — CRT scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
        zIndex: 3,
      }} />

      {/* L4 — Boss */}
      <div className="absolute left-1/2" style={{
        top: 'clamp(52px, 7vh, 90px)',
        transform: 'translateX(-50%)',
        zIndex: 10,
        opacity: entrancePhase === 'bg' || entrancePhase === 'boss' ? 0 : 1,
        transition: 'opacity 0.9s ease-out',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <img
          src={`img/personaje/jefes/${beast?.id}.png`}
          alt={beast?.name}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = beast?.spriteImg || ''; }}
          style={{
            height: `clamp(${Math.round(140 * bossScale)}px, ${(22 * bossScale).toFixed(1)}vh, ${Math.round(260 * bossScale)}px)`,
            objectFit: 'contain', imageRendering: 'pixelated',
            filter: bossFilter,
            animation: isDefeated
              ? 'none'
              : isAttacking
                ? 'boss-combat 3.2s ease-in-out infinite'
                : beast?.floats
                  ? 'boss-float 4s ease-in-out infinite'
                  : 'boss-breathe 3.2s ease-in-out infinite',
            opacity: isDefeated ? 0.4 : 1,
          }}
        />
        {/* Boss shadow — solo capa de contacto, 70% del ancho estimado del jefe */}
        <div style={{
          width: `clamp(${Math.round(80 * bossScale)}px, ${(13 * bossScale).toFixed(1)}vh, ${Math.round(150 * bossScale)}px)`,
          height: 12,
          marginTop: beast?.floats ? -10 : -7,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(3px)',
            animation: isDefeated
              ? 'none'
              : beast?.floats && !isAttacking
                ? 'shadow-float-contact 4s ease-in-out infinite'
                : undefined,
            opacity: isDefeated ? 0.15 : 0.85,
          }} />
        </div>
      </div>

      {/* L4b — Player (fijo en el suelo) */}
      <div className="absolute left-1/2" style={{
        bottom: 'clamp(175px, 20vh, 240px)',
        transform: 'translateX(-50%)',
        zIndex: 10,
        opacity: entrancePhase === 'bg' ? 0 : 1,
        transition: 'opacity 1.1s ease-out 0.3s',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <img
          src="img/personaje/de-espaldas-reposo.png"
          alt="Jugador"
          style={{
            height: 'clamp(130px, 20vh, 240px)',
            objectFit: 'contain', imageRendering: 'pixelated',
            filter: isAttacking
              ? `drop-shadow(4px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 8px 14px rgba(0,0,0,0.7)) drop-shadow(0 0 32px ${bossColor}66)`
              : `drop-shadow(4px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 8px 14px rgba(0,0,0,0.65)) drop-shadow(0 0 18px ${bossColor}28)`,
            animation: 'player-breathe 4s ease-in-out infinite',
            transformOrigin: 'bottom center',
          }}
        />
        {/* Player shadow — contact shadow, fija (no anima) */}
        <div style={{
          position: 'relative',
          width: 'clamp(90px, 14vh, 165px)',
          height: 14,
          marginTop: -7,
        }}>
          {/* Ambient layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(5px)',
          }} />
          {/* Contact layer — sharp, directo bajo los pies */}
          <div style={{
            position: 'absolute',
            left: '20%', right: '20%',
            top: '20%', bottom: '5%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 75%)',
            filter: 'blur(1px)',
          }} />
        </div>
      </div>

      {/* L3 — CENTRAL GIANT TIMER (the focal point) */}
      {isAttacking && (
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 15, top: '45%', transform: 'translateY(-50%)' }}>
          <div style={{
            padding: '20px 50px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 80%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(80px, 30vw, 290px)',
              fontFamily: '"Jersey 10", cursive',
              fontWeight: 400,
              color: '#f3d9a3',
              opacity: 0.6,
              lineHeight: 1,
              letterSpacing: '0.01em',
              textShadow:
                '0 0 40px rgba(0,0,0,0.95), 0 0 90px rgba(200,130,60,0.4), 6px 6px 0 #000, 10px 10px 0 rgba(0,0,0,0.55)',
              animation: 'timer-breathe 3.6s ease-in-out infinite',
            }}>
              {fmt(timeLeft)}
            </div>
          </div>
        </div>
      )}

      {/* L5 — Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 68%, rgba(0,0,0,0.7) 100%),' +
          'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.45) 100%)',
        zIndex: 11,
      }} />

      {/* L5b — Combat aura (color del jefe, sin rojo fijo) */}
      {isAttacking && (
        <>
          {/* Aura radial desde los bordes con color del jefe */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at 50% 50%, transparent 28%, ${bossColor}18 62%, ${bossColor}40 100%)`,
            zIndex: 12,
            animation: 'combat-aura 3s ease-in-out infinite',
          }} />
          {/* Franja superior e inferior — sensación de tensión */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `linear-gradient(to bottom, ${bossColor}30 0%, transparent 12%, transparent 88%, ${bossColor}30 100%)`,
            zIndex: 12,
            animation: 'combat-edge 2.2s ease-in-out infinite',
          }} />
        </>
      )}

      {/* L6 — TOP HUD ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between" style={{
        zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 100%)',
        padding: '14px 24px 32px',
        ...uiSlide(true),
      }}>
        <button onClick={() => setConfirmModal({ type: 'back', message: '¿Seguro que deseas volver? Perderás el progreso de este ritual.' })} style={{
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
          <button onClick={() => setConfirmModal({ type: 'flee', message: '¿Seguro que deseas huir? Perderás la ofrenda cargada.' })} style={{
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
              <ChargeBtn label="+10m" onClick={() => setChargedMins(p => p + 10)} />
              <ChargeBtn label="+30m" onClick={() => setChargedMins(p => p + 30)} />
              <ChargeBtn label="+60m" onClick={() => setChargedMins(p => p + 60)} />
              <ChargeBtn label="+120m" onClick={() => setChargedMins(p => p + 120)} />
              {chargedMins > 0 && <ChargeBtn label="✕" onClick={() => setChargedMins(0)} accent />}
            </div>
            <button
              disabled={chargedMins <= 0}
              onClick={() => { if (chargedMins > 0) { ritualFiredRef.current = false; setTimeLeft(chargedMins * 60); setIsAttacking(true); } }}
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

      {/* ── VICTORY SCREEN ────────────────────────────────────────────────── */}
      {victory && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            zIndex: 50,
            background: victory.bossDefeated
              ? 'radial-gradient(ellipse at 50% 40%, rgba(120,0,0,0.55) 0%, rgba(0,0,0,0.93) 65%)'
              : 'radial-gradient(ellipse at 50% 40%, rgba(30,20,60,0.55) 0%, rgba(0,0,0,0.93) 65%)',
            animation: 'fadein 0.5s ease-out',
            fontFamily: '"Press Start 2P", monospace',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          {/* Top rule */}
          <div style={{ width: 280, height: 1, background: victory.bossDefeated ? 'rgba(220,38,38,0.6)' : 'rgba(100,80,200,0.6)', marginBottom: 24, animation: 'victory-expand 0.7s ease-out' }} />

          {/* Main title */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 36px)',
              letterSpacing: '0.12em',
              color: victory.bossDefeated ? '#ef4444' : '#a78bfa',
              textShadow: victory.bossDefeated
                ? '0 0 40px rgba(220,38,38,0.8), 4px 4px 0 #000'
                : '0 0 40px rgba(167,139,250,0.7), 4px 4px 0 #000',
              animation: 'victory-drop 0.6s ease-out',
              marginBottom: 8,
            }}
          >
            {victory.bossDefeated ? '☠  BESTIA CAZADA' : '✦  RITUAL CONSUMADO'}
          </div>

          {/* Beast name */}
          <div style={{ fontSize: 'clamp(9px, 2vw, 13px)', color: '#8b7355', letterSpacing: '0.2em', marginBottom: 32, animation: 'fadein 0.9s ease-out' }}>
            {victory.beastName.toUpperCase()}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 36, animation: 'fadein 1.1s ease-out' }}>
            <div>
              <div style={{ fontSize: 7, color: '#5c4a3d', letterSpacing: '0.15em', marginBottom: 6 }}>OFRENDA</div>
              <div style={{ fontSize: 18, color: '#c8a070', textShadow: '2px 2px 0 #000' }}>
                {victory.mins >= 60
                  ? `${Math.floor(victory.mins / 60)}h ${victory.mins % 60 > 0 ? `${victory.mins % 60}m` : ''}`
                  : `${victory.mins}m`}
              </div>
            </div>
            <div style={{ width: 1, background: '#2a1810' }} />
            <div>
              <div style={{ fontSize: 7, color: '#5c4a3d', letterSpacing: '0.15em', marginBottom: 6 }}>EXPERIENCIA</div>
              <div style={{ fontSize: 'clamp(26px, 6vw, 52px)', color: '#fbbf24', textShadow: '0 0 30px rgba(251,191,36,0.7), 4px 4px 0 #000', animation: 'xp-slam 0.5s 0.4s ease-out both' }}>
                +{victory.xp} XP
              </div>
            </div>
          </div>

          {/* Rank-up banner */}
          {victory.leveledUp && (() => {
            const rd = getRankDisplay(victory.newLevel);
            return (
              <div style={{
                padding: '14px 28px', marginBottom: 24,
                border: `3px solid ${rd.era.border}`,
                background: rd.era.bg,
                fontSize: 'clamp(9px, 2vw, 13px)',
                color: rd.era.color,
                textShadow: '2px 2px 0 #000',
                boxShadow: `5px 5px 0 #000, 0 0 40px ${rd.era.glow}`,
                animation: 'ember-pulse 0.7s ease-in-out infinite',
                letterSpacing: '0.1em',
              }}>
                {rd.era.icon}  ¡RANGO ALCANZADO!  {rd.era.icon}
                <div style={{ fontSize: 8, marginTop: 8, color: rd.era.color, opacity: 0.85 }}>
                  {rd.fullTitle.toUpperCase()}
                </div>
              </div>
            );
          })()}

          {/* Bottom rule */}
          <div style={{ width: 280, height: 1, background: victory.bossDefeated ? 'rgba(220,38,38,0.6)' : 'rgba(100,80,200,0.6)', marginTop: 4, animation: 'victory-expand 0.7s ease-out' }} />

          {/* Auto-advance hint */}
          <div style={{ marginTop: 18, fontSize: 7, color: '#3d2817', letterSpacing: '0.15em', animation: 'fadein 2s ease-out' }}>
            CONTINUANDO A LA FOGATA...
          </div>
        </div>
      )}

      {/* Confirm Modal ─────────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ zIndex: 60, background: 'rgba(0,0,0,0.7)' }}>
          <div style={{
            border: '3px solid #92400e',
            background: 'rgba(15,8,4,0.95)',
            boxShadow: '0 0 60px rgba(0,0,0,0.95), 4px 4px 0 #000, 0 0 40px rgba(146,64,14,0.3)',
            padding: '24px 32px',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 'clamp(10px, 2vw, 12px)',
              color: '#ede0c8',
              lineHeight: 1.8,
              letterSpacing: '0.08em',
              marginBottom: 24,
              textShadow: '0 0 20px rgba(0,0,0,0.8)',
            }}>
              {confirmModal.message}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  border: '2px solid rgba(100,65,30,0.5)',
                  background: 'rgba(10,6,2,0.55)',
                  color: '#a08060',
                  fontSize: 10, padding: '8px 16px',
                  fontFamily: '"Press Start 2P", monospace',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  setConfirmModal(null);
                  if (confirmModal.type === 'back') {
                    setExiting(true);
                    setTimeout(onBack, 600);
                  } else if (confirmModal.type === 'flee') {
                    // Do NOT set timeLeft(0) — that would trigger the countdown completion logic
                    setIsAttacking(false);
                    setChargedMins(0);
                    setTimeLeft(0);
                    // Mark as already fired so if the effect re-runs it's a no-op
                    ritualFiredRef.current = true;
                  }
                }}
                style={{
                  border: '2px solid rgba(220,38,38,0.7)',
                  background: 'rgba(100,0,0,0.55)',
                  color: '#ef4444',
                  fontSize: 10, padding: '8px 16px',
                  fontFamily: '"Press Start 2P", monospace',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      </div>{/* end 16:9 scene */}

      <style>{`
        /* ── Boss: flota (ethereal) ── */
        @keyframes boss-float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-20px); }
        }
        /* ── Boss: fijo en suelo (breathing) ── */
        @keyframes boss-breathe {
          0%,100% { transform: scale(1) translateY(0); }
          50%     { transform: scale(1.012) translateY(-2px); }
        }
        /* ── Boss: en combate (más agresivo, micro-shakes) ── */
        @keyframes boss-combat {
          0%   { transform: translateY(0px)    rotate(0deg)    scale(1); }
          8%   { transform: translateY(-18px)  rotate(-0.9deg) scale(1.022); }
          18%  { transform: translateY(-9px)   rotate(0.5deg)  scale(1.008); }
          30%  { transform: translateY(-26px)  rotate(-0.7deg) scale(1.028); }
          42%  { transform: translateY(-14px)  rotate(0.8deg)  scale(1.012); }
          55%  { transform: translateY(-22px)  rotate(-0.5deg) scale(1.02); }
          68%  { transform: translateY(-8px)   rotate(0.6deg)  scale(1.006); }
          80%  { transform: translateY(-19px)  rotate(-0.4deg) scale(1.015); }
          92%  { transform: translateY(-5px)   rotate(0.3deg); }
          100% { transform: translateY(0px)    rotate(0deg)    scale(1); }
        }
        /* ── Sombra flotante: inversa del float (cuando sube → sombra pequeña) ── */
        @keyframes shadow-float {
          0%,100% { transform: scaleX(1.0);  opacity: 1;    filter: blur(5px); }
          50%     { transform: scaleX(0.55); opacity: 0.35; filter: blur(8px); }
        }
        @keyframes shadow-float-contact {
          0%,100% { transform: scaleX(1.0);  opacity: 0.9; }
          50%     { transform: scaleX(0.4);  opacity: 0.2; }
        }
        /* ── Player: fijo, solo respira (sin Y) ── */
        @keyframes player-breathe {
          0%,100% { transform: scale(1);     }
          50%     { transform: scale(1.008); }
        }
        /* ── Resto ── */
        @keyframes combat-heartbeat {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          18%  { opacity: 0.15; }
          28%  { opacity: 0.85; }
          40%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes blood-throb   { 0%,100%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 0 rgba(127,29,29,0)} 50%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 20px rgba(185,28,28,0.7)} }
        @keyframes ember-pulse   { 0%,100%{opacity:0.82} 50%{opacity:1} }
        @keyframes combat-aura   { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes combat-edge   { 0%,100%{opacity:0.4}  50%{opacity:0.9} }
        @keyframes fadein          { from{opacity:0} to{opacity:1} }
        @keyframes timer-breathe   { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.015);filter:brightness(1.08)} }
        @keyframes victory-drop    { 0%{opacity:0;transform:translateY(-30px) scale(0.9)} 60%{transform:translateY(4px) scale(1.02)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes victory-expand  { from{width:0;opacity:0} to{width:280px;opacity:1} }
        @keyframes xp-slam         { 0%{opacity:0;transform:scale(0.5)} 60%{transform:scale(1.12)} 100%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}
