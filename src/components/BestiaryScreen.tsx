import { useStore, BEASTS, BEAST_UNLOCK_ORDER, ERAS, getBeastEraRequirement, isBeastUnlocked } from '../store/useStore';
import type { BestiaryEntry } from '../store/useStore';

interface BestiaryScreenProps {
  onBackToMenu: () => void;
}

const ROMAN_NUM = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

const fmtMins = (m: number): string => {
  if (m === 0) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? (min > 0 ? `${h}h ${min}m` : `${h}h`) : `${min}m`;
};

export function BestiaryScreen({ onBackToMenu }: BestiaryScreenProps) {
  const { bestiary, player, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const registeredCount = bestiary.filter(b => b.defeats > 0).length;
  const totalKills    = bestiary.reduce((s, b) => s + b.defeats, 0);
  const totalMins     = bestiary.reduce((s, b) => s + b.totalMinsDefeated, 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '28px 24px 48px',
        background: '#070402',
        backgroundImage:
          'radial-gradient(ellipse at 20% 10%, rgba(80,10,10,0.18) 0%, transparent 50%),' +
          'radial-gradient(ellipse at 80% 90%, rgba(30,10,50,0.12) 0%, transparent 50%)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadeup 0.3s ease-out',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <header style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={onBackToMenu}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 10, padding: '10px 16px',
                border: '3px solid #3d2817', background: '#0f0804', color: '#8b7355',
                cursor: 'pointer',
              }}
            >
              ← VOLVER
            </button>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: 20, color: '#dc2626', letterSpacing: '0.12em',
                textShadow: '3px 3px 0 #000, 0 0 30px rgba(220,38,38,0.4)',
                marginBottom: 10,
              }}>
                CODEX BESTIARUM
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Stat label="REGISTRADAS" value={`${registeredCount}/${BEAST_UNLOCK_ORDER.length}`} color="#fbbf24" />
                <div style={{ width: 1, height: 28, background: '#2a1810' }} />
                <Stat label="DERROTAS" value={String(totalKills)} color="#dc2626" />
                <div style={{ width: 1, height: 28, background: '#2a1810' }} />
                <Stat label="TIEMPO TOTAL" value={fmtMins(totalMins)} color="#60a5fa" />
              </div>
            </div>

            <div style={{ width: 90 }} />
          </div>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #3a1a1a 20%, #3a1a1a 80%, transparent)' }} />
        </header>

        {/* ── BEAST GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
          gap: 20,
        }}>
          {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
            const beast = BEASTS[beastId];
            const entry = bestiary.find(b => b.beastId === beastId)
              ?? { beastId, name: beast.name, defeats: 0, totalMinsDefeated: 0 };
            const unlocked = isBeastUnlocked(beastId, playerEraIndex, debugUnlockAll);
            const defeated  = entry.defeats > 0;
            const isLegend  = entry.defeats >= 5;

            const reqEraIdx = getBeastEraRequirement(beastId);
            const reqEra    = ERAS[reqEraIdx];

            return (
              <div
                key={beastId}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  border: `3px solid ${isLegend ? '#92400e' : defeated ? '#3a1a10' : unlocked ? '#1e1208' : '#111'}`,
                  boxShadow: isLegend
                    ? '4px 4px 0 #000, 0 0 24px rgba(146,64,14,0.3)'
                    : '4px 4px 0 #000',
                  minHeight: 200,
                }}
              >
                {/* Background scene */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(img/originales/${beastId}Bg.png)`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: !unlocked
                    ? 'blur(5px) brightness(0.04) saturate(0)'
                    : defeated
                    ? 'blur(2px) brightness(0.3)'
                    : 'blur(3px) brightness(0.07)',
                  transform: 'scale(1.06)',
                  transition: 'filter 0.4s',
                }} />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(5,2,1,0.3) 0%, rgba(5,2,1,0.05) 35%, rgba(5,2,1,0.55) 100%)',
                }} />

                {/* Legend glow */}
                {isLegend && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 15% 50%, rgba(146,64,14,0.15) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: 200 }}>

                  {/* ── Sprite column ── */}
                  <div style={{
                    width: 130, flexShrink: 0,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    padding: '8px 0 8px 10px',
                    position: 'relative',
                  }}>
                    <img
                      src={`img/personaje/jefes/${beastId}.png`}
                      alt={unlocked ? beast.name : '???'}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = beast.spriteImg; }}
                      style={{
                        maxHeight: 175, maxWidth: 115,
                        objectFit: 'contain', imageRendering: 'pixelated',
                        filter: !unlocked
                          ? 'brightness(0)'
                          : !defeated
                          ? 'brightness(0.35) saturate(0.2)'
                          : `drop-shadow(0 4px 14px rgba(0,0,0,0.95)) drop-shadow(0 0 20px ${beast.color}55)`,
                        transition: 'filter 0.3s',
                      }}
                    />
                    {!unlocked && (
                      <div style={{
                        position: 'absolute', bottom: 18, left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 22,
                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))',
                      }}>
                        🔒
                      </div>
                    )}
                  </div>

                  {/* ── Info column ── */}
                  <div style={{ flex: 1, padding: '16px 18px 14px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {!unlocked ? (
                      /* ── LOCKED state ── */
                      <LockedPanel beast={beast} reqEra={reqEra} reqEraIdx={reqEraIdx} playerEraIndex={playerEraIndex} />
                    ) : (
                      /* ── UNLOCKED state ── */
                      <>
                        {/* Name header */}
                        <div>
                          <div style={{
                            width: 24, height: 2, marginBottom: 8,
                            background: defeated ? beast.color : '#3a3a3a',
                            boxShadow: defeated ? `0 0 8px ${beast.color}` : 'none',
                          }} />
                          <div style={{ fontSize: 6, color: defeated ? beast.color : '#3a3a52', letterSpacing: '0.15em', marginBottom: 5 }}>
                            {defeated ? 'BESTIA REGISTRADA' : 'BESTIA INVICTA'}
                          </div>
                          <div style={{
                            fontSize: 13, color: defeated ? '#fbbf24' : '#3a3a52',
                            textShadow: defeated ? '2px 2px 0 #000' : 'none',
                            marginBottom: 3, letterSpacing: '0.04em',
                          }}>
                            {beast.name}
                          </div>
                          <div style={{ fontSize: 7, color: defeated ? '#8b7355' : '#2a2a32', lineHeight: 1.5, marginBottom: 10 }}>
                            {beast.fullName}
                          </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                          <StatBox label="VICTORIAS" value={String(entry.defeats)} color={defeated ? '#fbbf24' : '#252535'} />
                          <StatBox label="TIEMPO" value={fmtMins(entry.totalMinsDefeated)} color={defeated ? '#60a5fa' : '#252535'} />
                        </div>

                        {/* Nemesis progress */}
                        {defeated && (
                          <NemesisBar defeats={entry.defeats} color={beast.color} />
                        )}

                        {/* Lore (only if defeated) */}
                        {defeated && (
                          <div style={{
                            fontSize: 6, color: '#6b5040', lineHeight: 2.1,
                            marginTop: 8,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {beast.lore}
                          </div>
                        )}

                        {/* Unsealed prompt */}
                        {!defeated && (
                          <div style={{
                            marginTop: 8, padding: '8px 10px',
                            border: '1px solid #1a1a1a', background: 'rgba(0,0,0,0.4)',
                            fontSize: 6, color: '#2a2a32', letterSpacing: '0.12em', textAlign: 'center',
                          }}>
                            SIN REGISTROS DE COMBATE
                          </div>
                        )}

                        {/* Legend badge */}
                        {isLegend && (
                          <div style={{
                            marginTop: 8, padding: '7px 10px', textAlign: 'center',
                            border: '2px solid #92400e', background: '#1c0800',
                            fontSize: 7, color: '#fbbf24', letterSpacing: '0.1em',
                            animation: 'ember-pulse 2s ease-in-out infinite',
                          }}>
                            ★ NÉMESIS LEGENDARIA · {entry.defeats} VICTORIAS
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 6, color: '#4a3a30', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color, textShadow: '2px 2px 0 #000' }}>{value}</div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '8px 6px',
      border: '1px solid #1a1008', background: 'rgba(0,0,0,0.35)',
    }}>
      <div style={{ fontSize: 5, color: '#3a3a52', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, color, textShadow: '2px 2px 0 #000' }}>{value}</div>
    </div>
  );
}

function NemesisBar({ defeats, color }: { defeats: number; color: string }) {
  const NEMESIS_AT = 5;
  const pct = Math.min(100, (defeats / NEMESIS_AT) * 100);
  const reached = defeats >= NEMESIS_AT;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 5, color: '#3a3a52', letterSpacing: '0.1em' }}>
          NÉMESIS {reached ? '— ALCANZADA' : `${defeats}/${NEMESIS_AT}`}
        </span>
      </div>
      <div style={{ height: 4, background: '#1a1008', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: reached ? '#fbbf24' : color,
          boxShadow: reached ? `0 0 8px #fbbf24` : `0 0 6px ${color}`,
          transition: 'width 0.6s ease-out',
        }} />
      </div>
    </div>
  );
}

function LockedPanel({
  beast, reqEra, reqEraIdx, playerEraIndex,
}: {
  beast: typeof BEASTS[keyof typeof BEASTS];
  reqEra: typeof ERAS[number];
  reqEraIdx: number;
  playerEraIndex: number;
}) {
  const currentEra = ERAS[Math.min(playerEraIndex, ERAS.length - 1)];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', height: '100%' }}>
      <div>
        <div style={{ width: 24, height: 2, background: '#1a1a1a', marginBottom: 8 }} />
        <div style={{ fontSize: 6, color: '#2a2a2a', letterSpacing: '0.15em', marginBottom: 6 }}>
          BESTIA SELLADA
        </div>
        <div style={{ fontSize: 12, color: '#333', marginBottom: 2 }}>???</div>
        <div style={{ fontSize: 6, color: '#222', lineHeight: 1.6 }}>
          {beast.name} · identidad oculta
        </div>
      </div>

      {/* Era requirement */}
      <div style={{
        padding: '10px 12px',
        border: `2px solid ${reqEra.border}`,
        background: reqEra.bg,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{reqEra.icon}</span>
        <div>
          <div style={{ fontSize: 5, color: '#4b5563', letterSpacing: '0.1em', marginBottom: 4 }}>
            DESBLOQUEA EN
          </div>
          <div style={{ fontSize: 9, color: reqEra.color, letterSpacing: '0.06em' }}>
            Era {ROMAN_NUM[reqEraIdx]} — {reqEra.name}
          </div>
          <div style={{ fontSize: 5, color: '#4b5563', marginTop: 3 }}>
            {reqEra.startMins >= 60
              ? `${Math.floor(reqEra.startMins / 60)}h de enfoque acumuladas`
              : `${reqEra.startMins} min acumulados`}
          </div>
        </div>
      </div>

      {/* Current era */}
      <div style={{ fontSize: 5, color: '#2a2a2a', letterSpacing: '0.08em' }}>
        Tu era actual:{' '}
        <span style={{ color: currentEra.color }}>
          {currentEra.icon} Era {ROMAN_NUM[playerEraIndex]} — {currentEra.name}
        </span>
      </div>
    </div>
  );
}
