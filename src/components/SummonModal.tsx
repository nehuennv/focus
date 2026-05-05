import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, ERAS, getBeastEraRequirement, isBeastUnlocked } from '../store/useStore';

interface SummonModalProps {
  onClose: () => void;
}

export function SummonModal({ onClose }: SummonModalProps) {
  const { createDomain, player, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);
  const [subjectName, setSubjectName] = useState('');
  const [targetHours, setTargetHours] = useState<number | ''>('');
  const [targetMinutes, setTargetMinutes] = useState<number | ''>('');
  const totalMins = (Number(targetHours) || 0) * 60 + (Number(targetMinutes) || 0);
  const isValidTarget = totalMins >= 10;
  const firstUnlocked = BEAST_UNLOCK_ORDER.find(e => isBeastUnlocked(e.beastId, playerEraIndex, debugUnlockAll))?.beastId ?? 'maro';
  const [selectedBeastId, setSelectedBeastId] = useState<string>(firstUnlocked);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !isValidTarget || !selectedBeastId) return;
    createDomain(subjectName, totalMins, selectedBeastId);
    onClose();
  };

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(10,5,4,0.92)',
        backdropFilter: 'blur(2px)',
        fontFamily: '"Press Start 2P", monospace',
        animation: 'fadeup 0.2s ease-out',
      }}
    >
      {/* Modal container */}
      <div
        className="w-full max-w-lg overflow-y-auto"
        style={{
          border: '3px solid #92400e',
          background: '#0a0504',
          boxShadow: '6px 6px 0 0 #000, 0 0 40px rgba(146,64,14,0.2)',
          maxHeight: '90vh',
        }}
      >
        {/* ── HEADER ── */}
        <div
          className="p-5 text-center sticky top-0 z-10"
          style={{
            background: '#0a0504',
            borderBottom: '2px solid #2a1810',
          }}
        >
          {/* Selected beast bg ghost */}
          {selectedBeast?.bgImg && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${selectedBeast.bgImg})`, opacity: 0.06 }}
            />
          )}
          <div className="relative z-10">
            <p className="text-[7px] mb-2 tracking-[0.25em]" style={{ color: '#8b7355' }}>
              ⸺ ALTAR DE INVOCACIÓN ⸺
            </p>
            <h2
              className="text-[10px] tracking-widest"
              style={{ color: '#fbbf24', textShadow: '2px 2px 0 #000' }}
            >
              SELLAR UN DOMINIO
            </h2>
          </div>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="p-6">

          {/* Subject name */}
          <div className="mb-5">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>
              NOMBRE DE LA MATERIA
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="ej. Análisis Matemático II"
              required
              className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
              style={{
                border: '2px solid #3d2817',
                background: '#0a0504',
                fontFamily: '"Press Start 2P", monospace',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#92400e')}
              onBlur={e => (e.target.style.borderColor = '#3d2817')}
            />
          </div>

          {/* Weekly target */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>
              META SEMANAL
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[6px] mb-2 tracking-widest" style={{ color: '#5c4a3d' }}>
                  HORAS
                </label>
                <input
                  type="number"
                  value={targetHours}
                  onChange={e => setTargetHours(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
                  style={{
                    border: '2px solid #3d2817',
                    background: '#0a0504',
                    fontFamily: '"Press Start 2P", monospace',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#3d2817')}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[6px] mb-2 tracking-widest" style={{ color: '#5c4a3d' }}>
                  MINUTOS
                </label>
                <input
                  type="number"
                  value={targetMinutes}
                  onChange={e => setTargetMinutes(e.target.value === '' ? '' : Math.min(59, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  min="0"
                  max="59"
                  className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
                  style={{
                    border: '2px solid #3d2817',
                    background: '#0a0504',
                    fontFamily: '"Press Start 2P", monospace',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#3d2817')}
                />
              </div>
            </div>
            {/* Preview + validation */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[6px]" style={{ color: totalMins > 0 ? '#8b7355' : '#3d2817' }}>
                {totalMins > 0
                  ? `= ${totalMins} min total${totalMins >= 60 ? ` (${Math.floor(totalMins/60)}h ${totalMins%60 > 0 ? `${totalMins%60}m` : ''})` : ''}`
                  : 'Ingresá horas y/o minutos'}
              </p>
              {totalMins > 0 && !isValidTarget && (
                <p className="text-[6px]" style={{ color: '#ef4444' }}>mínimo 10 min</p>
              )}
            </div>
          </div>

          {/* Beast selection */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>
              GUARDIÁN DEL DOMINIO
            </label>

            {/* Selected beast preview */}
            <div
              className="mb-4 p-4 relative overflow-hidden"
              style={{
                border: '2px solid #92400e',
                background: '#0f0804',
              }}
            >
              {selectedBeast?.bgImg && (
                <div
                  className="absolute inset-0 bg-cover bg-center pointer-events-none"
                  style={{ backgroundImage: `url(${selectedBeast.bgImg})`, opacity: 0.15 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-4">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    border: '2px solid #3a1a00',
                    background: '#0a0504',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={selectedBeast?.spriteImg}
                    alt={selectedBeast?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </div>
                <div>
                  <p className="text-[9px] mb-1" style={{ color: '#fbbf24' }}>
                    {selectedBeast?.name}
                  </p>
                  <p className="text-[6px] italic leading-relaxed" style={{ color: '#5c4a3d' }}>
                    {selectedBeast?.lore}
                  </p>
                </div>
              </div>
            </div>

            {/* Beast grid */}
            <div
              className="grid grid-cols-4 gap-2 p-3 overflow-y-auto"
              style={{
                border: '2px solid #3d2817',
                background: '#0a0504',
                maxHeight: 220,
              }}
            >
              {BEAST_UNLOCK_ORDER.map(({ beastId }) => {
                const beast = BEASTS[beastId];
                const isSelected = selectedBeastId === beast.id;
                const unlocked = isBeastUnlocked(beast.id, playerEraIndex, debugUnlockAll);
                const reqEra = ERAS[getBeastEraRequirement(beast.id)];
                return (
                  <button
                    key={beast.id}
                    type="button"
                    onClick={() => unlocked && setSelectedBeastId(beast.id)}
                    title={unlocked ? beast.name : `Era ${['I','II','III','IV','V','VI','VII','VIII','IX','X'][getBeastEraRequirement(beast.id)]} — ${reqEra.name}`}
                    className="flex flex-col items-center p-2"
                    style={{
                      border: `2px solid ${isSelected ? '#92400e' : (unlocked ? '#3d2817' : '#1a1a1a')}`,
                      background: isSelected ? '#1c0800' : (unlocked ? '#0f0804' : '#080808'),
                      boxShadow: isSelected ? '0 0 8px rgba(146,64,14,0.3)' : 'none',
                      transition: 'border-color 0.1s, background 0.1s',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      position: 'relative',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div
                      style={{
                        width: 36, height: 36,
                        border: `1px solid ${isSelected ? '#92400e' : (unlocked ? '#3d2817' : '#1a1a1a')}`,
                        background: '#0a0504',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', marginBottom: 4, position: 'relative',
                      }}
                    >
                      <img
                        src={beast.spriteImg}
                        alt={unlocked ? beast.name : '???'}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'contain', imageRendering: 'pixelated',
                          filter: unlocked ? 'none' : 'brightness(0)',
                        }}
                      />
                      {!unlocked && (
                        <span style={{ position: 'absolute', fontSize: '12px' }}>🔒</span>
                      )}
                    </div>
                    <span className="text-[5px]" style={{ color: isSelected ? '#fbbf24' : (unlocked ? '#8b7355' : '#3a3a3a') }}>
                      {unlocked ? beast.name : reqEra.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-pixel text-[8px] py-3"
              style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={!isValidTarget || !subjectName}
              className="flex-1 btn-pixel text-[8px] py-3"
              style={{
                borderColor: isValidTarget && subjectName ? '#92400e' : '#3d2817',
                background: isValidTarget && subjectName ? '#1c0800' : '#0a0504',
                color: isValidTarget && subjectName ? '#fbbf24' : '#3d2817',
                cursor: isValidTarget && subjectName ? 'pointer' : 'not-allowed',
              }}
            >
              ⚔ SELLAR DOMINIO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
