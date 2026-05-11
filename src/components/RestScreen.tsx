import { useState, useEffect } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, getRankDisplay, isBeastUnlocked } from '../store/useStore';

interface RestScreenProps {
  xp: number;
  mins: number;
  bossDefeated: boolean;
  leveledUp: boolean;
  newRankIndex: number;
  isDayComplete: boolean;
  remainingRestSecs: number;
  onContinue: () => void;
  onSwitchDomain: (domainId: string, beastId: string) => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ''}` : `${m}m`;
};

export function RestScreen({
  xp, mins, bossDefeated, leveledUp, newRankIndex,
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
    if (isDayComplete) return; // no auto-advance on day complete
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

  // Today's mins per domain for the switch panel
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTs = todayStart.getTime();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: '#0a0504',
        backgroundImage: bossDefeated
          ? 'radial-gradient(ellipse at 50% 60%, rgba(120,0,0,0.18) 0%, transparent 55%)'
          : 'radial-gradient(ellipse at 50% 60%, rgba(180,80,0,0.12) 0%, transparent 55%)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadein 0.5s ease-out',
      }}
    >
      {/* ── XP / Victory info ─────────────────────────────────────────────── */}
      <div className="w-full max-w-sm text-center mb-6 px-4">
        <div style={{ width: '100%', height: 1, background: bossDefeated ? 'rgba(220,38,38,0.5)' : 'rgba(100,80,200,0.4)', marginBottom: 16, animation: 'victory-expand 0.7s ease-out' }} />

        <div style={{ fontSize: 'clamp(13px,3vw,20px)', letterSpacing: '0.12em', color: bossDefeated ? '#ef4444' : '#a78bfa', textShadow: bossDefeated ? '0 0 30px rgba(220,38,38,0.7),3px 3px 0 #000' : '0 0 30px rgba(167,139,250,0.6),3px 3px 0 #000', animation: 'victory-drop 0.5s ease-out', marginBottom: 6 }}>
          {isDayComplete ? '⚑  DÍA COMPLETADO' : bossDefeated ? '☠  BESTIA CAZADA' : '✦  RITUAL CONSUMADO'}
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 14, marginBottom: 14, animation: 'fadein 0.8s ease-out' }}>
          <div>
            <div style={{ fontSize: 6, color: '#5c4a3d', letterSpacing: '0.15em', marginBottom: 5 }}>OFRENDA</div>
            <div style={{ fontSize: 14, color: '#c8a070', textShadow: '2px 2px 0 #000' }}>{fmtMins(mins)}</div>
          </div>
          <div style={{ width: 1, background: '#2a1810' }} />
          <div>
            <div style={{ fontSize: 6, color: '#5c4a3d', letterSpacing: '0.15em', marginBottom: 5 }}>EXPERIENCIA</div>
            <div style={{ fontSize: 'clamp(18px,4vw,32px)', color: '#fbbf24', textShadow: '0 0 24px rgba(251,191,36,0.6),3px 3px 0 #000', animation: 'xp-slam 0.4s 0.3s ease-out both' }}>+{xp} XP</div>
          </div>
        </div>

        {leveledUp && rd && (
          <div style={{ padding: '10px 20px', border: `2px solid ${rd.era.border}`, background: rd.era.bg, fontSize: 9, color: rd.era.color, textShadow: '2px 2px 0 #000', boxShadow: `4px 4px 0 #000,0 0 30px ${rd.era.glow}`, animation: 'ember-pulse 0.7s ease-in-out infinite', letterSpacing: '0.1em', marginBottom: 8 }}>
            {rd.era.icon}  ¡RANGO ALCANZADO!  {rd.era.icon}
            <div style={{ fontSize: 7, marginTop: 6, opacity: 0.85 }}>{rd.fullTitle.toUpperCase()}</div>
          </div>
        )}

        <div style={{ width: '100%', height: 1, background: bossDefeated ? 'rgba(220,38,38,0.5)' : 'rgba(100,80,200,0.4)', animation: 'victory-expand 0.7s ease-out' }} />
      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <p className="text-[7px] tracking-[0.3em] mb-1" style={{ color: '#5c4a3d' }}>
        {isDayComplete ? '⸺ RITUAL DEL DÍA COMPLETADO ⸺' : '⸺ RITUAL CONCLUIDO ⸺'}
      </p>
      <h1 className="text-[14px] mb-1 tracking-widest drop-shadow-[2px_2px_0_#000]" style={{ color: '#fbbf24', animation: 'ember-pulse 3s ease-in-out infinite' }}>
        LA FOGATA
      </h1>
      <p className="text-[7px] mb-6 tracking-widest" style={{ color: '#8b7355' }}>
        {isDayComplete ? 'EL DÍA FUE TUYO, MAESTRO' : 'DESCANSA, MAESTRO'}
      </p>

      {/* ── Timer ─────────────────────────────────────────────────────────── */}
      {!isDayComplete && (
        <div className="mb-5 px-8 py-3" style={{ border: '2px solid #3a2000', background: 'transparent' }}>
          <p className="text-[36px] drop-shadow-[3px_3px_0_#000]" style={{ color: '#d97706', letterSpacing: '0.05em' }}>
            {fmt(timeLeft)}
          </p>
        </div>
      )}

      {/* ── Bonefire ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <img
          src={`${import.meta.env.BASE_URL}img/bonefire.gif`}
          alt="Fogata"
          style={{ width: 160, height: 160, objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 20px rgba(180,80,0,0.4))' }}
        />
      </div>

      <div style={{ height: 1, width: 200, background: 'linear-gradient(to right, transparent, #3a2000, transparent)', marginBottom: 20 }} />

      {/* ── Switch domain panel ────────────────────────────────────────────── */}
      {!isDayComplete && showSwitchPanel && (
        <div className="w-full max-w-sm mb-4 px-4" style={{ animation: 'fadein 0.2s ease-out' }}>
          <div style={{ border: '2px solid #3d2817', background: '#0a0504', padding: 12 }}>
            <p style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.15em', marginBottom: 10 }}>CAMBIAR DOMINIO</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
              {domains.map(d => {
                const todayMins = ritualSessions
                  .filter(s => s.domainId === d.id && s.timestamp >= todayStartTs)
                  .reduce((sum, s) => sum + s.durationMins, 0);
                const isActive = d.id === activeDomainId;
                const isPending = d.id === pendingDomainId;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setPendingDomainId(d.id); setPendingBeastId(d.beastId); }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px',
                      border: `2px solid ${isPending ? '#92400e' : isActive ? '#2a4a2a' : '#2a1810'}`,
                      background: isPending ? '#1c0800' : isActive ? '#0a1a0a' : '#0a0504',
                      color: isPending ? '#fbbf24' : isActive ? '#4ade80' : '#8b7355',
                      fontSize: 7, fontFamily: '"Press Start 2P", monospace',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span>{d.name.slice(0, 18)}{isActive ? ' ←' : ''}</span>
                    <span style={{ color: '#5c4a3d', fontSize: 6 }}>{fmtMins(todayMins)} hoy</span>
                  </button>
                );
              })}
            </div>

            {/* Beast picker for selected domain */}
            {pendingDomainId && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 6, color: '#5c4a3d', letterSpacing: '0.1em', marginBottom: 6 }}>BESTIA</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BEAST_UNLOCK_ORDER
                    .filter(e => isBeastUnlocked(e.beastId, playerEraIndex, debugUnlockAll))
                    .map(e => {
                      const beast = BEASTS[e.beastId];
                      const isSel = pendingBeastId === e.beastId;
                      return (
                        <button
                          key={e.beastId}
                          onClick={() => setPendingBeastId(e.beastId)}
                          title={beast.name}
                          style={{
                            width: 36, height: 36, padding: 3,
                            border: `2px solid ${isSel ? '#92400e' : '#2a1810'}`,
                            background: isSel ? '#1c0800' : '#0a0504',
                            cursor: 'pointer',
                          }}
                        >
                          <img src={beast.spriteImg} alt={beast.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowSwitchPanel(false); setPendingDomainId(null); setPendingBeastId(null); }}
                style={{ flex: 1, padding: '7px 0', border: '2px solid #2a1810', background: '#0a0504', color: '#5c4a3d', fontSize: 7, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}
              >
                CANCELAR
              </button>
              <button
                disabled={!pendingDomainId || !pendingBeastId}
                onClick={handleConfirmSwitch}
                style={{
                  flex: 1, padding: '7px 0',
                  border: `2px solid ${pendingDomainId ? '#92400e' : '#2a1810'}`,
                  background: pendingDomainId ? '#1c0800' : '#0a0504',
                  color: pendingDomainId ? '#fbbf24' : '#3d2817',
                  fontSize: 7, fontFamily: '"Press Start 2P", monospace',
                  cursor: pendingDomainId ? 'pointer' : 'not-allowed',
                }}
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
        {!isDayComplete && !showSwitchPanel && domains.length > 1 && (
          <button
            onClick={() => { setShowSwitchPanel(true); setPendingDomainId(activeDomainId); setPendingBeastId(activeBeastId); }}
            className="btn-pixel text-[7px] px-4 py-3"
            style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
          >
            ↺ CAMBIAR DOMINIO
          </button>
        )}
        {isDayComplete ? (
          <button
            onClick={onContinue}
            className="btn-pixel text-[8px] px-6 py-3"
            style={{ borderColor: '#92400e', background: '#1c0800', color: '#fbbf24' }}
          >
            ✦ VOLVER AL HUB
          </button>
        ) : (
          <button
            onClick={onContinue}
            className="btn-pixel text-[8px] px-5 py-3"
            style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
          >
            SALTEAR →
          </button>
        )}
      </div>

      <p className="mt-8 text-[6px] tracking-widest" style={{ color: '#3d2817', animation: 'seal-breathe 4s ease-in-out infinite' }}>
        {isDayComplete ? 'La llama persiste. Vuelve mañana.' : 'El fuego se desvanece. El camino espera.'}
      </p>

      <style>{`
        @keyframes fadein        { from{opacity:0} to{opacity:1} }
        @keyframes ember-pulse   { 0%,100%{opacity:0.82} 50%{opacity:1} }
        @keyframes seal-breathe  { 0%,100%{opacity:0.4} 50%{opacity:0.85} }
        @keyframes victory-drop  { 0%{opacity:0;transform:translateY(-20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes victory-expand{ from{width:0;opacity:0} to{width:100%;opacity:1} }
        @keyframes xp-slam       { 0%{opacity:0;transform:scale(0.6)} 60%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}
