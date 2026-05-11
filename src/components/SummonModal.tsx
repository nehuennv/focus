import { useState } from 'react';
import { useStore, BEASTS, BEAST_UNLOCK_ORDER, ERAS, getBeastEraRequirement, isBeastUnlocked } from '../store/useStore';

interface SummonModalProps {
  onClose: () => void;
}

const DAYS_OPTIONS = [
  { value: 1, label: '1 día' },
  { value: 2, label: '2 días' },
  { value: 3, label: '3 días' },
  { value: 4, label: '4 días' },
  { value: 5, label: 'Lun–Vie' },
  { value: 6, label: 'Lun–Sáb' },
  { value: 7, label: 'Todos' },
];

export function SummonModal({ onClose }: SummonModalProps) {
  const { createDomain, player, debugUnlockAll } = useStore();
  const playerEraIndex = Math.floor(player.rankIndex / 10);

  const [subjectName, setSubjectName] = useState('');
  const [dailyHours, setDailyHours] = useState<number | ''>('');
  const [dailyMins, setDailyMins] = useState<number | ''>('');
  const [activeDays, setActiveDays] = useState(5);

  const firstUnlocked = BEAST_UNLOCK_ORDER.find(e => isBeastUnlocked(e.beastId, playerEraIndex, debugUnlockAll))?.beastId ?? 'maro';
  const [selectedBeastId, setSelectedBeastId] = useState<string>(firstUnlocked);

  const dailyTargetHours = (Number(dailyHours) || 0) + (Number(dailyMins) || 0) / 60;
  const weeklyMins = Math.round(dailyTargetHours * 60) * activeDays;
  const isValidTarget = dailyTargetHours >= (10 / 60); // min 10 min/day

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !isValidTarget || !selectedBeastId) return;
    createDomain(subjectName, dailyTargetHours, activeDays, selectedBeastId);
    onClose();
  };

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];

  const fmtHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

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
      <div
        className="w-full max-w-lg overflow-y-auto"
        style={{
          border: '3px solid #92400e',
          background: '#0a0504',
          boxShadow: '6px 6px 0 0 #000, 0 0 40px rgba(146,64,14,0.2)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="p-5 text-center sticky top-0 z-10" style={{ background: '#0a0504', borderBottom: '2px solid #2a1810' }}>
          {selectedBeast?.bgImg && (
            <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${selectedBeast.bgImg})`, opacity: 0.06 }} />
          )}
          <div className="relative z-10">
            <p className="text-[7px] mb-2 tracking-[0.25em]" style={{ color: '#8b7355' }}>⸺ ALTAR DE INVOCACIÓN ⸺</p>
            <h2 className="text-[10px] tracking-widest" style={{ color: '#fbbf24', textShadow: '2px 2px 0 #000' }}>SELLAR UN DOMINIO</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">

          {/* Subject name */}
          <div className="mb-5">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>NOMBRE DE LA MATERIA</label>
            <input
              type="text"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              placeholder="ej. Análisis Matemático II"
              required
              className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
              style={{ border: '2px solid #3d2817', background: '#0a0504', fontFamily: '"Press Start 2P", monospace', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#92400e')}
              onBlur={e => (e.target.style.borderColor = '#3d2817')}
            />
          </div>

          {/* Daily target */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>META DIARIA</label>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[6px] mb-2 tracking-widest" style={{ color: '#5c4a3d' }}>HORAS</label>
                <input
                  type="number"
                  value={dailyHours}
                  onChange={e => setDailyHours(e.target.value === '' ? '' : Math.max(0, Math.min(12, Number(e.target.value))))}
                  placeholder="0"
                  min="0" max="12"
                  className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
                  style={{ border: '2px solid #3d2817', background: '#0a0504', fontFamily: '"Press Start 2P", monospace' }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#3d2817')}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[6px] mb-2 tracking-widest" style={{ color: '#5c4a3d' }}>MINUTOS</label>
                <input
                  type="number"
                  value={dailyMins}
                  onChange={e => setDailyMins(e.target.value === '' ? '' : Math.min(59, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  min="0" max="59"
                  className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
                  style={{ border: '2px solid #3d2817', background: '#0a0504', fontFamily: '"Press Start 2P", monospace' }}
                  onFocus={e => (e.target.style.borderColor = '#92400e')}
                  onBlur={e => (e.target.style.borderColor = '#3d2817')}
                />
              </div>
            </div>

            {/* Days per week */}
            <label className="block text-[6px] mb-2 tracking-widest" style={{ color: '#5c4a3d' }}>DÍAS POR SEMANA</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS_OPTIONS.map(opt => {
                const isSelected = activeDays === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setActiveDays(opt.value)}
                    style={{
                      padding: '6px 10px',
                      border: `2px solid ${isSelected ? '#92400e' : '#3d2817'}`,
                      background: isSelected ? '#1c0800' : '#0a0504',
                      color: isSelected ? '#fbbf24' : '#8b7355',
                      fontSize: 6,
                      fontFamily: '"Press Start 2P", monospace',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Weekly preview */}
            {dailyTargetHours > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[6px]" style={{ color: '#8b7355' }}>
                  {fmtHours(dailyTargetHours)}/día × {activeDays} días = {Math.round(weeklyMins / 60 * 10) / 10}h/semana
                </p>
                {!isValidTarget && (
                  <p className="text-[6px]" style={{ color: '#ef4444' }}>mínimo 10 min/día</p>
                )}
              </div>
            )}
          </div>

          {/* Beast selection */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#8b7355' }}>GUARDIÁN DEL DOMINIO</label>

            {/* Selected beast preview */}
            <div className="mb-4 p-4 relative overflow-hidden" style={{ border: '2px solid #92400e', background: '#0f0804' }}>
              {selectedBeast?.bgImg && (
                <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${selectedBeast.bgImg})`, opacity: 0.15 }} />
              )}
              <div className="relative z-10 flex items-center gap-4">
                <div style={{ width: 56, height: 56, flexShrink: 0, border: '2px solid #3a1a00', background: '#0a0504', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={selectedBeast?.spriteImg} alt={selectedBeast?.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                </div>
                <div>
                  <p className="text-[9px] mb-1" style={{ color: '#fbbf24' }}>{selectedBeast?.name}</p>
                  <p className="text-[6px] italic leading-relaxed" style={{ color: '#5c4a3d' }}>{selectedBeast?.lore?.slice(0, 120)}...</p>
                </div>
              </div>
            </div>

            {/* Beast grid */}
            <div className="grid grid-cols-4 gap-2 p-3 overflow-y-auto" style={{ border: '2px solid #3d2817', background: '#0a0504', maxHeight: 220 }}>
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
                      border: `2px solid ${isSelected ? '#92400e' : unlocked ? '#3d2817' : '#1a1a1a'}`,
                      background: isSelected ? '#1c0800' : unlocked ? '#0f0804' : '#080808',
                      boxShadow: isSelected ? '0 0 8px rgba(146,64,14,0.3)' : 'none',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div style={{ width: 36, height: 36, border: `1px solid ${isSelected ? '#92400e' : unlocked ? '#3d2817' : '#1a1a1a'}`, background: '#0a0504', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4, position: 'relative' }}>
                      <img src={beast.spriteImg} alt={unlocked ? beast.name : '???'} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0)' }} />
                      {!unlocked && <span style={{ position: 'absolute', fontSize: '12px' }}>🔒</span>}
                    </div>
                    <span className="text-[5px]" style={{ color: isSelected ? '#fbbf24' : unlocked ? '#8b7355' : '#3a3a3a' }}>
                      {unlocked ? beast.name : reqEra.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-pixel text-[8px] py-3" style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}>
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
