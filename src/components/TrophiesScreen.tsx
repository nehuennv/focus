import { useState } from 'react';
import { useStore, LEVELS, ACHIEVEMENTS } from '../store/useStore';

interface TrophiesScreenProps {
  onBackToMenu: () => void;
}

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const CATEGORY_LABELS: Record<string, string> = {
  tiempo:   '⏱  TIEMPO',
  bestias:  '☠  BESTIAS',
  dominios: '📜  DOMINIOS',
  sesiones: '⚔  SESIONES',
  nivel:    '⭐  NIVEL',
};

const CATEGORY_COLORS: Record<string, string> = {
  tiempo:   '#fbbf24',
  bestias:  '#dc2626',
  dominios: '#4ade80',
  sesiones: '#60a5fa',
  nivel:    '#c084fc',
};

type Tab = 'niveles' | 'logros';

// ── Shared style helpers ───────────────────────────────────────────────────────
const S = {
  label:   { fontSize: 10, letterSpacing: '0.15em' } as React.CSSProperties,
  body:    { fontSize: 12, lineHeight: 1.8 }          as React.CSSProperties,
  heading: { fontSize: 14, letterSpacing: '0.1em' }   as React.CSSProperties,
  big:     { fontSize: 20 }                            as React.CSSProperties,
  hero:    { fontSize: 28 }                            as React.CSSProperties,
};

export function TrophiesScreen({ onBackToMenu }: TrophiesScreenProps) {
  const { player, ritualSessions } = useStore();
  const [tab, setTab] = useState<Tab>('niveles');

  const totalMins   = player.totalAccumulatedMins;
  const totalHours  = Math.floor(totalMins / 60);

  const currentLevelData  = LEVELS.find(l => l.level === player.level) ?? LEVELS[0];
  const nextLevelData      = LEVELS.find(l => l.level === player.level + 1);
  const isMaxLevel         = player.level >= LEVELS[LEVELS.length - 1].level;
  const xpIntoLevel        = player.xp - currentLevelData.xpRequired;
  const xpNeededForLevel   = isMaxLevel ? 1 : (nextLevelData!.xpRequired - currentLevelData.xpRequired);
  const levelProgress      = isMaxLevel ? 100 : Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100);

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
    fontSize: 11,
    padding: '10px 20px',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: active ? '3px 3px 0 #000' : '2px 2px 0 #000',
    letterSpacing: '0.08em',
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
            <div style={{ width: 100 }} />
          </div>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a2218 20%, #2a2218 80%, transparent)' }} />
        </header>

        {/* ── STATS ROW ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'NIVEL',    value: `LV ${player.level}`,                      color: '#c084fc', border: '#581c87' },
            { label: 'XP TOTAL', value: player.xp.toLocaleString(),                color: '#fbbf24', border: '#92400e' },
            { label: 'RITUALES', value: ritualSessions.length,                      color: '#60a5fa', border: '#1e3a5f' },
            { label: 'LOGROS',   value: `${unlockedCount}/${ACHIEVEMENTS.length}`, color: '#4ade80', border: '#14532d' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className="p-4 text-center" style={{ border: `2px solid ${border}`, background: '#0a0504', boxShadow: '3px 3px 0 #000' }}>
              <p style={{ ...S.label, color: '#5c4a3d', marginBottom: 12 }}>{label}</p>
              <p style={{ ...S.big, color, textShadow: '2px 2px 0 #000' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-7">
          <button style={TAB_BTN(tab === 'niveles')} onClick={() => setTab('niveles')}>NIVELES</button>
          <button style={TAB_BTN(tab === 'logros')}  onClick={() => setTab('logros')}>LOGROS</button>
        </div>

        {/* ══ TAB: NIVELES ═════════════════════════════════════════════ */}
        {tab === 'niveles' && (
          <div>
            {/* Level hero card */}
            <div className="mb-6 p-8 text-center relative overflow-hidden" style={{ border: '3px solid #581c87', background: '#0a000f', boxShadow: '4px 4px 0 #000, 0 0 28px rgba(192,132,252,0.15)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(192,132,252,0.06) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <p style={{ ...S.label, color: '#7c3aed', marginBottom: 16 }}>⸺  NIVEL ACTUAL  ⸺</p>
                <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 8, animation: 'ember-pulse 3s ease-in-out infinite' }}>
                  {currentLevelData.icon}
                </div>
                <div style={{ ...S.hero, color: '#c084fc', textShadow: '3px 3px 0 #000', marginBottom: 6 }}>
                  LV {player.level}
                </div>
                <h2 style={{ ...S.heading, fontSize: 18, color: '#e9d5ff', marginBottom: 24 }}>
                  {currentLevelData.title.toUpperCase()}
                </h2>

                {!isMaxLevel ? (
                  <div style={{ textAlign: 'left' }}>
                    <div className="flex justify-between" style={{ marginBottom: 6 }}>
                      <span style={{ ...S.label, color: '#4c1d95' }}>{player.xp.toLocaleString()} XP</span>
                      <span style={{ ...S.label, color: '#4c1d95' }}>
                        → LV {nextLevelData!.level} · {nextLevelData!.xpRequired.toLocaleString()} XP
                      </span>
                    </div>
                    <div style={{ height: 14, background: '#07000f', border: '2px solid #2d1b69', position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${levelProgress}%`, background: 'linear-gradient(to right, #581c87, #c084fc)', transition: 'width 0.6s ease' }} />
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(0,0,0,0.4) calc(10% - 1px), rgba(0,0,0,0.4) 10%)', pointerEvents: 'none' }} />
                    </div>
                    <div className="flex justify-between">
                      <span style={{ ...S.label, color: '#4c1d95' }}>{xpIntoLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP</span>
                      <span style={{ ...S.label, color: '#7c3aed' }}>{Math.round(levelProgress)}%</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ ...S.heading, color: '#c084fc' }}>★  NIVEL MÁXIMO ALCANZADO  ★</p>
                )}

                {/* XP guide */}
                <div style={{ marginTop: 24, padding: 16, border: '1px solid #2d1b69', background: '#07000f' }}>
                  <p style={{ ...S.label, color: '#4c1d95', textAlign: 'center', marginBottom: 16 }}>⸺  CÓMO GANAR XP  ⸺</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: '1 min enfoque', value: '10 XP' },
                      { label: '30+ min bonus', value: '+10%' },
                      { label: '60+ min bonus', value: '+25%' },
                      { label: 'Boss derrotado', value: '+150 XP' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-3" style={{ border: '1px solid #1e1040', background: '#050010' }}>
                        <p style={{ ...S.label, color: '#4c1d95', marginBottom: 8, fontSize: 9 }}>{label}</p>
                        <p style={{ ...S.body, color: '#c084fc', fontSize: 13 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Level ladder */}
            <div className="p-5" style={{ border: '2px solid #3d2817', background: '#0a0504', boxShadow: '3px 3px 0 #000' }}>
              <p style={{ ...S.label, color: '#5c4a3d', textAlign: 'center', marginBottom: 20 }}>⸺  ESCALAFÓN DE NIVELES  ⸺</p>
              <div className="space-y-1">
                {LEVELS.map((lvl) => {
                  const isUnlocked = player.level >= lvl.level;
                  const isCurrent  = player.level === lvl.level;
                  return (
                    <div
                      key={lvl.level}
                      className="flex items-center gap-3 p-3"
                      style={{
                        border: `1px solid ${isCurrent ? '#581c87' : isUnlocked ? '#2d1b69' : '#1a1008'}`,
                        background: isCurrent ? '#0a000f' : isUnlocked ? '#07000a' : '#0a0504',
                        opacity: isUnlocked ? 1 : 0.4,
                      }}
                    >
                      <span style={{ width: 26, textAlign: 'center', fontSize: 16, opacity: isUnlocked ? 1 : 0.3 }}>{lvl.icon}</span>
                      <span style={{ ...S.label, width: 36, color: isCurrent ? '#c084fc' : isUnlocked ? '#7c3aed' : '#2d1b69', flexShrink: 0 }}>
                        LV{lvl.level}
                      </span>
                      <span style={{ ...S.body, flex: 1, fontSize: 11, color: isCurrent ? '#e9d5ff' : isUnlocked ? '#a78bfa' : '#2d1b69' }}>
                        {lvl.title.toUpperCase()}
                      </span>
                      <span style={{ ...S.label, color: '#3d2817', fontSize: 9 }}>
                        {lvl.xpRequired.toLocaleString()} XP
                      </span>
                      {isCurrent && (
                        <span style={{ ...S.label, fontSize: 9, padding: '4px 8px', border: '1px solid #581c87', color: '#c084fc', background: '#0f0018' }}>
                          ACTUAL
                        </span>
                      )}
                      {isUnlocked && !isCurrent && (
                        <span style={{ fontSize: 14, color: '#166534' }}>✓</span>
                      )}
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
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
