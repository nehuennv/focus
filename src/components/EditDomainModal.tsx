import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, ERAS, getBeastEraRequirement, isBeastUnlocked } from '../store/useStore';
import type { Domain } from '../store/useStore';

interface EditDomainModalProps {
  domain: Domain;
  onClose: () => void;
}

const DAYS_OPTIONS = [
  { value: 1, label: '1d' },
  { value: 2, label: '2d' },
  { value: 3, label: '3d' },
  { value: 4, label: '4d' },
  { value: 5, label: 'L–V' },
  { value: 6, label: 'L–S' },
  { value: 7, label: 'TODO' },
];

const S: React.CSSProperties = { fontFamily: '"Press Start 2P", monospace' };

export function EditDomainModal({ domain, onClose }: EditDomainModalProps) {
  const { updateDomain, player, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const initH = Math.floor(domain.dailyTargetHours);
  const initM = Math.round((domain.dailyTargetHours - initH) * 60);

  const [name, setName] = useState(domain.name);
  const [dailyHours, setDailyHours] = useState<number | ''>(initH || '');
  const [dailyMins, setDailyMins] = useState<number | ''>(initM || '');
  const [activeDays, setActiveDays] = useState(domain.activeDaysPerWeek);
  const [selectedBeastId, setSelectedBeastId] = useState(domain.beastId);

  const dailyTargetHours = (Number(dailyHours) || 0) + (Number(dailyMins) || 0) / 60;
  const weeklyMins = Math.round(dailyTargetHours * 60) * activeDays;
  const isValidTarget = dailyTargetHours >= (10 / 60);
  const canSubmit = name.trim().length > 0 && isValidTarget && selectedBeastId;

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];

  const fmtH = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    updateDomain(domain.id, {
      name: name.trim(),
      dailyTargetHours,
      activeDaysPerWeek: activeDays,
      beastId: selectedBeastId,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,2,1,0.94)', backdropFilter: 'blur(3px)', ...S, animation: 'fadein 0.18s ease-out' }}
    >
      <div style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', border: '2px solid #92400e', background: '#0a0504', boxShadow: '6px 6px 0 #000, 0 0 40px rgba(146,64,14,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a0e08', position: 'sticky', top: 0, background: '#0a0504', zIndex: 10 }}>
          {selectedBeast?.bgImg && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.05, pointerEvents: 'none' }} />
          )}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 6, color: '#4a3828', letterSpacing: '0.25em', marginBottom: 6 }}>⸺ ALTAR ⸺</div>
            <h2 style={{ fontSize: 11, color: '#fbbf24', letterSpacing: '0.12em', textShadow: '2px 2px 0 #000' }}>EDITAR DOMINIO</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 8 }}>NOMBRE</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              style={{ width: '100%', padding: '11px 14px', fontSize: 8, background: '#0f0804', border: '2px solid #2a1810', color: '#f0d0a0', outline: 'none', boxSizing: 'border-box', ...S, transition: 'border-color 0.12s' }}
              onFocus={e => (e.target.style.borderColor = '#92400e')}
              onBlur={e => (e.target.style.borderColor = '#2a1810')}
            />
          </div>

          {/* Daily target */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 10 }}>META DIARIA</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 6, color: '#3d2817', letterSpacing: '0.12em', marginBottom: 6 }}>HORAS</div>
                <input type="number" value={dailyHours} placeholder="0" min="0" max="12"
                  onChange={e => setDailyHours(e.target.value === '' ? '' : Math.max(0, Math.min(12, Number(e.target.value))))}
                  style={{ width: '100%', padding: '11px 14px', fontSize: 12, background: '#0f0804', border: '2px solid #2a1810', color: '#f0d0a0', outline: 'none', boxSizing: 'border-box', ...S, transition: 'border-color 0.12s' }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#2a1810')}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 6, color: '#3d2817', letterSpacing: '0.12em', marginBottom: 6 }}>MINUTOS</div>
                <input type="number" value={dailyMins} placeholder="0" min="0" max="59"
                  onChange={e => setDailyMins(e.target.value === '' ? '' : Math.min(59, Math.max(0, Number(e.target.value))))}
                  style={{ width: '100%', padding: '11px 14px', fontSize: 12, background: '#0f0804', border: '2px solid #2a1810', color: '#f0d0a0', outline: 'none', boxSizing: 'border-box', ...S, transition: 'border-color 0.12s' }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#2a1810')}
                />
              </div>
            </div>

            <div style={{ fontSize: 6, color: '#3d2817', letterSpacing: '0.12em', marginBottom: 8 }}>DÍAS / SEMANA</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS_OPTIONS.map(opt => {
                const sel = activeDays === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setActiveDays(opt.value)}
                    style={{ padding: '7px 12px', fontSize: 7, border: `2px solid ${sel ? '#92400e' : '#2a1810'}`, background: sel ? '#1c0800' : '#0f0804', color: sel ? '#fbbf24' : '#6b5040', cursor: 'pointer', ...S }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {dailyTargetHours > 0 && (
              <div style={{ marginTop: 10, fontSize: 7, color: '#4a3828' }}>
                {fmtH(dailyTargetHours)}/día × {activeDays}d = {Math.round(weeklyMins / 60 * 10) / 10}h/sem
                {!isValidTarget && <span style={{ color: '#ef4444', marginLeft: 10 }}>mín. 10m/día</span>}
              </div>
            )}
          </div>

          {/* Beast */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 7, color: '#6b5040', letterSpacing: '0.18em', marginBottom: 10 }}>GUARDIÁN</label>
            <div style={{ position: 'relative', overflow: 'hidden', padding: '12px 14px', border: '2px solid #3d2817', background: '#0f0804', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              {selectedBeast?.bgImg && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${selectedBeast.bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1, pointerEvents: 'none' }} />
              )}
              <div style={{ position: 'relative', flexShrink: 0, width: 52, height: 52, border: '2px solid #2a1810', background: '#070404', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={selectedBeast?.spriteImg} alt={selectedBeast?.name} style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <p style={{ fontSize: 10, color: '#fbbf24', marginBottom: 4 }}>{selectedBeast?.name}</p>
                <p style={{ fontSize: 6, color: '#4a3828', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedBeast?.lore?.slice(0, 100)}...</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '10px', border: '2px solid #1a0e08', background: '#070404', maxHeight: 200, overflowY: 'auto' }}>
              {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
                const beast = BEASTS[beastId];
                const sel = selectedBeastId === beast.id;
                const unlocked = isBeastUnlocked(beast.id, playerEraIndex, debugUnlockAll);
                const reqEra = ERAS[getBeastEraRequirement(beast.id)];
                return (
                  <button key={beast.id} type="button"
                    onClick={() => unlocked && setSelectedBeastId(beast.id)}
                    title={unlocked ? beast.name : `Era ${['I','II','III','IV','V','VI','VII','VIII','IX','X'][getBeastEraRequirement(beast.id)]} — ${reqEra.name}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', border: `2px solid ${sel ? '#92400e' : unlocked ? '#2a1810' : '#120808'}`, background: sel ? '#1c0800' : unlocked ? '#0f0804' : '#080504', cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.45, boxShadow: sel ? '0 0 8px rgba(146,64,14,0.35)' : 'none' }}>
                    <div style={{ width: 34, height: 34, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <img src={beast.spriteImg} alt={unlocked ? beast.name : '???'} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0)' }} />
                      {!unlocked && <span style={{ position: 'absolute', fontSize: 11 }}>🔒</span>}
                    </div>
                    <span style={{ fontSize: 5, color: sel ? '#fbbf24' : unlocked ? '#6b5040' : '#2a1810', textAlign: 'center' }}>
                      {unlocked ? beast.name : reqEra.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px 0', border: '2px solid #2a1810', background: '#0f0804', color: '#6b5040', fontSize: 8, cursor: 'pointer', boxShadow: '3px 3px 0 #000', ...S }}>
              CANCELAR
            </button>
            <button type="submit" disabled={!canSubmit}
              style={{ flex: 2, padding: '11px 0', border: `2px solid ${canSubmit ? '#92400e' : '#1a0e08'}`, background: canSubmit ? '#1c0800' : '#0a0504', color: canSubmit ? '#fbbf24' : '#2a1810', fontSize: 8, cursor: canSubmit ? 'pointer' : 'not-allowed', boxShadow: canSubmit ? '3px 3px 0 #000' : 'none', letterSpacing: '0.06em', ...S }}>
              ✓ GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes fadein { from{opacity:0} to{opacity:1} }`}</style>
    </div>
  );
}
