import { useState, useEffect, useCallback, useRef } from 'react';
import { BEASTS, BEAST_UNLOCK_ORDER, ERAS, getBeastEraRequirement, isBeastUnlocked } from '../store/useStore';

interface BeastSelectDialogueProps {
  onSelect: (beastId: string) => void;
  onClose: () => void;
  playerEraIndex: number;
  debugUnlockAll?: boolean;
  width?: string | number;
}

// Lista ordenada según BEAST_UNLOCK_ORDER
const BEAST_LIST = BEAST_UNLOCK_ORDER.map(e => BEASTS[e.beastId]).filter(Boolean);

export function BeastSelectDialogue({ onSelect, onClose, playerEraIndex, debugUnlockAll = false, width }: BeastSelectDialogueProps) {
  const [cursor, setCursor] = useState(0);
  const [entered, setEntered] = useState(false);
  const [lockedFlash, setLockedFlash] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selected = BEAST_LIST[cursor];
  const selectedUnlocked = selected ? isBeastUnlocked(selected.id, playerEraIndex, debugUnlockAll) : false;

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    itemRefs.current[cursor]?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const confirm = useCallback(() => {
    if (!selected) return;
    if (!selectedUnlocked) {
      setLockedFlash(true);
      setTimeout(() => setLockedFlash(false), 600);
      return;
    }
    onSelect(selected.id);
  }, [selected, selectedUnlocked, onSelect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.stopPropagation(); e.preventDefault();
          setCursor(p => p > 0 ? p - 1 : BEAST_LIST.length - 1);
          break;
        case 'ArrowDown': case 's': case 'S':
          e.stopPropagation(); e.preventDefault();
          setCursor(p => p < BEAST_LIST.length - 1 ? p + 1 : 0);
          break;
        case 'Enter': case ' ':
          e.stopPropagation(); e.preventDefault();
          confirm();
          break;
        case 'Escape':
          e.stopPropagation();
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [confirm, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${entered ? '0' : '24px'})`,
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
        width: width ?? '840px',
        maxWidth: 'calc(100% - 40px)',
        zIndex: 200,
        fontFamily: '"Press Start 2P", monospace',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }}
    >
      {/* Speaker tab */}
      <div style={{
        display: 'inline-block', marginLeft: 20, marginBottom: -4,
        position: 'relative', zIndex: 1,
        padding: '5px 14px 8px',
        background: '#0f0804', border: '4px solid #3d2817', borderBottom: 'none',
        color: '#fbbf24', fontSize: '7px', letterSpacing: '0.05em',
      }}>
        PORTAL OSCURO
      </div>

      {/* Main panel */}
      <div style={{
        display: 'flex',
        margin: '0 0 10px',
        background: 'rgba(15,8,4,0.97)',
        border: '4px solid #3d2817',
        boxShadow: '0 -8px 60px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        minHeight: 220,
      }}>

        {/* ── Left: beast list ── */}
        <div style={{
          width: '38%',
          flexShrink: 0,
          borderRight: '2px solid #2a1810',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 14px 6px',
            fontSize: '7px', color: '#5c4a3d', letterSpacing: '0.12em',
            borderBottom: '1px solid #1a1008',
          }}>
            ¿A qué bestia te enfrentarás?
          </div>
          <div
            ref={listRef}
            style={{
              flex: 1, overflowY: 'auto',
              scrollbarWidth: 'thin', scrollbarColor: '#3d2817 #0f0804',
            }}
          >
            {BEAST_LIST.map((b, i) => {
              const unlocked = isBeastUnlocked(b.id, playerEraIndex, debugUnlockAll);
              const isActive = i === cursor;
              const reqEra = ERAS[getBeastEraRequirement(b.id)];
              return (
                <button
                  key={b.id}
                  ref={el => { itemRefs.current[i] = el; }}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => { setCursor(i); if (unlocked) onSelect(b.id); else { setLockedFlash(true); setTimeout(() => setLockedFlash(false), 600); } }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: '7px',
                    color: unlocked
                      ? (isActive ? '#fbbf24' : '#6b5040')
                      : (isActive ? '#6b7280' : '#3a3a3a'),
                    background: isActive
                      ? (unlocked ? 'rgba(251,191,36,0.08)' : 'rgba(107,114,128,0.06)')
                      : 'transparent',
                    border: 'none', borderBottom: '1px solid #150c06',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    fontFamily: '"Press Start 2P", monospace',
                    transition: 'color 0.08s, background 0.08s',
                  }}
                >
                  {/* Color dot / lock */}
                  {unlocked ? (
                    <span style={{
                      width: 7, height: 7, flexShrink: 0,
                      background: isActive ? b.color : 'transparent',
                      border: `1px solid ${b.color}`,
                      transition: 'background 0.12s',
                    }} />
                  ) : (
                    <span style={{ fontSize: '8px', flexShrink: 0, opacity: isActive ? 0.7 : 0.35 }}>🔒</span>
                  )}

                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isActive ? '▶ ' : '  '}{unlocked ? b.name : b.name}
                  </span>

                  {/* Era badge for locked */}
                  {!unlocked && (
                    <span style={{
                      fontSize: '5px',
                      color: isActive ? reqEra.color : '#3a3a3a',
                      flexShrink: 0,
                      opacity: 0.8,
                    }}>
                      {reqEra.icon}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: beast detail ── */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* BG image */}
          <div
            key={selected.id + '-bg'}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(img/originales/${selected.id}Bg.png)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: selectedUnlocked
                ? 'blur(3px) brightness(0.22)'
                : 'blur(6px) brightness(0.06) saturate(0)',
              transform: 'scale(1.08)',
              animation: 'bsd-fade 0.3s ease-out',
            }}
          />
          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: selectedUnlocked
              ? 'linear-gradient(to right, rgba(10,5,2,0.5) 0%, rgba(10,5,2,0.1) 50%, rgba(10,5,2,0.7) 100%)'
              : 'rgba(0,0,0,0.7)',
          }} />

          {/* Locked flash overlay */}
          {lockedFlash && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(239,68,68,0.18)',
              animation: 'bsd-flash 0.6s ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flex: 1, gap: 0,
            animation: 'bsd-slide 0.25s ease-out',
          }}
            key={selected.id + (selectedUnlocked ? '-u' : '-l')}
          >
            {/* Sprite */}
            <div style={{
              width: 120, flexShrink: 0,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '0 0 8px',
              position: 'relative',
            }}>
              <img
                src={`img/personaje/jefes/${selected.id}.png`}
                alt={selectedUnlocked ? selected.name : '???'}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = selected.spriteImg; }}
                style={{
                  maxHeight: 160, maxWidth: 110,
                  objectFit: 'contain', imageRendering: 'pixelated',
                  filter: selectedUnlocked
                    ? `drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${selected.color}55)`
                    : 'brightness(0) drop-shadow(0 4px 18px rgba(0,0,0,0.95))',
                  transition: 'filter 0.3s',
                }}
              />
              {!selectedUnlocked && (
                <div style={{
                  position: 'absolute', bottom: 12, left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '22px',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
                }}>
                  🔒
                </div>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, padding: '14px 16px 10px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {selectedUnlocked ? (
                <div>
                  <div style={{
                    width: 28, height: 2, marginBottom: 8,
                    background: selected.color,
                    boxShadow: `0 0 8px ${selected.color}`,
                  }} />
                  <div style={{ fontSize: '6px', color: selected.color, letterSpacing: '0.15em', marginBottom: 4 }}>
                    JEFE DE DOMINIO
                  </div>
                  <div style={{
                    fontSize: '8px', color: '#ede0c8', lineHeight: 1.7,
                    marginBottom: 10, letterSpacing: '0.02em',
                    textShadow: '1px 1px 0 #000',
                  }}>
                    {selected.fullName}
                  </div>
                  <div style={{
                    fontSize: '6px', color: '#8b7355', lineHeight: 2,
                    maxHeight: 96, overflow: 'hidden',
                    textShadow: '1px 1px 0 #000',
                  }}>
                    {selected.lore}
                  </div>
                </div>
              ) : (
                <LockedBeastPanel beastId={selected.id} playerEraIndex={playerEraIndex} />
              )}

              {/* Footer */}
              <div style={{
                marginTop: 8,
                display: 'flex', gap: 20,
                fontSize: '6px', color: '#5c4a3d',
              }}>
                <span>↑↓ navegar</span>
                {selectedUnlocked
                  ? <span>ENTER · combatir</span>
                  : <span style={{ color: '#ef4444', opacity: 0.7 }}>BLOQUEADO</span>
                }
                <span>ESC · volver</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bsd-fade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bsd-slide { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bsd-flash { 0%{opacity:1} 100%{opacity:0} }
      `}</style>
    </div>
  );
}

function LockedBeastPanel({ beastId, playerEraIndex }: { beastId: string; playerEraIndex: number }) {
  const reqEraIndex = getBeastEraRequirement(beastId);
  const reqEra = ERAS[reqEraIndex];
  const currentEra = ERAS[Math.min(playerEraIndex, ERAS.length - 1)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
      {/* Blocked header */}
      <div>
        <div style={{
          width: 28, height: 2, marginBottom: 8,
          background: '#374151',
        }} />
        <div style={{ fontSize: '6px', color: '#4b5563', letterSpacing: '0.15em', marginBottom: 8 }}>
          BESTIA SELLADA
        </div>
        <div style={{
          fontSize: '7px', color: '#6b7280', lineHeight: 1.8,
          textShadow: '1px 1px 0 #000',
        }}>
          ???, el Sellado
        </div>
      </div>

      {/* Unlock requirement */}
      <div style={{
        padding: '10px 12px',
        border: `2px solid ${reqEra.border}`,
        background: reqEra.bg,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ fontSize: '5px', color: '#6b7280', letterSpacing: '0.1em' }}>
          DESBLOQUEA EN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '16px' }}>{reqEra.icon}</span>
          <div>
            <div style={{ fontSize: '7px', color: reqEra.color, letterSpacing: '0.08em' }}>
              Era {['I','II','III','IV','V','VI','VII','VIII','IX','X'][reqEraIndex]} — {reqEra.name}
            </div>
            <div style={{ fontSize: '5px', color: '#6b7280', marginTop: 3 }}>
              {reqEra.startMins >= 60
                ? `${Math.floor(reqEra.startMins / 60)}h acumuladas`
                : `${reqEra.startMins} min acumulados`}
            </div>
          </div>
        </div>
      </div>

      {/* Current progress */}
      <div style={{ fontSize: '5px', color: '#4b5563', letterSpacing: '0.08em' }}>
        Tu era actual: {currentEra.icon}{' '}
        <span style={{ color: currentEra.color }}>
          Era {['I','II','III','IV','V','VI','VII','VIII','IX','X'][playerEraIndex]} — {currentEra.name}
        </span>
      </div>
    </div>
  );
}
