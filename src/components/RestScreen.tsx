import { useState, useEffect } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, getRankDisplay, isBeastUnlocked } from '../store/useStore';

interface RestScreenProps {
  xp: number;
  mins: number;
  bossDefeated: boolean;
  leveledUp: boolean;
  newRankIndex: number;
  excessMins: number;
  isDayComplete: boolean;
  remainingRestSecs: number;
  onContinue: () => void;
  onSwitchDomain: (domainId: string, beastId: string) => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ''}` : `${Math.round(m)}m`;
};

export function RestScreen({
  xp, mins, bossDefeated, leveledUp, newRankIndex, excessMins,
  isDayComplete, remainingRestSecs, onContinue, onSwitchDomain,
}: RestScreenProps) {
  const { domains, player, ritualSessions, dailySession, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const [timeLeft, setTimeLeft] = useState(remainingRestSecs);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const [pendingDomainId, setPendingDomainId] = useState<string | null>(null);
  const [pendingBeastId, setPendingBeastId] = useState<string | null>(null);

  const rd = leveledUp ? getRankDisplay(newRankIndex) : null;

  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bonefire.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (isDayComplete) return;
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          new Audio(`${import.meta.env.BASE_URL}sounds/bell.mp3`).play().catch(() => {});
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isDayComplete, onContinue]);

  const activeDomainId = dailySession?.activeDomainId ?? '';
  const activeBeastId = dailySession?.activeBeastId ?? '';

  const handleConfirmSwitch = () => {
    if (pendingDomainId && pendingBeastId) {
      onSwitchDomain(pendingDomainId, pendingBeastId);
    }
    setShowSwitchPanel(false);
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTs = todayStart.getTime();

  const accentColor = isDayComplete ? '#fbbf24' : bossDefeated ? '#ef4444' : '#a78bfa';
  const accentGlow = isDayComplete ? 'rgba(251,191,36,0.35)' : bossDefeated ? 'rgba(220,38,38,0.35)' : 'rgba(167,139,250,0.35)';

  const statusLabel = isDayComplete ? '⚑  DÍA COMPLETADO'
    : bossDefeated ? '☠  BESTIA CAZADA'
    : '✦  RITUAL CONSUMADO';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto"
      style={{
        background: '#070404',
        backgroundImage: `radial-gradient(ellipse at 50% 30%, ${accentGlow} 0%, transparent 60%)`,
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadein 0.4s ease-out',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* ── Status header ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24, animation: 'slidedown 0.4s ease-out' }}>
          <div style={{ fontSize: 7, color: '#4a3828', letterSpacing: '0.3em', marginBottom: 10 }}>⸺ LA FOGATA ⸺</div>
          <div style={{
            fontSize: 'clamp(14px,3.5vw,20px)', letterSpacing: '0.1em',
            color: accentColor,
            textShadow: `0 0 30px ${accentGlow}, 3px 3px 0 #000`,
            marginBottom: leveledUp ? 12 : 0,
          }}>
            {statusLabel}
          </div>

          {leveledUp && rd && (
            <div style={{
              marginTop: 10, padding: '8px 18px',
              border: `2px solid ${rd.era.border}`,
              background: rd.era.bg,
              fontSize: 8, color: rd.era.color,
              textShadow: '2px 2px 0 #000',
              boxShadow: `3px 3px 0 #000, 0 0 20px ${rd.era.glow}`,
              animation: 'ember-pulse 1.2s ease-in-out infinite',
              letterSpacing: '0.1em',
            }}>
              {rd.era.icon}  ¡RANGO! · {rd.fullTitle.toUpperCase()}
            </div>
          )}
        </div>

        {/* ── XP + stats row ────────────────────────────────────────────────── */}
        <div style={{
          width: '100%', display: 'flex', gap: 0,
          border: '2px solid #2a1810',
          background: '#0f0804',
          marginBottom: 20,
          animation: 'fadein 0.6s ease-out',
        }}>
          <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center', borderRight: '1px solid #2a1810' }}>
            <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.2em', marginBottom: 8 }}>OFRENDA</div>
            <div style={{ fontSize: 16, color: '#c8a070', textShadow: '2px 2px 0 #000' }}>{fmtMins(mins)}</div>
          </div>
          <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center', borderRight: excessMins > 0 ? '1px solid #2a1810' : undefined }}>
            <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.2em', marginBottom: 8 }}>EXPERIENCIA</div>
            <div style={{
              fontSize: 'clamp(18px,5vw,28px)', color: '#fbbf24',
              textShadow: '0 0 20px rgba(251,191,36,0.5), 3px 3px 0 #000',
              animation: 'xp-slam 0.4s 0.2s ease-out both',
            }}>
              +{xp}
            </div>
          </div>
          {excessMins > 0 && (
            <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.2em', marginBottom: 8 }}>BONUS</div>
              <div style={{ fontSize: 14, color: '#fbbf24', textShadow: '2px 2px 0 #000' }}>+{fmtMins(excessMins)}</div>
            </div>
          )}
        </div>

        {/* ── Bonefire + timer ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <img
            src={`${import.meta.env.BASE_URL}img/bonefire.gif`}
            alt="Fogata"
            style={{ width: 140, height: 140, objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 24px rgba(180,80,0,0.5))' }}
          />
          {!isDayComplete && (
            <div style={{ marginTop: 8, padding: '8px 20px', border: '2px solid #2a1200', background: 'transparent', textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: '#d97706', letterSpacing: '0.05em', textShadow: '3px 3px 0 #000' }}>
                {fmt(timeLeft)}
              </div>
            </div>
          )}
          {isDayComplete && (
            <p style={{ marginTop: 10, fontSize: 7, color: '#5c4a3d', letterSpacing: '0.15em' }}>LA LLAMA PERSISTE</p>
          )}
        </div>

        <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, transparent, #2a1810, transparent)', marginBottom: 20 }} />

        {/* ── Domain switch panel ───────────────────────────────────────────── */}
        {!isDayComplete && showSwitchPanel && (
          <div style={{ width: '100%', marginBottom: 16, animation: 'fadein 0.2s ease-out' }}>
            <div style={{ border: '2px solid #3d2817', background: '#0f0804', padding: '14px' }}>
              <p style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.15em', marginBottom: 12 }}>CAMBIAR DOMINIO</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                {domains.map(d => {
                  const todayMins = ritualSessions
                    .filter(s => s.domainId === d.id && s.timestamp >= todayStartTs)
                    .reduce((sum, s) => sum + s.durationMins, 0);
                  const isActive = d.id === activeDomainId;
                  const isPending = d.id === pendingDomainId;
                  const b = BEASTS[d.beastId as keyof typeof BEASTS];
                  return (
                    <button
                      key={d.id}
                      onClick={() => { setPendingDomainId(d.id); setPendingBeastId(d.beastId); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px',
                        border: `2px solid ${isPending ? '#92400e' : isActive ? '#1a4a1a' : '#2a1810'}`,
                        background: isPending ? '#1c0800' : isActive ? '#0a180a' : '#0a0504',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {b && <img src={b.spriteImg} alt={b.name} style={{ width: 24, height: 24, imageRendering: 'pixelated', objectFit: 'contain', opacity: isPending ? 1 : 0.5 }} />}
                      <span style={{ flex: 1, fontSize: 7, color: isPending ? '#fbbf24' : isActive ? '#4ade80' : '#8b7355', fontFamily: '"Press Start 2P", monospace' }}>
                        {d.name.slice(0, 18)}{isActive ? ' ←' : ''}
                      </span>
                      <span style={{ fontSize: 6, color: '#4a3828', fontFamily: '"Press Start 2P", monospace' }}>{fmtMins(todayMins)}</span>
                    </button>
                  );
                })}
              </div>

              {pendingDomainId && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.12em', marginBottom: 8 }}>BESTIA</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {BEAST_UNLOCK_ORDER
                      .filter(e => isBeastUnlocked(e.beastId, playerEraIndex, debugUnlockAll))
                      .map(e => {
                        const beast = BEASTS[e.beastId];
                        const isSel = pendingBeastId === e.beastId;
                        return (
                          <button key={e.beastId} onClick={() => setPendingBeastId(e.beastId)} title={beast.name}
                            style={{ width: 38, height: 38, padding: 3, border: `2px solid ${isSel ? '#92400e' : '#2a1810'}`, background: isSel ? '#1c0800' : '#0a0504', cursor: 'pointer' }}
                          >
                            <img src={beast.spriteImg} alt={beast.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowSwitchPanel(false); setPendingDomainId(null); setPendingBeastId(null); }}
                  style={{ flex: 1, padding: '8px 0', border: '2px solid #2a1810', background: '#0a0504', color: '#4a3828', fontSize: 7, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}>
                  CANCELAR
                </button>
                <button disabled={!pendingDomainId || !pendingBeastId} onClick={handleConfirmSwitch}
                  style={{ flex: 1, padding: '8px 0', border: `2px solid ${pendingDomainId ? '#92400e' : '#2a1810'}`, background: pendingDomainId ? '#1c0800' : '#0a0504', color: pendingDomainId ? '#fbbf24' : '#3d2817', fontSize: 7, fontFamily: '"Press Start 2P", monospace', cursor: pendingDomainId ? 'pointer' : 'not-allowed' }}>
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isDayComplete && !showSwitchPanel && domains.length > 1 && (
            <button
              onClick={() => { setShowSwitchPanel(true); setPendingDomainId(activeDomainId); setPendingBeastId(activeBeastId); }}
              style={{ padding: '10px 16px', border: '2px solid #3d2817', background: '#0f0804', color: '#8b7355', fontSize: 7, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}
            >
              ↺ CAMBIAR DOMINIO
            </button>
          )}
          {isDayComplete ? (
            <button onClick={onContinue}
              style={{ padding: '12px 28px', border: '2px solid #92400e', background: '#1c0800', color: '#fbbf24', fontSize: 9, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000, 0 0 20px rgba(146,64,14,0.3)', animation: 'ember-pulse 2s ease-in-out infinite', letterSpacing: '0.08em' }}>
              ✦ VOLVER AL HUB
            </button>
          ) : (
            <button onClick={onContinue}
              style={{ padding: '10px 20px', border: '2px solid #2a1810', background: '#0f0804', color: '#7a6050', fontSize: 8, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}>
              CONTINUAR →
            </button>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadein       { from{opacity:0} to{opacity:1} }
        @keyframes slidedown    { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ember-pulse  { 0%,100%{opacity:0.85} 50%{opacity:1} }
        @keyframes xp-slam      { 0%{opacity:0;transform:scale(0.5)} 65%{transform:scale(1.12)} 100%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}
