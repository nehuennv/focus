import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, isBeastUnlocked } from '../store/useStore';
import type { Domain } from '../store/useStore';

interface DailySetupScreenProps {
  onStart: (totalMins: number, domainId: string, beastId: string) => void;
  onClose: () => void;
}

const S: React.CSSProperties = { fontFamily: '"Press Start 2P", monospace' };

const fmtH = (h: number) => {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export function DailySetupScreen({ onStart, onClose }: DailySetupScreenProps) {
  const { domains, player, dailySession, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const todayDate = new Date().toISOString().slice(0, 10);
  const hasResumable = dailySession !== null && dailySession.dayDate === todayDate;

  const firstDomain = domains[0];
  const [selectedDomainId, setSelectedDomainId] = useState(
    hasResumable ? dailySession!.activeDomainId : (firstDomain?.id ?? '')
  );
  const [selectedBeastId, setSelectedBeastId] = useState(
    hasResumable ? dailySession!.activeBeastId : (firstDomain?.beastId ?? 'maro')
  );

  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  const domainAutoHours = selectedDomain?.dailyTargetHours ?? 0;

  // hoursMode: 'auto' uses domain target, 'manual' uses custom grid
  const [hoursMode, setHoursMode] = useState<'auto' | 'manual'>(
    hasResumable ? 'manual' : (domainAutoHours > 0 ? 'auto' : 'manual')
  );
  const [manualHours, setManualHours] = useState<number>(
    hasResumable ? Math.round(dailySession!.totalDayMins / 60) : 4
  );

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];

  const totalHours = hoursMode === 'auto' ? domainAutoHours : manualHours;
  const totalMins  = Math.round(totalHours * 60);
  const canStart   = selectedDomainId && selectedBeastId && totalMins >= 10;

  const handleDomainClick = (d: Domain) => {
    setSelectedDomainId(d.id);
    setSelectedBeastId(d.beastId);
    if (d.dailyTargetHours > 0) setHoursMode('auto');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,2,1,0.97)', backdropFilter: 'blur(4px)', ...S, animation: 'fadein 0.2s ease-out' }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        border: '2px solid #92400e',
        background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 60px rgba(146,64,14,0.12)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '94vh',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #1a0e08', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.28em', marginBottom: 5 }}>⸺ PORTAL OSCURO ⸺</div>
            <h2 style={{ fontSize: 13, color: '#fbbf24', letterSpacing: '0.14em', textShadow: '2px 2px 0 #000' }}>RITUAL DEL DÍA</h2>
          </div>
        </div>

        {/* ── Resume banner ── */}
        {hasResumable && (
          <div style={{ margin: '12px 18px 0', padding: '10px 14px', border: '2px solid #14532d', background: '#060f06', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 7, color: '#4ade80', letterSpacing: '0.1em', marginBottom: 3 }}>RITUAL EN CURSO</p>
              <p style={{ fontSize: 6, color: '#3a5a3a' }}>
                {Math.round(dailySession!.elapsedDayMins)}m / {dailySession!.totalDayMins}m completados
              </p>
            </div>
            <button
              onClick={() => onStart(dailySession!.totalDayMins, dailySession!.activeDomainId, dailySession!.activeBeastId)}
              style={{ border: '2px solid #14532d', background: '#060f06', color: '#4ade80', fontSize: 7, padding: '8px 14px', cursor: 'pointer', ...S }}
            >
              RETOMAR →
            </button>
          </div>
        )}

        {/* ── Body: 2 columns ── */}
        <div style={{ display: 'flex', gap: 0, overflow: 'hidden', flex: 1, minHeight: 0 }}>

          {/* ── LEFT: Domain picker ── */}
          <div style={{ flex: '0 0 260px', borderRight: '1px solid #1a0e08', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #120a06', flexShrink: 0 }}>
              <p style={{ fontSize: 6, color: '#6b5040', letterSpacing: '0.2em' }}>DOMINIO</p>
            </div>

            {domains.length === 0 ? (
              <div style={{ padding: 16, color: '#4a3828', fontSize: 6, textAlign: 'center' }}>
                Sin dominios.<br />Forja uno primero.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {domains.map(d => {
                  const b = BEASTS[d.beastId as keyof typeof BEASTS];
                  const sel = d.id === selectedDomainId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDomainClick(d)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px',
                        border: 'none',
                        borderBottom: '1px solid #120a06',
                        borderLeft: `3px solid ${sel ? '#d97706' : 'transparent'}`,
                        background: sel ? '#160a00' : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.1s, border-color 0.1s',
                      }}
                    >
                      {b && (
                        <img src={b.spriteImg} alt={b.name}
                          style={{ width: 28, height: 28, imageRendering: 'pixelated', objectFit: 'contain', opacity: sel ? 1 : 0.45, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 8, color: sel ? '#fbbf24' : '#8b7355', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.name}
                        </p>
                        <p style={{ fontSize: 5, color: '#3d2817' }}>
                          {d.dailyTargetHours > 0 ? `${fmtH(d.dailyTargetHours)}/día` : 'sin objetivo'} · {d.activeDaysPerWeek}d/sem
                        </p>
                      </div>
                      {sel && <span style={{ fontSize: 9, color: '#fbbf24', flexShrink: 0 }}>›</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Hours + Beast ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>

            {/* Hours */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a0e08' }}>
              <p style={{ fontSize: 6, color: '#6b5040', letterSpacing: '0.2em', marginBottom: 10 }}>HORAS HOY</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {/* AUTO pill */}
                <button
                  onClick={() => setHoursMode('auto')}
                  disabled={domainAutoHours <= 0}
                  title={domainAutoHours > 0 ? `Objetivo del dominio: ${fmtH(domainAutoHours)}` : 'Este dominio no tiene objetivo diario'}
                  style={{
                    flex: 1, padding: '10px 8px',
                    border: `2px solid ${hoursMode === 'auto' ? '#d97706' : '#2a1810'}`,
                    background: hoursMode === 'auto' ? '#1c0e00' : '#0f0804',
                    color: hoursMode === 'auto' ? '#fbbf24' : domainAutoHours > 0 ? '#6b5040' : '#2a1810',
                    cursor: domainAutoHours > 0 ? 'pointer' : 'not-allowed',
                    ...S,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ fontSize: 6, letterSpacing: '0.15em', marginBottom: 4 }}>AUTO</div>
                  <div style={{ fontSize: domainAutoHours > 0 ? 11 : 7, opacity: domainAutoHours > 0 ? 1 : 0.4 }}>
                    {domainAutoHours > 0 ? fmtH(domainAutoHours) : '—'}
                  </div>
                </button>

                {/* Manual grid */}
                <div style={{ flex: 2 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => {
                      const sel = hoursMode === 'manual' && manualHours === h;
                      return (
                        <button
                          key={h}
                          onClick={() => { setHoursMode('manual'); setManualHours(h); }}
                          style={{
                            width: 38, height: 38,
                            border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
                            background: sel ? '#1c0e00' : '#0f0804',
                            color: sel ? '#fbbf24' : '#6b5040',
                            fontSize: 12, cursor: 'pointer',
                            boxShadow: sel ? '0 0 10px rgba(217,119,6,0.3)' : 'none',
                            transition: 'all 0.1s',
                            ...S,
                          }}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 6, color: '#3d2817' }}>
                {totalMins >= 10
                  ? `${totalMins} min de combate`
                  : <span style={{ color: '#ef4444' }}>mín. 10 min</span>}
              </p>
            </div>

            {/* Beast */}
            <div style={{ padding: '14px 18px', flex: 1 }}>
              <p style={{ fontSize: 6, color: '#6b5040', letterSpacing: '0.2em', marginBottom: 10 }}>BESTIA</p>

              {/* Selected preview */}
              {selectedBeast && (
                <div style={{ position: 'relative', overflow: 'hidden', padding: '8px 12px', border: '2px solid #2a1810', background: '#0f0804', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {selectedBeast.bgImg && (
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1, pointerEvents: 'none' }} />
                  )}
                  <img src={selectedBeast.spriteImg} alt={selectedBeast.name}
                    style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain', filter: `drop-shadow(0 0 6px ${selectedBeast.color}88)`, position: 'relative' }} />
                  <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: 9, color: '#fbbf24', marginBottom: 3 }}>{selectedBeast.name}</p>
                    <p style={{ fontSize: 5, color: '#4a3828', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedBeast.lore.slice(0, 70)}...</p>
                  </div>
                </div>
              )}

              {/* Beast grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
                  const beast = BEASTS[beastId];
                  const unlocked = isBeastUnlocked(beastId, playerEraIndex, debugUnlockAll);
                  const sel = selectedBeastId === beastId;
                  return (
                    <button
                      key={beastId}
                      onClick={() => unlocked && setSelectedBeastId(beastId)}
                      title={unlocked ? beast.name : '???'}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 2px',
                        border: `2px solid ${sel ? '#d97706' : unlocked ? '#2a1810' : '#120808'}`,
                        background: sel ? '#1c0e00' : unlocked ? '#0f0804' : '#080504',
                        cursor: unlocked ? 'pointer' : 'not-allowed',
                        opacity: unlocked ? 1 : 0.35,
                        boxShadow: sel ? '0 0 8px rgba(217,119,6,0.3)' : 'none',
                        position: 'relative',
                      }}
                    >
                      <div style={{ width: 32, height: 32, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={beast.spriteImg} alt={unlocked ? beast.name : '???'}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0)' }} />
                        {!unlocked && <span style={{ position: 'absolute', fontSize: 11 }}>🔒</span>}
                      </div>
                      <span style={{ fontSize: 4, color: sel ? '#fbbf24' : unlocked ? '#6b5040' : '#2a1810', marginTop: 3, textAlign: 'center', lineHeight: 1.3 }}>
                        {unlocked ? beast.name : '???'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 18px', borderTop: '1px solid #1a0e08', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px 0', border: '2px solid #2a1810', background: '#0f0804', color: '#6b5040', fontSize: 8, cursor: 'pointer', boxShadow: '3px 3px 0 #000', ...S }}
          >
            CANCELAR
          </button>
          <button
            disabled={!canStart}
            onClick={() => canStart && onStart(totalMins, selectedDomainId, selectedBeastId)}
            style={{
              flex: 3, padding: '11px 0',
              border: `2px solid ${canStart ? '#d97706' : '#1a0e08'}`,
              background: canStart ? '#1c0e00' : '#0a0504',
              color: canStart ? '#fbbf24' : '#2a1810',
              fontSize: 10, cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? '0 0 14px rgba(217,119,6,0.28), 3px 3px 0 #000' : 'none',
              animation: canStart ? 'throb 2s ease-in-out infinite' : 'none',
              letterSpacing: '0.08em', ...S,
            }}
          >
            ⚔  COMENZAR · {totalMins >= 10 ? fmtH(totalHours) : '—'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes throb { 0%,100%{box-shadow:0 0 14px rgba(217,119,6,0.28),3px 3px 0 #000} 50%{box-shadow:0 0 26px rgba(217,119,6,0.5),3px 3px 0 #000} }
      `}</style>
    </div>
  );
}
