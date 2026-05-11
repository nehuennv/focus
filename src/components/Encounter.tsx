import { useState, useEffect, useRef } from 'react';
import { useStore, BEASTS, getTodayMins } from '../store/useStore';
import { RestScreen } from './RestScreen';

interface EncounterProps {
  onBack: () => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ''}` : `${Math.round(m)}m`;
};

function ChargeBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `2px solid ${accent ? 'rgba(220,38,38,0.55)' : 'rgba(120,80,40,0.5)'}`,
        background: accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)',
        color: accent ? '#f87171' : '#c8a87a',
        fontSize: 12, padding: '10px 16px',
        fontFamily: '"Press Start 2P", monospace',
        cursor: 'pointer',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        backdropFilter: 'blur(4px)',
      }}
      onMouseEnter={e => { const b = e.currentTarget; b.style.background = accent ? 'rgba(140,0,0,0.6)' : 'rgba(40,24,10,0.7)'; b.style.color = accent ? '#fca5a5' : '#f0d8a8'; }}
      onMouseLeave={e => { const b = e.currentTarget; b.style.background = accent ? 'rgba(90,0,0,0.45)' : 'rgba(15,8,4,0.55)'; b.style.color = accent ? '#f87171' : '#c8a87a'; }}
    >
      {label}
    </button>
  );
}

export function Encounter({ onBack }: EncounterProps) {
  const {
    dailySession, domains, ritualSessions,
    completeAttack, updateDailySession, switchSessionDomain, endDailySession,
  } = useStore();

  const [chargedMins, setChargedMins] = useState(0);
  const [localAttackSecs, setLocalAttackSecs] = useState(() => dailySession?.remainingAttackSecs ?? 0);
  const localAttackSecsRef = useRef(dailySession?.remainingAttackSecs ?? 0);
  const [flashOn, setFlashOn] = useState(true);
  const [timerFlash, setTimerFlash] = useState(false);
  const [entrancePhase, setEntrancePhase] = useState<'bg' | 'boss' | 'ui' | 'done'>('bg');
  const [confirmModal, setConfirmModal] = useState<{ type: 'back' | 'flee'; message: string } | null>(null);
  const [exiting, setExiting] = useState(false);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const ritualFiredRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setEntrancePhase('boss'), 700);
    const t2 = setTimeout(() => setEntrancePhase('ui'), 1300);
    const t3 = setTimeout(() => setEntrancePhase('done'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (dailySession?.phase !== 'attacking') return;

    const iv = setInterval(() => {
      setLocalAttackSecs(s => {
        const next = s - 1;
        localAttackSecsRef.current = next;
        if (next === 60) setShowExtendPrompt(true);
        if (next <= 0) {
          clearInterval(iv);
          if (!ritualFiredRef.current) {
            ritualFiredRef.current = true;
            setTimeout(() => {
              const session = useStore.getState().dailySession;
              if (!session) return;
              const attackMins = Math.max(1, Math.round(session.chargedSecs / 60));
              completeAttack(session.activeDomainId, session.activeBeastId, attackMins);
            }, 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(iv);
      updateDailySession({ remainingAttackSecs: localAttackSecsRef.current });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySession?.phase]);

  useEffect(() => {
    if (!chargedMins || dailySession?.phase === 'attacking') return;
    const iv = setInterval(() => setFlashOn(f => !f), 500);
    return () => clearInterval(iv);
  }, [chargedMins, dailySession?.phase]);

  if (!dailySession) { onBack(); return null; }

  const domain = domains.find(d => d.id === dailySession.activeDomainId);
  const beast = BEASTS[dailySession.activeBeastId as keyof typeof BEASTS];
  const bossScale = beast?.scale ?? 1.0;
  const bossColor = beast?.color ?? '#888888';
  const isAttacking = dailySession.phase === 'attacking';

  // ── Progress bar ────────────────────────────────────────────────────────────
  const domainTodayBase = getTodayMins(dailySession.activeDomainId, ritualSessions);
  const domainDailyTargetMins = (domain?.dailyTargetHours ?? 0) * 60;

  // During attack: boss HP = remaining time (100% → 0%)
  const bossHpPct = isAttacking && dailySession.chargedSecs > 0
    ? (localAttackSecs / dailySession.chargedSecs) * 100
    : 0;

  // Idle: HOY daily progress bar (fills up)
  const domainTodayTotal = domainTodayBase + chargedMins;
  const domainBarPct = domainDailyTargetMins > 0
    ? Math.min(100, (domainTodayTotal / domainDailyTargetMins) * 100)
    : 0;
  const domainComplete = domainBarPct >= 100;

  const handleLaunchAttack = () => {
    if (chargedMins <= 0) return;
    ritualFiredRef.current = false;
    const chargedSecs = chargedMins * 60;
    setLocalAttackSecs(chargedSecs);
    localAttackSecsRef.current = chargedSecs;
    setChargedMins(0);
    setShowExtendPrompt(false);
    setTimerFlash(true);
    setTimeout(() => setTimerFlash(false), 1000);
    updateDailySession({ phase: 'attacking', chargedSecs, remainingAttackSecs: chargedSecs });
  };

  const handleExtendAttack = () => {
    const add = 30 * 60;
    const newRemaining = localAttackSecs + add;
    const newCharged = dailySession.chargedSecs + add;
    setLocalAttackSecs(newRemaining);
    localAttackSecsRef.current = newRemaining;
    setShowExtendPrompt(false);
    updateDailySession({ chargedSecs: newCharged, remainingAttackSecs: newRemaining });
  };

  const handleFlee = () => {
    ritualFiredRef.current = true;
    setLocalAttackSecs(0);
    localAttackSecsRef.current = 0;
    setChargedMins(0);
    setShowExtendPrompt(false);
    updateDailySession({ phase: 'idle', chargedSecs: 0, remainingAttackSecs: 0 });
  };

  if (dailySession.phase === 'resting') {
    return (
      <RestScreen
        xp={dailySession.lastAttackXp}
        mins={dailySession.lastAttackMins}
        bossDefeated={dailySession.lastBossDefeated}
        leveledUp={dailySession.lastRankUp}
        newRankIndex={dailySession.lastNewRankIndex}
        excessMins={dailySession.lastExcessMins}
        isDayComplete={dailySession.isDayComplete}
        remainingRestSecs={dailySession.remainingRestSecs}
        onContinue={() => {
          if (dailySession.isDayComplete) { endDailySession(); onBack(); }
          else updateDailySession({ phase: 'idle', remainingRestSecs: 0 });
        }}
        onSwitchDomain={(domainId, beastId) => switchSessionDomain(domainId, beastId)}
      />
    );
  }

  const uiVisible = entrancePhase === 'done';
  const uiSlide = (fromTop: boolean): React.CSSProperties => ({
    opacity: uiVisible ? 1 : 0,
    transform: uiVisible ? 'translateY(0)' : `translateY(${fromTop ? -24 : 24}px)`,
    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
  });

  const bossFilter = isAttacking
    ? `brightness(1.12) contrast(1.08) saturate(1.25) drop-shadow(4px 4px 0 rgba(0,0,0,0.98)) drop-shadow(0 0 22px ${bossColor}ee) drop-shadow(0 0 55px ${bossColor}99)`
    : `drop-shadow(4px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 8px 18px rgba(0,0,0,0.7)) drop-shadow(0 0 22px ${bossColor}55)`;

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
      <div className="absolute inset-0" style={{
        backgroundImage: `url(img/originales/${beast?.id}Bg.png)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(32px) brightness(0.28)', transform: 'scale(1.1)',
        opacity: entrancePhase !== 'bg' ? 1 : 0, transition: 'opacity 1.2s ease-in-out', zIndex: 0,
      }} />

      <div className="absolute top-0 bottom-0 overflow-hidden" style={{
        left: '50%', transform: 'translateX(-50%)',
        width: 'min(100vw, calc(100vh * 21 / 9))', zIndex: 1,
      }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url(img/originales/${beast?.id}Bg.png)`,
          backgroundSize: 'cover', backgroundPosition: 'center', imageRendering: 'pixelated',
          opacity: entrancePhase !== 'bg' ? 1 : 0,
          transform: entrancePhase !== 'bg' ? 'scale(1)' : 'scale(1.04)',
          transition: 'opacity 1.2s ease-in-out, transform 1.6s ease-out',
        }} />

        <div className="absolute inset-0 pointer-events-none" style={{
          background: isAttacking
            ? 'radial-gradient(ellipse at 50% 50%, rgba(80,0,0,0.28) 0%, rgba(0,0,0,0.55) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(20,10,30,0.15) 0%, rgba(0,0,0,0.38) 100%)',
          transition: 'background 1.5s ease', zIndex: 1,
        }} />

        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)', zIndex: 3,
        }} />

        {/* Boss */}
        <div className="absolute left-1/2" style={{
          top: 'clamp(52px, 7vh, 90px)', transform: 'translateX(-50%)', zIndex: 10,
          opacity: entrancePhase === 'bg' || entrancePhase === 'boss' ? 0 : 1,
          transition: 'opacity 0.9s ease-out',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <img
            src={`img/personaje/jefes/${beast?.id}.png`}
            alt={beast?.name}
            onError={e => { (e.currentTarget as HTMLImageElement).src = beast?.spriteImg || ''; }}
            style={{
              height: `clamp(${Math.round(140 * bossScale)}px, ${(22 * bossScale).toFixed(1)}vh, ${Math.round(260 * bossScale)}px)`,
              objectFit: 'contain', imageRendering: 'pixelated',
              filter: bossFilter,
              animation: isAttacking ? 'boss-combat 3.2s ease-in-out infinite' : beast?.floats ? 'boss-float 4s ease-in-out infinite' : 'boss-breathe 3.2s ease-in-out infinite',
            }}
          />
          <div style={{
            width: `clamp(${Math.round(80 * bossScale)}px, ${(13 * bossScale).toFixed(1)}vh, ${Math.round(150 * bossScale)}px)`,
            height: 12, marginTop: beast?.floats ? -10 : -7, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(3px)',
              animation: beast?.floats && !isAttacking ? 'shadow-float-contact 4s ease-in-out infinite' : undefined,
            }} />
          </div>
        </div>

        {/* Player */}
        <div className="absolute left-1/2" style={{
          bottom: 'clamp(175px, 20vh, 240px)', transform: 'translateX(-50%)', zIndex: 10,
          opacity: entrancePhase === 'bg' ? 0 : 1, transition: 'opacity 1.1s ease-out 0.3s',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <img src="img/personaje/de-espaldas-reposo.png" alt="Jugador" style={{
            height: 'clamp(130px, 20vh, 240px)', objectFit: 'contain', imageRendering: 'pixelated',
            filter: isAttacking
              ? `drop-shadow(4px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 32px ${bossColor}66)`
              : `drop-shadow(4px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 18px ${bossColor}28)`,
            animation: 'player-breathe 4s ease-in-out infinite', transformOrigin: 'bottom center',
          }} />
          <div style={{ position: 'relative', width: 'clamp(90px,14vh,165px)', height: 14, marginTop: -7 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(5px)' }} />
          </div>
        </div>

        {/* Giant timer */}
        {isAttacking && (
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 15, top: '45%', transform: 'translateY(-50%)' }}>
            <div style={{ padding: '20px 50px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 80%)', textAlign: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(6px,2vw,24px)',
                animation: 'timer-breathe 3.6s ease-in-out infinite',
              }}>
                {[
                  { val: Math.floor(localAttackSecs / 60), label: 'MIN' },
                  { val: localAttackSecs % 60, label: 'SEG' },
                ].map(({ val, label }, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      fontSize: 'clamp(72px,26vw,260px)',
                      fontFamily: timerFlash ? '"Press Start 2P", monospace' : '"Jersey 10", cursive',
                      fontWeight: 400,
                      color: '#f3d9a3', opacity: 0.6, lineHeight: 1,
                      letterSpacing: '0.01em',
                      textShadow: '0 0 40px rgba(0,0,0,0.95),0 0 90px rgba(200,130,60,0.4),6px 6px 0 #000',
                      width: 'clamp(80px,28vw,280px)', textAlign: 'center',
                      transition: timerFlash ? 'none' : 'font-family 0.1s',
                    }}>
                      {String(val).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 'clamp(6px,1.2vw,11px)', color: '#6b5040', letterSpacing: '0.25em', marginTop: 4, fontFamily: '"Press Start 2P", monospace' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Extend prompt */}
        {showExtendPrompt && isAttacking && (
          <div className="absolute left-0 right-0 flex justify-center" style={{ zIndex: 25, bottom: '28%' }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '10px 20px',
              border: '2px solid rgba(146,64,14,0.7)',
              background: 'rgba(10,5,2,0.85)',
              backdropFilter: 'blur(6px)',
              animation: 'fadein 0.3s ease-out',
            }}>
              <span style={{ fontSize: 9, color: '#d97706', letterSpacing: '0.1em' }}>¿UN POCO MÁS?</span>
              <button onClick={handleExtendAttack} style={{ border: '2px solid rgba(200,130,60,0.7)', background: 'rgba(60,30,0,0.6)', color: '#fbbf24', fontSize: 9, padding: '6px 12px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', animation: 'blood-throb 1.5s ease-in-out infinite' }}>
                +30 MIN
              </button>
              <button onClick={() => setShowExtendPrompt(false)} style={{ border: '2px solid rgba(60,40,20,0.5)', background: 'rgba(10,6,2,0.5)', color: '#5c4a3d', fontSize: 9, padding: '6px 10px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}>
                NO
              </button>
            </div>
          </div>
        )}

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 68%, rgba(0,0,0,0.7) 100%), linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.45) 100%)',
          zIndex: 11,
        }} />

        {isAttacking && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 28%, ${bossColor}18 62%, ${bossColor}40 100%)`, zIndex: 12, animation: 'combat-aura 3s ease-in-out infinite' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${bossColor}30 0%, transparent 12%, transparent 88%, ${bossColor}30 100%)`, zIndex: 12, animation: 'combat-edge 2.2s ease-in-out infinite' }} />
          </>
        )}

        {/* TOP HUD */}
        <div className="absolute top-0 left-0 right-0" style={{ zIndex: 20, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)', padding: '12px 20px 20px', ...uiSlide(true) }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setConfirmModal({ type: 'back', message: '¿Salir del ritual? El progreso del ataque actual se perderá. Podrás retomar el día desde el portal.' })} style={{ border: '2px solid rgba(100,65,30,0.5)', background: 'rgba(10,6,2,0.55)', color: '#a08060', fontSize: 10, padding: '7px 12px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              ← SALIR
            </button>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#b89060', letterSpacing: '0.12em', textShadow: '1px 1px 0 #000' }}>
              {isAttacking ? '⚔  EN COMBATE' : chargedMins > 0 ? `CARGA · ${chargedMins}m` : `${beast?.name?.toUpperCase()} · ${domain?.name ?? '???'}`}
            </div>
            {isAttacking ? (
              <button onClick={() => setConfirmModal({ type: 'flee', message: '¿Huir? Perderás todo el tiempo cargado en este ataque.' })} style={{ border: '2px solid rgba(180,30,30,0.6)', background: 'rgba(80,0,0,0.5)', color: '#ef4444', fontSize: 10, padding: '7px 12px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                HUIR
              </button>
            ) : <div style={{ width: 80 }} />}
          </div>
        </div>

        {/* BOTTOM HUD */}
        <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 100%)', padding: '32px 20px 18px', ...uiSlide(false) }}>

          <div className="flex justify-between items-end" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, letterSpacing: '0.08em', marginBottom: 3, color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.4), 3px 3px 0 #000' }}>
                {beast?.name?.toUpperCase()}
              </h2>
              <p style={{ fontSize: 8, color: '#6b5040', letterSpacing: '0.14em' }}>JEFE DE DOMINIO</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#c8a070', letterSpacing: '0.05em', marginBottom: 3 }}>{domain?.name ?? '???'}</p>
              {domain && domain.dailyTargetHours > 0 && (
                <p style={{ fontSize: 8, color: domainComplete ? '#4ade80' : '#6b5040', letterSpacing: '0.08em' }}>
                  {domainComplete ? '✓ OBJETIVO CUMPLIDO' : `OBJETIVO · ${domain.dailyTargetHours}h/día`}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar: boss HP during attack, HOY daily progress in idle */}
          {domain && domain.dailyTargetHours > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: isAttacking ? '#ef4444' : domainComplete ? '#4ade80' : '#a08060', letterSpacing: '0.12em' }}>
                  {isAttacking ? 'VIDA' : domainComplete ? '✓ HOY' : 'HOY'}
                </span>
                <span style={{ fontSize: 9, color: isAttacking ? '#ef4444' : domainComplete ? '#4ade80' : '#7a6050' }}>
                  {isAttacking
                    ? `${fmt(localAttackSecs)}`
                    : (
                      <>
                        {fmtMins(domainTodayTotal)} / {fmtMins(domainDailyTargetMins)}
                        {domainComplete && domainTodayTotal > domainDailyTargetMins && (
                          <span style={{ color: '#fbbf24', marginLeft: 8, fontSize: 7 }}>+{fmtMins(domainTodayTotal - domainDailyTargetMins)} BONUS</span>
                        )}
                      </>
                    )
                  }
                </span>
              </div>
              <div style={{ position: 'relative', height: 14, background: 'rgba(0,0,0,0.5)', border: `2px solid ${isAttacking ? 'rgba(200,30,30,0.7)' : 'rgba(100,20,20,0.6)'}`, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${isAttacking ? bossHpPct : Math.min(100, domainBarPct)}%`,
                  background: isAttacking
                    ? 'linear-gradient(to right,#7f1d1d,#dc2626)'
                    : domainComplete ? 'linear-gradient(to right,#14532d,#16a34a)' : 'linear-gradient(to right,#1d4ed8,#3b82f6)',
                  transition: isAttacking ? 'width 1s linear' : 'width 0.4s ease',
                }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.3) calc(10% - 1px), rgba(0,0,0,0.3) 10%)', pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          {/* Controls */}
          {isAttacking ? (
            <div className="flex items-center justify-center gap-4">
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, rgba(220,38,38,0.6))' }} />
              <span style={{ fontSize: 10, color: '#ef4444', letterSpacing: '0.15em', textShadow: '0 0 12px rgba(220,38,38,0.5)' }}>⚔  RITUAL ACTIVO</span>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, rgba(220,38,38,0.6))' }} />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <ChargeBtn label="+10m" onClick={() => setChargedMins(p => p + 10)} />
                <ChargeBtn label="+20m" onClick={() => setChargedMins(p => p + 20)} />
                <ChargeBtn label="+30m" onClick={() => setChargedMins(p => p + 30)} />
                {chargedMins > 0 && <ChargeBtn label="✕" onClick={() => setChargedMins(0)} accent />}
              </div>
              <button
                disabled={chargedMins <= 0}
                onClick={handleLaunchAttack}
                style={{
                  border: chargedMins > 0 ? '2px solid rgba(200,38,38,0.7)' : '2px solid rgba(60,40,20,0.4)',
                  background: chargedMins > 0 ? 'rgba(100,0,0,0.55)' : 'rgba(8,8,16,0.45)',
                  color: chargedMins > 0 ? '#ef4444' : '#3a3a50',
                  fontSize: 13, padding: '12px 22px',
                  fontFamily: '"Press Start 2P", monospace',
                  cursor: chargedMins > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: chargedMins > 0 ? '3px 3px 0 rgba(0,0,0,0.7),0 0 20px rgba(180,0,0,0.3)' : 'none',
                  animation: chargedMins > 0 ? 'blood-throb 1.8s ease-in-out infinite' : 'none',
                  transition: 'border 0.2s, background 0.2s, color 0.2s',
                  letterSpacing: '0.08em', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)',
                }}
              >
                ⚔  ATACAR
              </button>
            </div>
          )}
        </div>

        {/* Confirm Modal */}
        {confirmModal && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 60, background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ border: '3px solid #92400e', background: 'rgba(15,8,4,0.97)', boxShadow: '0 0 60px rgba(0,0,0,0.95),4px 4px 0 #000', padding: '24px 32px', maxWidth: 400, textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(10px,2vw,12px)', color: '#ede0c8', lineHeight: 1.8, letterSpacing: '0.08em', marginBottom: 24 }}>
                {confirmModal.message}
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setConfirmModal(null)} style={{ border: '2px solid rgba(100,65,30,0.5)', background: 'rgba(10,6,2,0.55)', color: '#a08060', fontSize: 10, padding: '8px 16px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}>
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    setConfirmModal(null);
                    if (confirmModal.type === 'back') {
                      if (isAttacking) handleFlee();
                      setExiting(true);
                      setTimeout(onBack, 600);
                    } else {
                      handleFlee();
                    }
                  }}
                  style={{ border: '2px solid rgba(220,38,38,0.7)', background: 'rgba(100,0,0,0.55)', color: '#ef4444', fontSize: 10, padding: '8px 16px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}
                >
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes boss-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
        @keyframes boss-breathe { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.012) translateY(-2px)} }
        @keyframes boss-combat { 0%{transform:translateY(0px) rotate(0deg) scale(1)} 8%{transform:translateY(-18px) rotate(-0.9deg) scale(1.022)} 18%{transform:translateY(-9px) rotate(0.5deg) scale(1.008)} 30%{transform:translateY(-26px) rotate(-0.7deg) scale(1.028)} 42%{transform:translateY(-14px) rotate(0.8deg) scale(1.012)} 55%{transform:translateY(-22px) rotate(-0.5deg) scale(1.02)} 68%{transform:translateY(-8px) rotate(0.6deg) scale(1.006)} 80%{transform:translateY(-19px) rotate(-0.4deg) scale(1.015)} 92%{transform:translateY(-5px) rotate(0.3deg)} 100%{transform:translateY(0px) rotate(0deg) scale(1)} }
        @keyframes shadow-float-contact { 0%,100%{transform:scaleX(1.0);opacity:0.9} 50%{transform:scaleX(0.4);opacity:0.2} }
        @keyframes player-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.008)} }
        @keyframes blood-throb { 0%,100%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 0 rgba(127,29,29,0)} 50%{box-shadow:3px 3px 0 rgba(0,0,0,0.7),0 0 20px rgba(185,28,28,0.7)} }
        @keyframes combat-aura { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes combat-edge { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        @keyframes timer-breathe { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.015);filter:brightness(1.08)} }
      `}</style>
    </div>
  );
}
