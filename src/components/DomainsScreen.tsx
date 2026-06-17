import { useState } from 'react';
import { useStore, BEASTS, getRankDisplay, getWeekMins, getTodayMins } from '../store/useStore';
import type { Domain } from '../store/useStore';
import { SummonModal } from './SummonModal';
import { EditDomainModal } from './EditDomainModal';

interface DomainsScreenProps {
  onBackToMenu: () => void;
}

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
};

export function DomainsScreen({ onBackToMenu }: DomainsScreenProps) {
  const { player, domains, ritualSessions, deleteDomain } = useStore();
  const [isSummoning, setIsSummoning] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const rd = getRankDisplay(player.rankIndex);

  const handleDelete = (domain: Domain) => {
    if (window.confirm(`¿Eliminar "${domain.name}"? El historial de sesiones se conserva pero el dominio desaparece.`)) {
      deleteDomain(domain.id);
    }
  };

  return (
    <>
      {isSummoning && <SummonModal onClose={() => setIsSummoning(false)} />}
      {editingDomain && <EditDomainModal domain={editingDomain} onClose={() => setEditingDomain(null)} />}

      <div
        style={{
          minHeight: '100vh',
          background: '#070404',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(100,40,15,0.1) 0%, transparent 55%)',
          fontFamily: '"Press Start 2P", monospace',
          animation: 'fadein 0.25s ease-out',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>

          {/* Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <button
              onClick={onBackToMenu}
              style={{ padding: '10px 16px', border: '2px solid #2a1810', background: '#0f0804', color: '#6b5040', fontSize: 9, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}
            >
              ← VOLVER
            </button>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 'clamp(14px,3vw,20px)', color: '#fbbf24', letterSpacing: '0.12em', textShadow: '3px 3px 0 #000', marginBottom: 6 }}>
                GRIMORIOS
              </h1>
              <div style={{ fontSize: 7, color: '#4a3828', letterSpacing: '0.2em' }}>
                {rd.era.icon} {rd.fullTitle.toUpperCase()}
              </div>
            </div>

            <button
              onClick={() => setIsSummoning(true)}
              style={{ padding: '10px 16px', border: '2px solid #92400e', background: '#160802', color: '#fbbf24', fontSize: 9, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}
            >
              + FORJAR
            </button>
          </header>

          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #2a1810 20%, #2a1810 80%, transparent)', marginBottom: 24 }} />

          {/* Empty state */}
          {domains.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px solid #1a0e08', background: '#0a0504' }}>
              <p style={{ fontSize: 10, color: '#4a3828', lineHeight: 2, marginBottom: 20 }}>
                Ningún dominio sellado aún.<br />Forja el primero para comenzar.
              </p>
              <button onClick={() => setIsSummoning(true)}
                style={{ padding: '12px 24px', border: '2px solid #92400e', background: '#160802', color: '#fbbf24', fontSize: 9, fontFamily: '"Press Start 2P", monospace', cursor: 'pointer', boxShadow: '3px 3px 0 #000' }}>
                ⚔ FORJAR DOMINIO
              </button>
            </div>
          )}

          {/* Domain cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {domains.map((domain) => {
              const beast = BEASTS[domain.beastId as keyof typeof BEASTS];
              const thisWeekMins = getWeekMins(domain.id, ritualSessions, 0);
              const lastWeekMins = getWeekMins(domain.id, ritualSessions, 1);
              const todayMins = getTodayMins(domain.id, ritualSessions);
              const todayTargetMins = Math.round(domain.dailyTargetHours * 60);
              const weeklyTargetMins = todayTargetMins * domain.activeDaysPerWeek;
              const todayPct = todayTargetMins > 0 ? Math.min(100, (todayMins / todayTargetMins) * 100) : 0;
              const weekPct = weeklyTargetMins > 0 ? Math.min(100, (thisWeekMins / weeklyTargetMins) * 100) : 0;
              const todayDone = todayPct >= 100;
              const weekDone = weekPct >= 100;

              return (
                <div
                  key={domain.id}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid #2a1810',
                    background: '#0c0604',
                    boxShadow: '4px 4px 0 #000',
                  }}
                >
                  {beast?.bgImg && (
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${beast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07, pointerEvents: 'none' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(12,6,4,0.5) 0%, rgba(12,6,4,0.95) 50%)', pointerEvents: 'none' }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 16px 12px' }}>
                      <div style={{ flexShrink: 0, width: 48, height: 48, border: '2px solid #2a1810', background: '#070404', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        {domain.avatar || '📚'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: 11, color: '#f0d0a0', marginBottom: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {domain.name}
                        </h2>
                        <p style={{ fontSize: 8, color: '#6b5040', letterSpacing: '0.1em' }}>
                          {beast?.name} · {domain.dailyTargetHours > 0 ? `${domain.dailyTargetHours}h/día · ${domain.activeDaysPerWeek}d/sem` : 'sin objetivo'}
                        </p>
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#1a0e08', margin: '0 16px' }} />

                    <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {todayTargetMins > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 7, color: todayDone ? '#4ade80' : '#6b5040', letterSpacing: '0.1em' }}>
                              {todayDone ? '✓ HOY' : 'HOY'}
                            </span>
                            <span style={{ fontSize: 7, color: todayDone ? '#4ade80' : '#8b7355' }}>
                              {fmtMins(todayMins)} / {fmtMins(todayTargetMins)}
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#0a0402', border: '1px solid #1a0e08', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${todayPct}%`, background: todayDone ? '#16a34a' : '#b91c1c', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      )}

                      {weeklyTargetMins > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 7, color: weekDone ? '#4ade80' : '#6b5040', letterSpacing: '0.1em' }}>
                              {weekDone ? '✓ SEMANA' : 'SEMANA'}
                            </span>
                            <span style={{ fontSize: 7, color: weekDone ? '#4ade80' : '#8b7355' }}>
                              {fmtMins(thisWeekMins)} / {fmtMins(weeklyTargetMins)}
                            </span>
                          </div>
                          <div style={{ height: 6, background: '#0a0402', border: '1px solid #1a0e08', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${weekPct}%`, background: weekDone ? '#14532d' : '#7f1d1d', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
                        <span style={{ fontSize: 7, color: '#6b5040' }}>
                          {lastWeekMins > 0 ? `sem. ant: ${fmtMins(lastWeekMins)}` : ''}
                        </span>
                        <span style={{ fontSize: 7, color: '#6b5040' }}>
                          {fmtMins(domain.totalAccumulatedMins)} total
                        </span>
                      </div>

                      {/* CRUD actions */}
                      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid #1a0e08', marginTop: 4 }}>
                        <button
                          onClick={() => setEditingDomain(domain)}
                          style={{ flex: 1, padding: '7px 0', fontSize: 7, border: '2px solid #2a1810', background: '#0f0804', color: '#8b7355', cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.06em' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#92400e'; e.currentTarget.style.color = '#fbbf24'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1810'; e.currentTarget.style.color = '#8b7355'; }}
                        >
                          ✎ EDITAR
                        </button>
                        <button
                          onClick={() => handleDelete(domain)}
                          style={{ flex: 1, padding: '7px 0', fontSize: 7, border: '2px solid #2a1810', background: '#0f0804', color: '#5a2020', cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.06em' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7f1d1d'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1810'; e.currentTarget.style.color = '#5a2020'; }}
                        >
                          ✕ BORRAR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {domains.length > 0 && (
            <button
              onClick={() => setIsSummoning(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                width: '100%', marginTop: 16, padding: '18px',
                border: '2px dashed #2a1810', background: 'transparent',
                color: '#6b5040', fontSize: 9, fontFamily: '"Press Start 2P", monospace',
                cursor: 'pointer', letterSpacing: '0.1em',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#92400e'; e.currentTarget.style.color = '#fbbf24'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1810'; e.currentTarget.style.color = '#6b5040'; }}
            >
              + FORJAR NUEVO DOMINIO
            </button>
          )}

        </div>
      </div>

      <style>{`@keyframes fadein { from{opacity:0} to{opacity:1} }`}</style>
    </>
  );
}
