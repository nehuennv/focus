import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, isBeastUnlocked } from '../store/useStore';
import type { Domain } from '../store/useStore';

interface DailySetupScreenProps {
  onStart: (totalMins: number, domainId: string, beastId: string) => void;
  onClose: () => void;
}

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

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

  const handleDomainClick = (d: Domain) => {
    setSelectedDomainId(d.id);
    setSelectedBeastId(d.beastId);
  };

  const canStart = selectedDomainId && selectedBeastId && selectedHours > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(6,3,2,0.96)',
        backdropFilter: 'blur(4px)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadeup 0.25s ease-out',
      }}
    >
      <div
        className="w-full overflow-y-auto"
        style={{
          maxWidth: 680,
          maxHeight: '95vh',
          border: '3px solid #92400e',
          background: '#0a0504',
          boxShadow: '8px 8px 0 0 #000, 0 0 60px rgba(146,64,14,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '2px solid #2a1810', position: 'sticky', top: 0, background: '#0a0504', zIndex: 10 }}>
          {selectedBeast?.bgImg && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.05 }} />
          )}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <p style={{ fontSize: 7, color: '#5c4a3d', letterSpacing: '0.3em', marginBottom: 6 }}>⸺ PORTAL OSCURO ⸺</p>
            <h2 style={{ fontSize: 11, color: '#fbbf24', letterSpacing: '0.15em', textShadow: '2px 2px 0 #000' }}>RITUAL DEL DÍA</h2>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Resume banner */}
          {hasResumable && (
            <div style={{ marginBottom: 16, padding: '10px 14px', border: '2px solid #14532d', background: '#0a1a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 7, color: '#4ade80', letterSpacing: '0.1em', marginBottom: 4 }}>RITUAL EN CURSO</p>
                <p style={{ fontSize: 6, color: '#5c4a3d' }}>
                  {Math.round(dailySession!.elapsedDayMins)}m / {dailySession!.totalDayMins}m completados
                </p>
              </div>
              <button
                onClick={() => onStart(dailySession!.totalDayMins, dailySession!.activeDomainId, dailySession!.activeBeastId)}
                style={{ border: '2px solid #14532d', background: '#071510', color: '#4ade80', fontSize: 7, padding: '8px 14px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}
              >
                RETOMAR →
              </button>
            </div>
          )}

          {/* Hours selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em', marginBottom: 12 }}>¿CUÁNTAS HORAS HOY?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {HOUR_OPTIONS.map(h => {
                const isSelected = selectedHours === h;
                return (
                  <button
                    key={h}
                    onClick={() => setSelectedHours(h)}
                    style={{
                      width: 56, height: 56,
                      border: `3px solid ${isSelected ? '#d97706' : '#3d2817'}`,
                      background: isSelected ? '#1c0e00' : '#0f0804',
                      color: isSelected ? '#fbbf24' : '#8b7355',
                      fontSize: 14,
                      fontFamily: '"Press Start 2P", monospace',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 12px rgba(217,119,6,0.4), 3px 3px 0 #000' : '2px 2px 0 #000',
                      transition: 'all 0.1s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span>{h}</span>
                    <span style={{ fontSize: 5, opacity: 0.6, marginTop: 2 }}>h</span>
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 8, fontSize: 7, color: '#5c4a3d' }}>
              = {selectedHours * 60} min de combate
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #3d2817, transparent)', marginBottom: 20 }} />

          {/* Domain selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em', marginBottom: 12 }}>DOMINIO INICIAL</p>

            {domains.length === 0 ? (
              <div style={{ padding: '16px', border: '2px solid #3d2817', color: '#5c4a3d', fontSize: 8, textAlign: 'center' }}>
                Sin dominios. Ve al escritorio y forja uno primero.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {domains.map(d => {
                  const b = BEASTS[d.beastId as keyof typeof BEASTS];
                  const isSelected = d.id === selectedDomainId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDomainClick(d)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px',
                        border: `2px solid ${isSelected ? '#92400e' : '#2a1810'}`,
                        background: isSelected ? '#1c0800' : '#0a0504',
                        cursor: 'pointer', textAlign: 'left',
                        boxShadow: isSelected ? '0 0 10px rgba(146,64,14,0.3)' : 'none',
                      }}
                    >
                      {b && (
                        <img src={b.spriteImg} alt={b.name} style={{ width: 32, height: 32, imageRendering: 'pixelated', objectFit: 'contain', opacity: isSelected ? 1 : 0.5 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 9, color: isSelected ? '#fbbf24' : '#8b7355', marginBottom: 3 }}>{d.name}</p>
                        {d.dailyTargetHours > 0 && (
                          <p style={{ fontSize: 6, color: '#5c4a3d' }}>{d.dailyTargetHours}h/día · {b?.name}</p>
                        )}
                      </div>
                      {isSelected && <span style={{ fontSize: 8, color: '#fbbf24' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #3d2817, transparent)', marginBottom: 20 }} />

          {/* Beast selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em', marginBottom: 12 }}>BESTIA</p>

            {/* Selected beast preview */}
            {selectedBeast && (
              <div style={{ position: 'relative', overflow: 'hidden', padding: '12px 16px', border: '2px solid #3d2817', background: '#0f0804', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                {selectedBeast.bgImg && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
                )}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={selectedBeast.spriteImg} alt={selectedBeast.name} style={{ width: 64, height: 64, imageRendering: 'pixelated', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${selectedBeast.color}88)` }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ fontSize: 10, color: '#fbbf24', marginBottom: 4 }}>{selectedBeast.name}</p>
                  <p style={{ fontSize: 6, color: '#5c4a3d', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedBeast.lore.slice(0, 100)}...</p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
              {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
                const beast = BEASTS[beastId];
                const unlocked = isBeastUnlocked(beastId, playerEraIndex, debugUnlockAll);
                const isSelected = selectedBeastId === beastId;
                return (
                  <button
                    key={beastId}
                    onClick={() => unlocked && setSelectedBeastId(beastId)}
                    title={unlocked ? beast.name : `Requiere Era ${['I','II','III','IV','V','VI','VII','VIII','IX','X'][beast ? BEAST_UNLOCK_ORDER.find(e=>e.beastId===beastId)?.eraIndex ?? 0 : 0]}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '8px 4px',
                      border: `2px solid ${isSelected ? '#d97706' : unlocked ? '#3d2817' : '#1a1a1a'}`,
                      background: isSelected ? '#1c0e00' : unlocked ? '#0f0804' : '#080808',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.45,
                      boxShadow: isSelected ? '0 0 10px rgba(217,119,6,0.35)' : 'none',
                      transition: 'border-color 0.1s, background 0.1s',
                      position: 'relative',
                    }}
                  >
                    <div style={{ width: 44, height: 44, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img
                        src={beast.spriteImg}
                        alt={unlocked ? beast.name : '???'}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0)' }}
                      />
                      {!unlocked && <span style={{ position: 'absolute', fontSize: 14 }}>🔒</span>}
                    </div>
                    <span style={{ fontSize: 5, color: isSelected ? '#fbbf24' : unlocked ? '#8b7355' : '#3a3a3a', textAlign: 'center', lineHeight: 1.4 }}>
                      {unlocked ? beast.name : '???'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '12px 0', border: '2px solid #3d2817', background: '#0f0804', color: '#8b7355', fontSize: 9, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer' }}
            >
              CANCELAR
            </button>
            <button
              disabled={!canStart}
              onClick={() => canStart && onStart(selectedHours * 60, selectedDomainId, selectedBeastId)}
              style={{
                flex: 2, padding: '12px 0',
                border: `2px solid ${canStart ? '#d97706' : '#3d2817'}`,
                background: canStart ? '#1c0e00' : '#0a0504',
                color: canStart ? '#fbbf24' : '#3d2817',
                fontSize: 10, fontFamily: '"Press Start 2P", monospace',
                cursor: canStart ? 'pointer' : 'not-allowed',
                boxShadow: canStart ? '0 0 16px rgba(217,119,6,0.3), 3px 3px 0 #000' : 'none',
                animation: canStart ? 'blood-throb 2s ease-in-out infinite' : 'none',
                letterSpacing: '0.08em',
              }}
            >
              ⚔  COMENZAR RITUAL · {selectedHours}h
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeup { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blood-throb { 0%,100%{box-shadow:0 0 16px rgba(217,119,6,0.3),3px 3px 0 #000} 50%{box-shadow:0 0 28px rgba(217,119,6,0.55),3px 3px 0 #000} }
      `}</style>
    </div>
  );
}
