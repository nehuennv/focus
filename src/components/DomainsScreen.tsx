import { useState } from 'react';
import { useStore, PLAYER_RANKS, BEASTS } from '../store/useStore';
import { SummonModal } from './SummonModal';

interface DomainsScreenProps {
  onBackToMenu: () => void;
}

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function DomainsScreen({ onBackToMenu }: DomainsScreenProps) {
  const { player, domains } = useStore();
  const [isSummoning, setIsSummoning] = useState(false);
  const rank = PLAYER_RANKS[player.rankIndex] ?? PLAYER_RANKS[0];

  return (
    <>
      {isSummoning && <SummonModal onClose={() => setIsSummoning(false)} />}

      <div
        className="min-h-screen p-4 md:p-8"
        style={{
          background: '#0a0504',
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(120,50,20,0.12) 0%, transparent 65%),' +
            'radial-gradient(ellipse at 50% 100%, rgba(60,25,10,0.10) 0%, transparent 60%)',
          fontFamily: '"Press Start 2P", monospace',
          animation: 'fadeup 0.3s ease-out',
        }}
      >
        <div className="w-full max-w-6xl mx-auto">

          {/* ── PAGE HEADER ─────────────────────────────────────────── */}
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
                  GRIMORIOS DE DOMINIO
                </h1>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <div style={{ height: 1, width: 40, background: '#3d2817' }} />
                  <span className="text-[7px]" style={{ color: '#8b7355' }}>
                    {rank.title} · {fmt(player.totalAccumulatedMins)}
                  </span>
                  <div style={{ height: 1, width: 40, background: '#3d2817' }} />
                </div>
              </div>

              {/* Forge button top-right */}
              <button
                onClick={() => setIsSummoning(true)}
                className="btn-pixel text-[8px] px-3 py-2"
                style={{ borderColor: '#92400e', background: '#1c0a00', color: '#fbbf24' }}
              >
                + FORJAR
              </button>
            </div>

            {/* Full-width divider */}
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #3d2817 20%, #3d2817 80%, transparent)' }} />
          </header>

          {/* ── EMPTY STATE ──────────────────────────────────────────── */}
          {domains.length === 0 && (
            <div
              className="p-12 text-center"
              style={{ border: '2px solid #3d2817', background: '#0a0504' }}
            >
              <p className="text-[8px] leading-loose mb-2" style={{ color: '#5c4a3d' }}>
                ···
              </p>
              <p className="text-[8px] leading-loose mb-6" style={{ color: '#8b7355' }}>
                Ningún dominio ha sido sellado aún.<br />
                Acude al altar y forja el primero.
              </p>
              <button
                onClick={() => setIsSummoning(true)}
                className="btn-pixel text-[8px] px-6 py-3"
                style={{ borderColor: '#92400e', background: '#1c0a00', color: '#fbbf24' }}
              >
                ⚔ FORJAR PRIMER DOMINIO
              </button>
            </div>
          )}

          {/* ── DOMAIN CARDS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => {
              const beast = BEASTS[domain.beastId as keyof typeof BEASTS];
              const isDefeated  = domain.currentDebtMins <= 0;
              const isOverdue   = domain.currentDebtMins > domain.weeklyTargetMins;
              const pct         = Math.min(100, (domain.currentDebtMins / Math.max(domain.weeklyTargetMins, 1)) * 100);

              const borderColor = isDefeated ? '#1a2a1a' : isOverdue ? '#5c1a1a' : '#252535';
              const glowStyle   = isOverdue && !isDefeated
                ? { animation: 'blood-throb 2.5s ease-in-out infinite' }
                : {};

              return (
                <div
                  key={domain.id}
                  className="relative overflow-hidden"
                  style={{
                    border: `3px solid ${borderColor}`,
                    background: '#0f0804',
                    boxShadow: '4px 4px 0 0 #000',
                    ...glowStyle,
                  }}
                >
                  {/* Beast background */}
                  {beast?.bgImg && (
                    <div
                      className="absolute inset-0 bg-cover bg-center pointer-events-none"
                      style={{
                        backgroundImage: `url(${beast.bgImg})`,
                        opacity: isDefeated ? 0.04 : 0.12,
                      }}
                    />
                  )}
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(160deg, rgba(15,8,4,0.6) 0%, rgba(15,8,4,0.97) 55%)',
                    }}
                  />

                  <div className="relative z-10 p-4">
                    {/* Beast sprite — top right ghost */}
                    {beast?.spriteImg && (
                      <div className="absolute top-3 right-3" style={{ opacity: isDefeated ? 0.15 : 0.35 }}>
                        <img
                          src={beast.spriteImg}
                          alt={beast.name}
                          style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    {/* Domain name */}
                    <h2
                      className="text-[9px] pr-14 mb-1 leading-relaxed"
                      style={{ color: isDefeated ? '#5c4a3d' : '#fbbf24' }}
                    >
                      {domain.name}
                    </h2>

                    {/* Beast lore */}
                    {beast?.lore && (
                      <p
                        className="text-[6px] italic pr-14 mb-4 leading-relaxed"
                        style={{ color: '#5c4a3d' }}
                      >
                        {beast.lore}
                      </p>
                    )}

                    {/* Divider */}
                    <div style={{ height: 1, background: '#2a1810', marginBottom: 12 }} />

                    {/* Debt label row */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[7px]" style={{ color: '#5c4a3d', letterSpacing: '0.08em' }}>
                        DEUDA SEMANAL
                      </span>
                      <span className="text-[7px]" style={{ color: '#3d2817' }}>
                        /{fmt(domain.weeklyTargetMins)}
                      </span>
                    </div>

                    {/* Debt value */}
                    <div className="mb-3">
                      {isDefeated ? (
                        <p className="text-[9px]" style={{ color: '#166534' }}>— SALDADO —</p>
                      ) : (
                        <>
                          <p className="text-[11px]" style={{ color: isOverdue ? '#dc2626' : '#ef4444' }}>
                            {fmt(domain.currentDebtMins)}
                          </p>
                          {isOverdue && (
                            <p className="text-[6px] mt-1" style={{ color: '#7f1d1d', letterSpacing: '0.05em' }}>
                              ▲ INTERESES POR INACTIVIDAD
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* HP Bar */}
                    <div style={{ height: 7, background: '#1a0a00', border: '1px solid #2a1000', marginBottom: 12 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${isDefeated ? 0 : pct}%`,
                          background: isOverdue ? '#991b1b' : '#b91c1c',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    {/* Status row */}
                    <div className="flex justify-between items-center">
                      <span
                        className="text-[6px] px-2 py-1"
                        style={{
                          border: `1px solid ${isDefeated ? '#14532d' : '#7f1d1d'}`,
                          color: isDefeated ? '#16a34a' : '#ef4444',
                          background: isDefeated ? '#071510' : '#0f0000',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {isDefeated ? '✓ DERROTADO' : '⚔ EN COMBATE'}
                      </span>
                      <span className="text-[6px]" style={{ color: '#3d2817' }}>
                        {fmt(domain.totalAccumulatedMins)} maestría
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ADD DOMAIN CTA ───────────────────────────────────────── */}
          {domains.length > 0 && (
            <div
              onClick={() => setIsSummoning(true)}
              className="mt-4 flex items-center justify-center gap-4 cursor-pointer"
              style={{
                border: '2px dashed #3d2817',
                background: '#0a0504',
                padding: '20px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#92400e')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a28')}
            >
              <span style={{ color: '#3d2817', fontSize: 18 }}>+</span>
              <span className="text-[7px]" style={{ color: '#3d2817', letterSpacing: '0.12em' }}>
                FORJAR NUEVO DOMINIO
              </span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
