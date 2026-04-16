import { useState } from 'react';
import { useStore, BEASTS } from '../store/useStore';

interface SummonModalProps {
  onClose: () => void;
}

export function SummonModal({ onClose }: SummonModalProps) {
  const { createDomain } = useStore();
  const [subjectName, setSubjectName] = useState('');
  const [weeklyTargetMins, setWeeklyTargetMins] = useState<number | ''>('');
  const [selectedBeastId, setSelectedBeastId] = useState<string>('alberic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !weeklyTargetMins || !selectedBeastId) return;
    createDomain(subjectName, Number(weeklyTargetMins), selectedBeastId);
    onClose();
  };

  const selectedBeast = BEASTS[selectedBeastId as keyof typeof BEASTS];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(4,4,10,0.92)',
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
          background: '#09090f',
          boxShadow: '6px 6px 0 0 #000, 0 0 40px rgba(146,64,14,0.2)',
          maxHeight: '90vh',
        }}
      >
        {/* ── HEADER ── */}
        <div
          className="p-5 text-center sticky top-0 z-10"
          style={{
            background: '#09090f',
            borderBottom: '2px solid #1a1408',
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
            <p className="text-[7px] mb-2 tracking-[0.25em]" style={{ color: '#52525b' }}>
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
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#52525b' }}>
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
                border: '2px solid #252535',
                background: '#07070f',
                fontFamily: '"Press Start 2P", monospace',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#92400e')}
              onBlur={e => (e.target.style.borderColor = '#252535')}
            />
          </div>

          {/* Weekly target */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#52525b' }}>
              META SEMANAL (minutos)
            </label>
            <input
              type="number"
              value={weeklyTargetMins}
              onChange={e => setWeeklyTargetMins(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="ej. 120"
              min="1"
              required
              className="w-full px-4 py-3 text-[8px] text-white placeholder-zinc-700 outline-none"
              style={{
                border: '2px solid #252535',
                background: '#07070f',
                fontFamily: '"Press Start 2P", monospace',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#92400e')}
              onBlur={e => (e.target.style.borderColor = '#252535')}
            />
          </div>

          {/* Beast selection */}
          <div className="mb-6">
            <label className="block text-[7px] mb-3 tracking-widest" style={{ color: '#52525b' }}>
              GUARDIÁN DEL DOMINIO
            </label>

            {/* Selected beast preview */}
            <div
              className="mb-4 p-4 relative overflow-hidden"
              style={{
                border: '2px solid #92400e',
                background: '#0c0800',
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
                    background: '#07070f',
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
                  <p className="text-[6px] italic leading-relaxed" style={{ color: '#4a4a5a' }}>
                    {selectedBeast?.lore}
                  </p>
                </div>
              </div>
            </div>

            {/* Beast grid */}
            <div
              className="grid grid-cols-4 gap-2 p-3 overflow-y-auto"
              style={{
                border: '2px solid #1a1a2a',
                background: '#07070f',
                maxHeight: 220,
              }}
            >
              {Object.values(BEASTS).map(beast => {
                const isSelected = selectedBeastId === beast.id;
                return (
                  <button
                    key={beast.id}
                    type="button"
                    onClick={() => setSelectedBeastId(beast.id)}
                    className="flex flex-col items-center p-2"
                    style={{
                      border: `2px solid ${isSelected ? '#92400e' : '#1a1a2a'}`,
                      background: isSelected ? '#1c0800' : '#0c0c18',
                      boxShadow: isSelected ? '0 0 8px rgba(146,64,14,0.3)' : 'none',
                      transition: 'border-color 0.1s, background 0.1s',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        border: `1px solid ${isSelected ? '#92400e' : '#252535'}`,
                        background: '#07070f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}
                    >
                      <img
                        src={beast.spriteImg}
                        alt={beast.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                      />
                    </div>
                    <span className="text-[5px]" style={{ color: isSelected ? '#fbbf24' : '#52525b' }}>
                      {beast.name}
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
              style={{ borderColor: '#252535', background: '#0c0c18', color: '#71717a' }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="flex-1 btn-pixel text-[8px] py-3"
              style={{ borderColor: '#92400e', background: '#1c0800', color: '#fbbf24' }}
            >
              ⚔ SELLAR DOMINIO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
