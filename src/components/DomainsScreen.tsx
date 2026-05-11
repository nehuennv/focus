import { useState } from 'react';
import { useStore, BEASTS, getRankDisplay, getWeekMins, getTodayMins } from '../store/useStore';
import { SummonModal } from './SummonModal';

interface DomainsScreenProps {
  onBackToMenu: () => void;
}

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
};

export function DomainsScreen({ onBackToMenu }: DomainsScreenProps) {
  const { player, domains, ritualSessions } = useStore();
  const [isSummoning, setIsSummoning] = useState(false);
  const rd = getRankDisplay(player.rankIndex);

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

          {/* Header */}
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
                <h1 className="text-[18px] md:text-[22px] text-amber-400 tracking-widest drop-shadow-[2px_2px_0_#000]">
                  GRIMORIOS DE DOMINIO
                </h1>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <div style={{ height: 2, width: 50, background: '#3d2817' }} />
                  <span className="text-[11px]" style={{ color: '#8b7355' }}>{rd.era.icon} {rd.fullTitle.toUpperCase()}</span>
                  <div style={{ height: 2, width: 50, background: '#3d2817' }} />
                </div>
              </div>
              <button
                onClick={() => setIsSummoning(true)}
                className="btn-pixel text-[12px] px-4 py-3"
                style={{ borderColor: '#92400e', background: '#1c0a00', color: '#fbbf24' }}
              >
                + FORJAR
              </button>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #3d2817 20%, #3d2817 80%, transparent)' }} />
          </header>

          {/* Empty state */}
          {domains.length === 0 && (
            <div className="p-12 text-center" style={{ border: '2px solid #3d2817', background: '#0a0504' }}>
              <p className="text-[12px] leading-loose mb-6" style={{ color: '#8b7355' }}>
                Ningún dominio ha sido sellado aún.<br />Acude al altar y forja el primero.
              </p>
              <button onClick={() => setIsSummoning(true)} className="btn-pixel text-[12px] px-8 py-4" style={{ borderColor: '#92400e', background: '#1c0a00', color: '#fbbf24' }}>
                ⚔ FORJAR PRIMER DOMINIO
              </button>
            </div>
          )}

          {/* Domain cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => {
              const beast = BEASTS[domain.beastId as keyof typeof BEASTS];

              const thisWeekMins = getWeekMins(domain.id, ritualSessions, 0);
              const lastWeekMins = getWeekMins(domain.id, ritualSessions, 1);
              const todayMinutes = getTodayMins(domain.id, ritualSessions);
              const weeklyTargetMins = Math.round(domain.dailyTargetHours * 60) * domain.activeDaysPerWeek;
              const weekPct = weeklyTargetMins > 0 ? Math.min(100, (thisWeekMins / weeklyTargetMins) * 100) : 0;
              const todayTargetMins = Math.round(domain.dailyTargetHours * 60);
              const todayPct = todayTargetMins > 0 ? Math.min(100, (todayMinutes / todayTargetMins) * 100) : 0;

              return (
                <div
                  key={domain.id}
                  className="relative overflow-hidden"
                  style={{
                    border: '3px solid #252535',
                    background: '#0f0804',
                    boxShadow: '4px 4px 0 0 #000',
                  }}
                >
                  {beast?.bgImg && (
                    <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${beast.bgImg})`, opacity: 0.10 }} />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(15,8,4,0.6) 0%, rgba(15,8,4,0.97) 55%)' }} />

                  <div className="relative z-10 p-4">
                    {/* Beast sprite ghost */}
                    {beast?.spriteImg && (
                      <div className="absolute top-3 right-3" style={{ opacity: 0.35 }}>
                        <img src={beast.spriteImg} alt={beast.name} style={{ width: 44, height: 44, imageRendering: 'pixelated', objectFit: 'contain' }} />
                      </div>
                    )}

                    {/* Domain name */}
                    <h2 className="text-[14px] pr-14 mb-1 leading-relaxed" style={{ color: '#fbbf24' }}>
                      {domain.name}
                    </h2>

                    {/* Beast + objective */}
                    <p className="text-[7px] pr-14 mb-4" style={{ color: '#5c4a3d' }}>
                      {beast?.name} · {domain.dailyTargetHours > 0 ? `${domain.dailyTargetHours}h/día · ${domain.activeDaysPerWeek}d/sem` : 'sin objetivo'}
                    </p>

                    <div style={{ height: 1, background: '#2a1810', marginBottom: 10 }} />

                    {/* Today */}
                    {todayTargetMins > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.1em' }}>HOY</span>
                          <span style={{ fontSize: 7, color: todayPct >= 100 ? '#4ade80' : '#5c4a3d' }}>
                            {fmtMins(todayMinutes)} / {fmtMins(todayTargetMins)}
                            {todayPct >= 100 && ' ✓'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: '#1a0a00', border: '2px solid #2a1000', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${todayPct}%`, background: todayPct >= 100 ? '#16a34a' : '#b91c1c', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* This week */}
                    {weeklyTargetMins > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.1em' }}>ESTA SEMANA</span>
                          <span style={{ fontSize: 7, color: weekPct >= 100 ? '#4ade80' : '#5c4a3d' }}>
                            {fmtMins(thisWeekMins)} / {fmtMins(weeklyTargetMins)}
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#1a0a00', border: '2px solid #2a1000', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${weekPct}%`, background: weekPct >= 100 ? '#14532d' : '#7f1d1d', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* Last week reference */}
                    {weeklyTargetMins > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="flex justify-between items-center">
                          <span style={{ fontSize: 6, color: '#3d2817', letterSpacing: '0.08em' }}>SEM. PASADA</span>
                          <span style={{ fontSize: 6, color: '#3d2817' }}>{fmtMins(lastWeekMins)}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ height: 1, background: '#2a1810', marginBottom: 10 }} />

                    {/* Status row */}
                    <div className="flex justify-between items-center">
                      <span className="text-[8px]" style={{ color: '#5c4a3d' }}>
                        {beast?.name?.toUpperCase()}
                      </span>
                      <span className="text-[8px]" style={{ color: '#3d2817' }}>
                        {fmtMins(domain.totalAccumulatedMins)} total
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add domain CTA */}
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
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#3d2817')}
            >
              <span style={{ color: '#3d2817', fontSize: 24 }}>+</span>
              <span className="text-[11px]" style={{ color: '#3d2817', letterSpacing: '0.12em' }}>FORJAR NUEVO DOMINIO</span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
