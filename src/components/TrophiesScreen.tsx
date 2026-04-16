import { useStore, PLAYER_RANKS } from '../store/useStore';

interface TrophiesScreenProps {
  onBackToMenu: () => void;
}

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function TrophiesScreen({ onBackToMenu }: TrophiesScreenProps) {
  const { player, domains, bestiary } = useStore();

  const totalDomains    = domains.length;
  const defeatedDomains = domains.filter(d => d.isDefeated).length;
  const totalKills      = bestiary.reduce((s, b) => s + b.defeats, 0);
  const totalMins       = player.totalAccumulatedMins;
  const totalHours      = Math.floor(totalMins / 60);

  const currentRank = PLAYER_RANKS[player.rankIndex] ?? PLAYER_RANKS[0];
  const nextRank    = PLAYER_RANKS[Math.min(player.rankIndex + 1, PLAYER_RANKS.length - 1)];
  const isMaxRank   = player.rankIndex === PLAYER_RANKS.length - 1;
  const progressToNext = isMaxRank
    ? 100
    : Math.min(100, (totalMins / nextRank.minMins) * 100);

  const TROPHIES = [
    {
      id: 'first_blood',
      icon: '⚔',
      title: 'Primera Sangre',
      desc: 'Completar 1 ritual',
      unlocked: totalKills >= 1,
      color: '#dc2626',
      border: '#7f1d1d',
      bg: '#0f0000',
    },
    {
      id: 'centurion',
      icon: '💯',
      title: 'El Centurión',
      desc: '100 minutos forjados',
      unlocked: totalMins >= 100,
      color: '#fbbf24',
      border: '#92400e',
      bg: '#0f0800',
    },
    {
      id: 'decano',
      icon: '⏳',
      title: 'Decano',
      desc: '10 horas de maestría',
      unlocked: totalHours >= 10,
      color: '#22d3ee',
      border: '#164e63',
      bg: '#000f15',
    },
    {
      id: 'beast_slayer',
      icon: '💀',
      title: 'Matador de Bestias',
      desc: '5 derrotas a un mismo jefe',
      unlocked: bestiary.some(b => b.defeats >= 5),
      color: '#c084fc',
      border: '#581c87',
      bg: '#0a000f',
    },
    {
      id: 'domain_master',
      icon: '📜',
      title: 'Maestro de Dominio',
      desc: '1 dominio completado',
      unlocked: defeatedDomains >= 1,
      color: '#4ade80',
      border: '#14532d',
      bg: '#000f05',
    },
    {
      id: 'legend',
      icon: '👑',
      title: 'Leyenda',
      desc: '100 horas totales',
      unlocked: totalHours >= 100,
      color: '#fde047',
      border: '#854d0e',
      bg: '#0f0800',
    },
  ];

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

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToMenu}
              className="btn-pixel text-[8px] px-3 py-2"
              style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
            >
              ← VOLVER
            </button>
            <div className="text-center">
              <h1 className="text-[9px] md:text-[11px] text-amber-400 tracking-widest drop-shadow-[2px_2px_0_#000]">
                SALÓN DE LA FAMA
              </h1>
            </div>
            <div style={{ width: 80 }} />
          </div>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a2218 20%, #2a2218 80%, transparent)' }} />
        </header>

        {/* ── CURRENT RANK HERO ────────────────────────────────────── */}
        <div
          className="mb-8 p-8 text-center relative overflow-hidden"
          style={{
            border: '3px solid #92400e',
            background: '#0f0804',
            boxShadow: '4px 4px 0 0 #000, 0 0 20px rgba(146,64,14,0.2)',
          }}
        >
          {/* Subtle bg gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(146,64,14,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <p className="text-[7px] mb-4 tracking-[0.3em]" style={{ color: '#8b7355' }}>
              ⸺ RANGO ALCANZADO ⸺
            </p>
            <div
              className="text-[48px] mb-3"
              style={{ animation: 'ember-pulse 3s ease-in-out infinite', lineHeight: 1 }}
            >
              {currentRank.icon}
            </div>
            <h2
              className="text-[14px] mb-4 tracking-widest drop-shadow-[2px_2px_0_#000]"
              style={{ color: '#fbbf24' }}
            >
              {currentRank.title.toUpperCase()}
            </h2>
            <p className="text-[8px] mb-6" style={{ color: '#8b7355' }}>
              {fmt(totalMins)} de maestría acumulada
            </p>

            {/* Progress to next rank */}
            {!isMaxRank && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[6px]" style={{ color: '#5c4a3d' }}>RANGO ACTUAL</span>
                  <span className="text-[6px]" style={{ color: '#5c4a3d' }}>
                    {nextRank.title.toUpperCase()} ({nextRank.minMins} min)
                  </span>
                </div>
                <div style={{ height: 8, background: '#07070f', border: '1px solid #1a1408' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressToNext}%`,
                      background: 'linear-gradient(to right, #92400e, #d97706)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p className="text-[6px] mt-2 text-right" style={{ color: '#5c4a3d' }}>
                  {Math.round(progressToNext)}%
                </p>
              </div>
            )}
            {isMaxRank && (
              <p className="text-[7px]" style={{ color: '#92400e', letterSpacing: '0.15em' }}>
                ★ MAESTRÍA ABSOLUTA ALCANZADA ★
              </p>
            )}
          </div>
        </div>

        {/* ── STATS INSCRIPTIONS ───────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[7px] text-center mb-4 tracking-[0.2em]" style={{ color: '#5c4a3d' }}>
            ⸺ INSCRIPCIONES DE BATALLA ⸺
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'DOMINIOS FORJADOS', value: totalDomains,    color: '#e4e4e7', border: '#3d2817' },
              { label: 'JEFES DERROTADOS',  value: defeatedDomains, color: '#dc2626', border: '#5c1a1a' },
              { label: 'RITUALES TOTALES',  value: totalKills,      color: '#fbbf24', border: '#92400e' },
              { label: 'HORAS DE MAESTRÍA', value: `${totalHours}h`, color: '#4ade80', border: '#14532d' },
            ].map(({ label, value, color, border }) => (
              <div
                key={label}
                className="p-4 text-center"
                style={{ border: `2px solid ${border}`, background: '#0a0504', boxShadow: '3px 3px 0 0 #000' }}
              >
                <p className="text-[6px] mb-3 leading-relaxed tracking-wide" style={{ color: '#5c4a3d' }}>
                  {label}
                </p>
                <p className="text-[20px] drop-shadow-[2px_2px_0_#000]" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RANK LADDER ──────────────────────────────────────────── */}
        <div
          className="mb-8 p-5"
          style={{ border: '2px solid #3d2817', background: '#0a0504', boxShadow: '3px 3px 0 0 #000' }}
        >
          <p className="text-[7px] text-center mb-5 tracking-[0.2em]" style={{ color: '#5c4a3d' }}>
            ⸺ ESCALAFÓN DE RANGOS ⸺
          </p>
          <div className="space-y-2">
            {PLAYER_RANKS.map((rank, i) => {
              const isUnlocked = player.rankIndex >= i;
              const isCurrent  = player.rankIndex === i;
              return (
                <div
                  key={rank.title}
                  className="flex items-center gap-3 p-3"
                  style={{
                    border: `1px solid ${isCurrent ? '#92400e' : isUnlocked ? '#3d2817' : '#1a1008'}`,
                    background: isCurrent ? '#120800' : isUnlocked ? '#0f0804' : '#0a0504',
                    opacity: isUnlocked ? 1 : 0.4,
                  }}
                >
                  <span style={{ width: 28, textAlign: 'center', fontSize: 14, opacity: isUnlocked ? 1 : 0.3 }}>
                    {rank.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-[8px]"
                        style={{ color: isCurrent ? '#fbbf24' : isUnlocked ? '#a1a1aa' : '#3a3a52' }}
                      >
                        {rank.title.toUpperCase()}
                      </span>
                      <span className="text-[6px]" style={{ color: '#3d2817' }}>
                        {rank.minMins} min
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span
                      className="text-[6px] px-2 py-1"
                      style={{ border: '1px solid #92400e', color: '#fbbf24', background: '#1c0800' }}
                    >
                      ACTUAL
                    </span>
                  )}
                  {isUnlocked && !isCurrent && (
                    <span className="text-[10px]" style={{ color: '#166534' }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TROPHY BADGES ────────────────────────────────────────── */}
        <div
          className="p-5"
          style={{ border: '2px solid #3d2817', background: '#0a0504', boxShadow: '3px 3px 0 0 #000' }}
        >
          <p className="text-[7px] text-center mb-5 tracking-[0.2em]" style={{ color: '#5c4a3d' }}>
            ⸺ LOGROS INMORTALES ⸺
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TROPHIES.map(t => (
              <div
                key={t.id}
                className="p-4 text-center relative overflow-hidden"
                style={{
                  border: `2px solid ${t.unlocked ? t.border : '#2a1810'}`,
                  background: t.unlocked ? t.bg : '#0a0504',
                  boxShadow: t.unlocked ? `3px 3px 0 0 #000, 0 0 10px ${t.border}44` : '2px 2px 0 0 #000',
                  opacity: t.unlocked ? 1 : 0.35,
                  animation: t.unlocked && t.id === 'legend' ? 'ember-pulse 2s ease-in-out infinite' : undefined,
                }}
              >
                <div className="text-[24px] mb-2" style={{ filter: t.unlocked ? 'none' : 'grayscale(1)' }}>
                  {t.icon}
                </div>
                <p className="text-[7px] mb-1" style={{ color: t.unlocked ? t.color : '#3d2817' }}>
                  {t.title}
                </p>
                <p className="text-[6px] leading-relaxed" style={{ color: t.unlocked ? '#5c4a3d' : '#2a1810' }}>
                  {t.desc}
                </p>
                {!t.unlocked && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ background: 'rgba(10,5,4,0.6)' }}
                  >
                    <span className="text-[10px]" style={{ color: '#3d2817' }}>🔒</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
