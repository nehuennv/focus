import { useStore, BEASTS } from '../store/useStore';

interface BestiaryScreenProps {
  onBackToMenu: () => void;
}

export function BestiaryScreen({ onBackToMenu }: BestiaryScreenProps) {
  const { bestiary } = useStore();

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: '#0a0504',
        backgroundImage:
          'radial-gradient(ellipse at 30% 20%, rgba(80,30,10,0.15) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 70% 80%, rgba(60,25,10,0.10) 0%, transparent 55%)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadeup 0.3s ease-out',
      }}
    >
      <div className="w-full max-w-5xl mx-auto">

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToMenu}
              className="btn-pixel text-[12px] px-4 py-3"
              style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
            >
              ← VOLVER
            </button>

            <div className="text-center">
              <h1 className="text-[18px] md:text-[22px] tracking-widest drop-shadow-[2px_2px_0_#000]"
                style={{ color: '#dc2626' }}>
                CODEX BESTIARUM
              </h1>
              <div className="mt-2 flex items-center justify-center gap-3">
                <div style={{ height: 2, width: 50, background: '#2a1a1a' }} />
                <span className="text-[11px]" style={{ color: '#52525b' }}>
                  {bestiary.filter(b => b.defeats > 0).length} / {bestiary.length} bestias registradas
                </span>
                <div style={{ height: 2, width: 50, background: '#2a1a1a' }} />
              </div>
            </div>

            <div style={{ width: 80 }} />
          </div>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a1a1a 20%, #2a1a1a 80%, transparent)' }} />
        </header>

        {/* ── BEAST GRID ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bestiary.map((entry) => {
            const beast = BEASTS[entry.beastId as keyof typeof BEASTS];
            if (!beast) return null;

            const isDefeated = entry.defeats > 0;
            const isLegend   = entry.defeats >= 5;

            return (
              <div
                key={entry.beastId}
                className="relative overflow-hidden"
                style={{
                  border: `3px solid ${isLegend ? '#92400e' : isDefeated ? '#3a1a1a' : '#3d2817'}`,
                  background: '#0f0804',
                  boxShadow: isLegend
                    ? '4px 4px 0 0 #000, 0 0 16px rgba(146,64,14,0.25)'
                    : '4px 4px 0 0 #000',
                }}
              >
                {/* Beast background fill */}
                <div
                  className="absolute inset-0 bg-cover bg-center pointer-events-none"
                  style={{
                    backgroundImage: `url(${beast.bgImg})`,
                    opacity: isDefeated ? 0.18 : 0.06,
                    filter: isDefeated ? 'none' : 'grayscale(100%)',
                  }}
                />
                {/* Dark overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,8,4,0.5) 0%, rgba(15,8,4,0.92) 50%)',
                  }}
                />

                {/* Sealed overlay for undefeated */}
                {!isDefeated && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ zIndex: 8 }}
                  >
                    <span
                      className="text-[11px] tracking-widest"
                      style={{
                        color: '#3d2817',
                        letterSpacing: '0.3em',
                        animation: 'seal-breathe 3s ease-in-out infinite',
                      }}
                    >
                      SIN REGISTROS
                    </span>
                  </div>
                )}

                <div className="relative z-10 p-5">
                  {/* Header: sprite + name + lore */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Sprite box */}
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        flexShrink: 0,
                        border: `2px solid ${isDefeated ? '#3a1a1a' : '#3d2817'}`,
                        background: '#0a0504',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={beast.spriteImg}
                        alt={beast.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                          opacity: isDefeated ? 1 : 0.25,
                          filter: isDefeated ? 'none' : 'grayscale(80%)',
                        }}
                      />
                    </div>

                    {/* Name + lore */}
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-[10px] mb-2 drop-shadow-[2px_2px_0_#000]"
                        style={{ color: isDefeated ? '#fbbf24' : '#3a3a52' }}
                      >
                        {beast.name}
                      </h2>
                      <p
                        className="text-[7px] italic leading-relaxed"
                        style={{ color: isDefeated ? '#5c4a3d' : '#3d2817' }}
                      >
                        {beast.lore}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#2a1810', marginBottom: 14 }} />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="text-center p-3"
                      style={{
                        border: `1px solid ${isDefeated ? '#3a1a1a' : '#2a1810'}`,
                        background: '#0a0504',
                      }}
                    >
                      <p className="text-[6px] mb-2 tracking-widest" style={{ color: '#3a3a52' }}>
                        VICTORIAS
                      </p>
                      <p
                        className="text-[20px] drop-shadow-[2px_2px_0_#000]"
                        style={{ color: isDefeated ? '#fbbf24' : '#252535' }}
                      >
                        {entry.defeats}
                      </p>
                    </div>
                    <div
                      className="text-center p-3"
                      style={{
                        border: `1px solid ${isDefeated ? '#1a0a0a' : '#2a1810'}`,
                        background: '#0a0504',
                      }}
                    >
                      <p className="text-[6px] mb-2 tracking-widest" style={{ color: '#3a3a52' }}>
                        MINUTOS
                      </p>
                      <p
                        className="text-[20px] drop-shadow-[2px_2px_0_#000]"
                        style={{ color: isDefeated ? '#dc2626' : '#252535' }}
                      >
                        {entry.totalMinsDefeated}
                      </p>
                    </div>
                  </div>

                  {/* Legend badge */}
                  {isLegend && (
                    <div
                      className="mt-3 p-2 text-center text-[7px]"
                      style={{
                        border: '1px solid #92400e',
                        background: '#1c0800',
                        color: '#fbbf24',
                        letterSpacing: '0.1em',
                        animation: 'ember-pulse 2s ease-in-out infinite',
                      }}
                    >
                      ★ NEMESIS LEGENDARIA · {entry.defeats} VICTORIAS
                    </div>
                  )}

                  {isDefeated && !isLegend && (
                    <div
                      className="mt-3 p-2 text-center text-[6px]"
                      style={{
                        border: '1px solid #3a1a1a',
                        background: '#0a0000',
                        color: '#dc2626',
                        letterSpacing: '0.08em',
                      }}
                    >
                      ⚔ {entry.defeats} {entry.defeats === 1 ? 'VICTORIA REGISTRADA' : 'VICTORIAS REGISTRADAS'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
