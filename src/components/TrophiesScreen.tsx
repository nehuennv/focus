import { useState } from 'react';
import { useStore, ERAS, ROMAN, ACHIEVEMENTS, getRankProgress } from '../store/useStore';

interface TrophiesScreenProps {
  onBackToMenu: () => void;
  onOpenTutorial: () => void;
}

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const CATEGORY_LABELS: Record<string, string> = {
  tiempo:     '⏱  TIEMPO',
  bestias:    '☠  BESTIAS',
  dominios:   '📜  DOMINIOS',
  sesiones:   '⚔  SESIONES',
  progresion: '🔮  PROGRESIÓN',
};

const CATEGORY_COLORS: Record<string, string> = {
  tiempo:     '#fbbf24',
  bestias:    '#dc2626',
  dominios:   '#4ade80',
  sesiones:   '#60a5fa',
  progresion: '#c084fc',
};

type Tab = 'progresion' | 'logros';

const S = {
  label:   { fontSize: 10, letterSpacing: '0.15em' } as React.CSSProperties,
  body:    { fontSize: 12, lineHeight: 1.8 }          as React.CSSProperties,
  heading: { fontSize: 14, letterSpacing: '0.1em' }   as React.CSSProperties,
  big:     { fontSize: 20 }                            as React.CSSProperties,
  hero:    { fontSize: 28 }                            as React.CSSProperties,
};

export function TrophiesScreen({ onBackToMenu, onOpenTutorial }: TrophiesScreenProps) {
  const { player, ritualSessions } = useStore();
  const [tab, setTab] = useState<Tab>('progresion');

  const rp          = getRankProgress(player.totalAccumulatedMins);
  const era         = rp.era;
  const roman       = ROMAN[rp.rankInEra - 1];
  const totalMins   = player.totalAccumulatedMins;
  const totalHours  = Math.floor(totalMins / 60);

  // Next rank info
  const nextRankInEra  = rp.rankInEra < 10 ? rp.rankInEra + 1 : null;
  const nextEra        = rp.eraIdx < ERAS.length - 1 ? ERAS[rp.eraIdx + 1] : null;
  const minsToNextRank = rp.rankEnd - totalMins;
  const minsToNextEra  = nextEra ? nextEra.startMins - totalMins : null;

  const unlockedSet            = new Set(player.unlockedAchievements);
  const achievementsByCategory = ACHIEVEMENTS.reduce<Record<string, typeof ACHIEVEMENTS>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});
  const unlockedCount = player.unlockedAchievements.length;

  const TAB_BTN = (active: boolean): React.CSSProperties => ({
    border: `2px solid ${active ? '#92400e' : '#3d2817'}`,
    background: active ? '#1c0800' : '#0a0504',
    color: active ? '#fbbf24' : '#5c4a3d',
    fontSize: 10,
    padding: '10px 18px',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: active ? '3px 3px 0 #000' : '2px 2px 0 #000',
    letterSpacing: '0.06em',
  });

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: '#0a0504',
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(120,60,20,0.12) 0%, transparent 60%),' +
          'radial-gradient(ellipse at 50% 100%, rgba(60,25,10,0.08) 0%, transparent 60%)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadeup 0.3s ease-out',
      }}
    >
      <div className="w-full max-w-4xl mx-auto">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onBackToMenu}
              style={{ border: '2px solid #3d2817', background: '#0f0804', color: '#8b7355', fontSize: 11, padding: '10px 16px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}
            >
              ← VOLVER
            </button>
            <h1 style={{ ...S.heading, fontSize: 16, color: '#fbbf24', textShadow: '3px 3px 0 #000', letterSpacing: '0.15em' }}>
              SALÓN DE LA FAMA
            </h1>
            <button
              onClick={onOpenTutorial}
              title="Ayuda y tutorial"
              style={{ border: '2px solid #3d2817', background: '#0f0804', color: '#8b7355', fontSize: 11, padding: '10px 14px', fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}
            >
              ? AYUDA
            </button>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a2218 20%, #2a2218 80%, transparent)' }} />
        </header>

        {/* ── STATS ROW ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'RANGO',    value: `${era.name.slice(0,8).toUpperCase()} ${roman}`, color: era.color, border: era.border },
            { label: 'PUNTUACIÓN', value: player.xp.toLocaleString() + ' pts',          color: '#fbbf24', border: '#92400e' },
            { label: 'RITUALES', value: ritualSessions.length,                           color: '#60a5fa', border: '#1e3a5f' },
            { label: 'LOGROS',   value: `${unlockedCount}/${ACHIEVEMENTS.length}`,       color: '#4ade80', border: '#14532d' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className="p-4 text-center" style={{ border: `2px solid ${border}`, background: '#0a0504', boxShadow: '3px 3px 0 #000' }}>
              <p style={{ ...S.label, color: '#5c4a3d', marginBottom: 12, fontSize: 9 }}>{label}</p>
              <p style={{ fontSize: 14, color, textShadow: '2px 2px 0 #000', lineHeight: 1.3 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-7">
          <button style={TAB_BTN(tab === 'progresion')} onClick={() => setTab('progresion')}>PROGRESIÓN</button>
          <button style={TAB_BTN(tab === 'logros')}     onClick={() => setTab('logros')}>LOGROS</button>
        </div>

        {/* ══ TAB: PROGRESIÓN ══════════════════════════════════════════ */}
        {tab === 'progresion' && (
          <div>
            {/* Era hero card */}
            <div
              className="mb-6 p-8 text-center relative overflow-hidden"
              style={{
                border: `3px solid ${era.border}`,
                background: era.bg,
                boxShadow: `4px 4px 0 #000, 0 0 32px ${era.glow}`,
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${era.glow} 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <p style={{ ...S.label, color: era.border, marginBottom: 16 }}>⸺  RANGO ACTUAL  ⸺</p>
                <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8, animation: 'ember-pulse 3s ease-in-out infinite' }}>
                  {era.icon}
                </div>
                <div style={{ ...S.hero, color: era.color, textShadow: `3px 3px 0 #000`, marginBottom: 4 }}>
                  {era.name.toUpperCase()}
                </div>
                <div style={{ ...S.heading, fontSize: 22, color: era.color, marginBottom: 6, opacity: 0.7 }}>
                  {roman}
                </div>
                <p style={{ ...S.body, fontSize: 11, color: '#5c4a3d', marginBottom: 20 }}>
                  {fmt(totalMins)} de enfoque total · {totalHours}h
                </p>

                {/* Rank progress bar */}
                {!rp.isAbsMax && (
                  <div style={{ textAlign: 'left', marginBottom: 16 }}>
                    <div className="flex justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ ...S.label, color: era.border, fontSize: 9 }}>
                        {era.name.toUpperCase()} {roman}
                      </span>
                      <span style={{ ...S.label, color: era.border, fontSize: 9 }}>
                        {nextRankInEra
                          ? `→ ${era.name.toUpperCase()} ${ROMAN[rp.rankInEra]} en ${fmt(minsToNextRank)}`
                          : nextEra
                            ? `→ ERA ${nextEra.name.toUpperCase()} en ${fmt(minsToNextEra!)}`
                            : ''}
                      </span>
                    </div>
                    <div style={{ height: 14, background: '#07000f', border: `2px solid ${era.border}`, position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${rp.progress}%`, background: `linear-gradient(to right, ${era.border}, ${era.color})`, transition: 'width 0.6s ease' }} />
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.3) calc(10% - 1px), rgba(0,0,0,0.3) 10%)', pointerEvents: 'none' }} />
                    </div>
                    <div className="flex justify-between">
                      <span style={{ ...S.label, color: era.border, fontSize: 9 }}>{fmt(totalMins - rp.rankStart)} / {fmt(era.minsPerRank)}</span>
                      <span style={{ ...S.label, color: era.color, fontSize: 9 }}>{Math.round(rp.progress)}%</span>
                    </div>
                  </div>
                )}
                {rp.isAbsMax && (
                  <p style={{ ...S.heading, color: era.color }}>★  MAESTRÍA ABSOLUTA ALCANZADA  ★</p>
                )}

                {/* Era summary row */}
                <div style={{ marginTop: 20, padding: 16, border: `1px solid ${era.border}`, background: '#07000f' }}>
                  <p style={{ ...S.label, color: era.border, textAlign: 'center', marginBottom: 16, fontSize: 9 }}>⸺  RESUMEN DE LA JERARQUÍA  ⸺</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Era actual',   value: `${rp.eraIdx + 1} / 10` },
                      { label: 'Rango global', value: `${player.rankIndex + 1} / 100` },
                      { label: 'Próx. Era en', value: minsToNextEra != null && minsToNextEra > 0 ? fmt(minsToNextEra) : '—' },
                      { label: 'Puntuación',   value: player.xp.toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-3" style={{ border: `1px solid ${era.border}`, background: era.bg }}>
                        <p style={{ ...S.label, color: era.border, marginBottom: 8, fontSize: 8 }}>{label}</p>
                        <p style={{ ...S.body, color: era.color, fontSize: 12 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full 100-rank escalafón grouped by era */}
            <div className="p-5" style={{ border: '2px solid #3d2817', background: '#0a0504', boxShadow: '3px 3px 0 #000' }}>
              <p style={{ ...S.label, color: '#5c4a3d', textAlign: 'center', marginBottom: 24 }}>
                ⸺  ESCALAFÓN COMPLETO — 10 ERAS × 10 RANGOS  ⸺
              </p>
              <div className="space-y-6">
                {ERAS.map((e) => {
                  const eraUnlocked = player.rankIndex >= e.index * 10;
                  const isCurrentEra = rp.eraIdx === e.index;
                  return (
                    <div key={e.name}>
                      {/* Era header */}
                      <div
                        className="flex items-center gap-3 px-3 py-2 mb-2"
                        style={{
                          border: `2px solid ${isCurrentEra ? e.border : eraUnlocked ? e.border + '55' : '#1a1008'}`,
                          background: isCurrentEra ? e.bg : eraUnlocked ? '#0a0504' : '#070504',
                          opacity: eraUnlocked ? 1 : 0.4,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{e.icon}</span>
                        <span style={{ ...S.heading, color: isCurrentEra ? e.color : eraUnlocked ? e.color + 'aa' : '#3d2817', fontSize: 13 }}>
                          ERA {['I','II','III','IV','V','VI','VII','VIII','IX','X'][e.index]} — {e.name.toUpperCase()}
                        </span>
                        <span style={{ ...S.label, color: '#3d2817', fontSize: 8, marginLeft: 'auto' }}>
                          desde {e.startMins.toLocaleString()} min · {e.minsPerRank} min/rango
                        </span>
                        {eraUnlocked && !isCurrentEra && (
                          <span style={{ fontSize: 14, color: '#166534' }}>✓</span>
                        )}
                        {isCurrentEra && (
                          <span style={{ ...S.label, fontSize: 8, padding: '3px 8px', border: `1px solid ${e.border}`, color: e.color, background: e.bg }}>
                            ACTUAL
                          </span>
                        )}
                      </div>
                      {/* 10 ranks within era */}
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-1 pl-2">
                        {ROMAN.map((r, ri) => {
                          const globalRank   = e.index * 10 + ri;
                          const rankUnlocked = player.rankIndex > globalRank;
                          const isThisRank   = player.rankIndex === globalRank;
                          return (
                            <div
                              key={r}
                              className="text-center py-2 px-1"
                              style={{
                                border: `1px solid ${isThisRank ? e.border : rankUnlocked ? e.border + '44' : '#1a1008'}`,
                                background: isThisRank ? e.bg : '#0a0504',
                                opacity: rankUnlocked || isThisRank ? 1 : 0.25,
                              }}
                            >
                              <div style={{ fontSize: 9, color: isThisRank ? e.color : rankUnlocked ? e.color + '99' : '#3d2817' }}>
                                {r}
                              </div>
                              {isThisRank && (
                                <div style={{ fontSize: 7, color: e.color, marginTop: 2 }}>▲</div>
                              )}
                              {rankUnlocked && !isThisRank && (
                                <div style={{ fontSize: 8, color: '#166534', marginTop: 1 }}>✓</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: LOGROS ══════════════════════════════════════════════ */}
        {tab === 'logros' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p style={{ ...S.body, color: '#8b7355' }}>
                {unlockedCount} / {ACHIEVEMENTS.length} logros desbloqueados
              </p>
              <div style={{ height: 10, width: 180, background: '#07070f', border: '2px solid #1a1408', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`, background: 'linear-gradient(to right, #14532d, #4ade80)' }} />
              </div>
            </div>

            {Object.entries(achievementsByCategory).map(([cat, aches]) => (
              <div key={cat} className="mb-8">
                <p style={{
                  ...S.heading,
                  color: CATEGORY_COLORS[cat] ?? '#8b7355',
                  borderBottom: `2px solid ${CATEGORY_COLORS[cat] ?? '#3d2817'}44`,
                  paddingBottom: 10,
                  marginBottom: 16,
                }}>
                  {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aches.map((a) => {
                    const unlocked = unlockedSet.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-4 relative overflow-hidden"
                        style={{
                          border: `2px solid ${unlocked ? a.border : '#1a1008'}`,
                          background: unlocked ? a.bg : '#0a0504',
                          boxShadow: unlocked ? `3px 3px 0 #000, 0 0 14px ${a.border}44` : '2px 2px 0 #000',
                          opacity: unlocked ? 1 : 0.45,
                        }}
                      >
                        <div style={{ fontSize: 32, flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                          {a.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ ...S.heading, color: unlocked ? a.color : '#3d2817', marginBottom: 6 }}>
                            {a.title}
                          </p>
                          <p style={{ ...S.body, fontSize: 11, color: unlocked ? '#8b7355' : '#2a1810' }}>
                            {a.desc}
                          </p>
                        </div>
                        {unlocked ? (
                          <span style={{ fontSize: 20, color: '#4ade80', flexShrink: 0 }}>✓</span>
                        ) : (
                          <span style={{ fontSize: 20, color: '#3d2817', flexShrink: 0 }}>🔒</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ember-pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
