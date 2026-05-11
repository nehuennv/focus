import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, isBeastUnlocked } from '../store/useStore';
import type { Domain } from '../store/useStore';

interface DailySetupScreenProps {
  onStart: (totalMins: number, domainId: string, beastId: string) => void;
  onClose: () => void;
}

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const S: React.CSSProperties = { fontFamily: '"Press Start 2P", monospace' };

export function DailySetupScreen({ onStart, onClose }: DailySetupScreenProps) {
  const { domains, player, dailySession, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const todayDate = new Date().toISOString().slice(0, 10);
  const hasResumable = dailySession !== null && dailySession.dayDate === todayDate;

  const firstDomain = domains[0];
  const [selectedHours, setSelectedHours] = useState(hasResumable ? dailySession!.totalDayMins / 60 : 4);
  const [selectedDomainId, setSelectedDomainId] = useState(
    hasResumable ? dailySession!.activeDomainId : (firstDomain?.id ?? '')
  );
  const [selectedBeastId, setSelectedBeastId] = useState(
    hasResumable ? dailySession!.activeBeastId : (firstDomain?.beastId ?? 'maro')
  );

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];
  const canStart = selectedDomainId && selectedBeastId && selectedHours > 0;

  const handleDomainClick = (d: Domain) => {
    setSelectedDomainId(d.id);
    setSelectedBeastId(d.beastId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(4,2,1,0.96)', backdropFilter: 'blur(4px)', ...S, animation: 'fadein 0.22s ease-out' }}
    >
      <div
        style={{
          width: '100%', maxWidth: 560, maxHeight: '94vh', overflowY: 'auto',
          border: '2px solid #92400e',
          background: '#0a0504',
          boxShadow: '8px 8px 0 #000, 0 0 50px rgba(146,64,14,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid #1a0e08', position: 'sticky', top: 0, background: '#0a0504', zIndex: 10 }}>
          {selectedBeast?.bgImg && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.04, pointerEvents: 'none' }} />
          )}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.28em', marginBottom: 6 }}>⸺ PORTAL OSCURO ⸺</div>
            <h2 style={{ fontSize: 12, color: '#fbbf24', letterSpacing: '0.14em', textShadow: '2px 2px 0 #000' }}>RITUAL DEL DÍA</h2>
          </div>
        </div>

        <div style={{ padding: '20px 22px' }}>

          {/* Resume banner */}
          {hasResumable && (
            <div style={{ marginBottom: 18, padding: '12px 16px', border: '2px solid #14532d', background: '#060f06', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 7, color: '#4ade80', letterSpacing: '0.1em', marginBottom: 4 }}>RITUAL EN CURSO</p>
                <p style={{ fontSize: 6, color: '#3a5a3a' }}>
                  {Math.round(dailySession!.elapsedDayMins)}m / {dailySession!.totalDayMins}m
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

          {/* Hours */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 12 }}>¿CUÁNTAS HORAS HOY?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {HOUR_OPTIONS.map(h => {
                const sel = selectedHours === h;
                return (
                  <button
                    key={h}
                    onClick={() => setSelectedHours(h)}
                    style={{
                      width: 54, height: 54,
                      border: `2px solid ${sel ? '#d97706' : '#2a1810'}`,
                      background: sel ? '#1c0e00' : '#0f0804',
                      color: sel ? '#fbbf24' : '#6b5040',
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: sel ? '0 0 12px rgba(217,119,6,0.35), 3px 3px 0 #000' : '2px 2px 0 #000',
                      transition: 'all 0.1s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      ...S,
                    }}
                  >
                    <span>{h}</span>
                    <span style={{ fontSize: 5, opacity: 0.5, marginTop: 2 }}>h</span>
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 8, fontSize: 7, color: '#3d2817' }}>{selectedHours * 60} min de combate</p>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a1810, transparent)', marginBottom: 22 }} />

          {/* Domain */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 12 }}>DOMINIO INICIAL</p>

            {domains.length === 0 ? (
              <div style={{ padding: '16px', border: '2px solid #1a0e08', color: '#4a3828', fontSize: 7, textAlign: 'center' }}>
                Sin dominios. Forja uno primero.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {domains.map(d => {
                  const b = BEASTS[d.beastId as keyof typeof BEASTS];
                  const sel = d.id === selectedDomainId;
                  return (
                    <button
                      key={d.id} onClick={() => handleDomainClick(d)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        border: `2px solid ${sel ? '#92400e' : '#1a0e08'}`,
                        background: sel ? '#1c0800' : '#0f0804',
                        cursor: 'pointer', textAlign: 'left',
                        boxShadow: sel ? '0 0 12px rgba(146,64,14,0.25), 3px 3px 0 #000' : '2px 2px 0 #000',
                        transition: 'all 0.1s',
                      }}
                    >
                      {b && (
                        <img src={b.spriteImg} alt={b.name} style={{ width: 34, height: 34, imageRendering: 'pixelated', objectFit: 'contain', opacity: sel ? 1 : 0.45 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 9, color: sel ? '#fbbf24' : '#8b7355', marginBottom: 3 }}>{d.name}</p>
                        {d.dailyTargetHours > 0 && (
                          <p style={{ fontSize: 6, color: '#3d2817' }}>{d.dailyTargetHours}h/día · {b?.name}</p>
                        )}
                      </div>
                      {sel && <span style={{ fontSize: 9, color: '#fbbf24' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a1810, transparent)', marginBottom: 22 }} />

          {/* Beast */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 12 }}>BESTIA</p>

            {selectedBeast && (
              <div style={{ position: 'relative', overflow: 'hidden', padding: '10px 14px', border: '2px solid #2a1810', background: '#0f0804', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                {selectedBeast.bgImg && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12, pointerEvents: 'none' }} />
                )}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={selectedBeast.spriteImg} alt={selectedBeast.name} style={{ width: 60, height: 60, imageRendering: 'pixelated', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${selectedBeast.color}88)` }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ fontSize: 10, color: '#fbbf24', marginBottom: 4 }}>{selectedBeast.name}</p>
                  <p style={{ fontSize: 6, color: '#4a3828', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedBeast.lore.slice(0, 90)}...</p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
              {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
                const beast = BEASTS[beastId];
                const unlocked = isBeastUnlocked(beastId, playerEraIndex, debugUnlockAll);
                const sel = selectedBeastId === beastId;
                return (
                  <button
                    key={beastId}
                    onClick={() => unlocked && setSelectedBeastId(beastId)}
                    title={unlocked ? beast.name : `Requiere Era ${['I','II','III','IV','V','VI','VII','VIII','IX','X'][beast ? BEAST_UNLOCK_ORDER.find(e => e.beastId === beastId)?.eraIndex ?? 0 : 0]}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px',
                      border: `2px solid ${sel ? '#d97706' : unlocked ? '#2a1810' : '#120808'}`,
                      background: sel ? '#1c0e00' : unlocked ? '#0f0804' : '#080504',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.4,
                      boxShadow: sel ? '0 0 10px rgba(217,119,6,0.3)' : 'none',
                      transition: 'border-color 0.1s',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: 44, height: 44, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img src={beast.spriteImg} alt={unlocked ? beast.name : '???'} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0)' }} />
                      {!unlocked && <span style={{ position: 'absolute', fontSize: 14 }}>🔒</span>}
                    </div>
                    <span style={{ fontSize: 5, color: sel ? '#fbbf24' : unlocked ? '#6b5040' : '#2a1810', textAlign: 'center', lineHeight: 1.4 }}>
                      {unlocked ? beast.name : '???'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '12px 0', border: '2px solid #2a1810', background: '#0f0804', color: '#6b5040', fontSize: 8, cursor: 'pointer', boxShadow: '3px 3px 0 #000', ...S }}
            >
              CANCELAR
            </button>
            <button
              disabled={!canStart}
              onClick={() => canStart && onStart(selectedHours * 60, selectedDomainId, selectedBeastId)}
              style={{
                flex: 2, padding: '12px 0',
                border: `2px solid ${canStart ? '#d97706' : '#1a0e08'}`,
                background: canStart ? '#1c0e00' : '#0a0504',
                color: canStart ? '#fbbf24' : '#2a1810',
                fontSize: 10, cursor: canStart ? 'pointer' : 'not-allowed',
                boxShadow: canStart ? '0 0 16px rgba(217,119,6,0.3), 3px 3px 0 #000' : 'none',
                animation: canStart ? 'throb 2s ease-in-out infinite' : 'none',
                letterSpacing: '0.08em', ...S,
              }}
            >
              ⚔  COMENZAR · {selectedHours}h
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes throb { 0%,100%{box-shadow:0 0 16px rgba(217,119,6,0.3),3px 3px 0 #000} 50%{box-shadow:0 0 28px rgba(217,119,6,0.55),3px 3px 0 #000} }
      `}</style>
    </div>
  );
}
