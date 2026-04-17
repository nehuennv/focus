import { useState, useEffect, useCallback } from 'react';
import { useStore, ERAS } from '../store/useStore';

interface TutorialProps {
  onClose: () => void;
}

const STEPS = [
  {
    id: 'ritual',
    icon: '🔥',
    num: '01',
    title: 'EL RITUAL',
    subtitle: 'Tu arma contra la procrastinación',
    color: '#f87171',
    colorDim: '#7f1d1d',
    colorBg: 'rgba(127,29,29,0.12)',
    glow: 'rgba(248,113,113,0.25)',
    accent: '#dc2626',
    bullets: [
      { icon: '⏱', text: 'Acercate al PORTAL y presioná ENTER para iniciar un ritual de enfoque.' },
      { icon: '⚙', text: 'Elegís cuánto tiempo (1h–8h), qué Dominio trabajás y contra qué Bestia combatís.' },
      { icon: '💧', text: 'Cada minuto completado reduce la deuda semanal de tu Dominio.' },
      { icon: '🏳', text: 'Si abortás la sesión, igual se cuenta el tiempo transcurrido. Nunca se pierde.' },
    ],
  },
  {
    id: 'dominios',
    icon: '📜',
    num: '02',
    title: 'DOMINIOS',
    subtitle: 'Las materias que debes conquistar',
    color: '#4ade80',
    colorDim: '#14532d',
    colorBg: 'rgba(20,83,45,0.12)',
    glow: 'rgba(74,222,128,0.25)',
    accent: '#16a34a',
    bullets: [
      { icon: '📚', text: 'Un Dominio es una materia o área de estudio: Matemáticas, Guitarra, Idiomas...' },
      { icon: '⚖', text: 'Cada Dominio tiene un objetivo semanal de minutos. Si no lo alcanzás, acumulás DEUDA.' },
      { icon: '📈', text: 'La deuda crece cada semana inactiva. Las bestias del dominio se vuelven más peligrosas.' },
      { icon: '∞', text: 'Podés crear hasta 50 dominios. Accedé desde el ESCRITORIO en el hub.' },
    ],
  },
  {
    id: 'bestiario',
    icon: '👾',
    num: '03',
    title: 'EL BESTIARIO',
    subtitle: 'Tus adversarios eternos',
    color: '#fb923c',
    colorDim: '#7c2d12',
    colorBg: 'rgba(124,45,18,0.12)',
    glow: 'rgba(251,146,60,0.25)',
    accent: '#ea580c',
    bullets: [
      { icon: '💀', text: `Hay ${11} bestias en el juego. Cada ritual se libra contra una de ellas.` },
      { icon: '⚔', text: 'Derrotar una bestia (saldar la deuda del dominio) cuenta como una victoria.' },
      { icon: '🔁', text: 'Matás la misma bestia muchas veces. El contador de derrotas queda registrado por siempre.' },
      { icon: '📖', text: 'Revisá el Bestiario desde la BIBLIOTECA en el hub.' },
    ],
  },
  {
    id: 'progresion',
    icon: '🔮',
    num: '04',
    title: 'LA JERARQUÍA DEL RITO',
    subtitle: 'Un sistema de progresión para años',
    color: '#c084fc',
    colorDim: '#581c87',
    colorBg: 'rgba(88,28,135,0.12)',
    glow: 'rgba(192,132,252,0.25)',
    accent: '#9333ea',
    bullets: [
      { icon: '🗺', text: `10 Eras × 10 Rangos = 100 rangos totales, basados en MINUTOS DE FOCO TOTAL.` },
      { icon: '📜', text: `Las Eras van de "${ERAS[0].name}" hasta "${ERAS[ERAS.length - 1].name}" (${ERAS[ERAS.length - 1].startMins.toLocaleString()} min ≈ 3000h).` },
      { icon: '⏳', text: 'Las últimas Eras requieren años de trabajo constante. Es intencional.' },
      { icon: '⭐', text: 'También ganás PUNTUACIÓN por sesión (vanity score). No afecta tu rango.' },
    ],
  },
  {
    id: 'trofeos',
    icon: '🏆',
    num: '05',
    title: 'TROFEOS Y LOGROS',
    subtitle: 'Tu legado permanente',
    color: '#fbbf24',
    colorDim: '#92400e',
    colorBg: 'rgba(146,64,14,0.12)',
    glow: 'rgba(251,191,36,0.25)',
    accent: '#d97706',
    bullets: [
      { icon: '🎖', text: `${28} logros desbloqueables en 5 categorías: Tiempo, Bestias, Dominios, Sesiones y Progresión.` },
      { icon: '✅', text: 'Se desbloquean automáticamente al cumplir las condiciones. No hace falta reclamarlos.' },
      { icon: '👑', text: 'Los logros de Progresión marcan hitos de Era. Los más difíciles requieren cientos de horas.' },
      { icon: '?', text: 'Podés volver a ver este tutorial cuando quieras desde el botón "?" en el hub.' },
    ],
  },
];

export function Tutorial({ onClose }: TutorialProps) {
  const { setTutorialSeen } = useStore();
  const [step, setStep]         = useState(0);
  const [animDir, setAnimDir]   = useState<'in' | 'out-left' | 'out-right'>('in');
  const [visible, setVisible]   = useState(false);
  const [closing, setClosing]   = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setTutorialSeen(true);
      onClose();
    }, 350);
  }, [setTutorialSeen, onClose]);

  const goTo = useCallback((next: number) => {
    const dir = next > step ? 'out-left' : 'out-right';
    setAnimDir(dir);
    setTimeout(() => {
      setStep(next);
      setAnimDir('in');
    }, 220);
  }, [step]);

  const handleNext = useCallback(() => {
    if (isLast) handleClose();
    else goTo(step + 1);
  }, [isLast, step, goTo, handleClose]);

  const handlePrev = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [step, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft')  handlePrev();
      if (e.key === 'Escape')     handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev, handleClose]);

  const slideStyle: React.CSSProperties =
    animDir === 'in'
      ? { opacity: 1, transform: 'translateX(0) scale(1)', transition: 'opacity 0.22s ease-out, transform 0.22s ease-out' }
      : animDir === 'out-left'
      ? { opacity: 0, transform: 'translateX(-32px) scale(0.97)', transition: 'opacity 0.2s ease-in, transform 0.2s ease-in' }
      : { opacity: 0, transform: 'translateX(32px) scale(0.97)', transition: 'opacity 0.2s ease-in, transform 0.2s ease-in' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(4px)',
        fontFamily: '"Press Start 2P", monospace',
        opacity: closing ? 0 : (visible ? 1 : 0),
        transition: closing ? 'opacity 0.35s ease-in' : 'opacity 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 680,
          background: '#07050a',
          border: `2px solid ${current.colorDim}`,
          boxShadow: `0 0 60px ${current.glow}, 6px 6px 0 #000`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '90vh',
        }}
      >
        {/* ── TOP PROGRESS BAR ─────────────────────────────────────────── */}
        <div style={{ height: 3, background: '#0f0f1a', display: 'flex' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              onClick={() => i !== step && goTo(i)}
              style={{
                flex: 1,
                background: i <= step ? current.color : '#1a1a2a',
                cursor: i !== step ? 'pointer' : 'default',
                transition: 'background 0.3s',
                borderRight: i < STEPS.length - 1 ? '1px solid #07050a' : 'none',
              }}
            />
          ))}
        </div>

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${current.colorDim}`,
            background: current.colorBg,
          }}
        >
          {/* Step number badge */}
          <div style={{
            width: 40, height: 40, flexShrink: 0,
            border: `2px solid ${current.colorDim}`,
            background: '#0a0a14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: current.color,
            letterSpacing: '0.05em',
            boxShadow: `inset 0 0 12px ${current.colorBg}`,
          }}>
            {current.num}
          </div>

          {/* Icon */}
          <div style={{ fontSize: 28, flexShrink: 0, filter: `drop-shadow(0 0 12px ${current.glow})` }}>
            {current.icon}
          </div>

          {/* Titles */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: current.color, letterSpacing: '0.1em', lineHeight: 1.2, marginBottom: 5 }}>
              {current.title}
            </div>
            <div style={{ fontSize: 8, color: current.colorDim, letterSpacing: '0.08em' }}>
              {current.subtitle}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              background: 'transparent', border: `1px solid #1a1a2a`,
              color: '#3d3d4a', fontSize: 8, padding: '6px 10px',
              cursor: 'pointer', fontFamily: '"Press Start 2P", monospace',
              letterSpacing: '0.1em',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#7f1d1d'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3d3d4a'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a2a'; }}
          >
            ✕
          </button>
        </div>

        {/* ── CONTENT ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', ...slideStyle }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {current.bullets.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '14px 16px',
                  background: '#0d0b14',
                  border: `1px solid ${current.colorDim}33`,
                  boxShadow: `inset 0 0 20px rgba(0,0,0,0.3)`,
                }}
              >
                {/* Bullet icon */}
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: current.colorBg,
                  border: `1px solid ${current.colorDim}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {b.icon}
                </div>
                {/* Text */}
                <p style={{
                  fontSize: 9, color: '#b8a898',
                  lineHeight: 1.9, letterSpacing: '0.04em',
                  margin: 0, paddingTop: 2,
                }}>
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: `1px solid ${current.colorDim}`,
            background: '#05040a',
          }}
        >
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i !== step && goTo(i)}
                style={{
                  width: i === step ? 20 : 8, height: 8,
                  background: i < step ? current.colorDim : i === step ? current.color : '#1a1a2a',
                  border: 'none', cursor: i !== step ? 'pointer' : 'default',
                  transition: 'width 0.25s, background 0.25s',
                  boxShadow: i === step ? `0 0 8px ${current.glow}` : 'none',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  border: `2px solid #2a2a3a`, background: '#0d0b14',
                  color: '#5c5c7a', fontSize: 9, padding: '10px 16px',
                  cursor: 'pointer', fontFamily: '"Press Start 2P", monospace',
                  boxShadow: '2px 2px 0 #000', letterSpacing: '0.08em',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#9ca3af'; b.style.borderColor = '#4a4a5a'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#5c5c7a'; b.style.borderColor = '#2a2a3a'; }}
              >
                ← ATRÁS
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                border: `2px solid ${current.colorDim}`,
                background: isLast ? current.accent : '#0d0b14',
                color: isLast ? '#fff' : current.color,
                fontSize: 9, padding: '10px 20px',
                cursor: 'pointer', fontFamily: '"Press Start 2P", monospace',
                boxShadow: `3px 3px 0 #000, 0 0 16px ${isLast ? current.glow : 'transparent'}`,
                letterSpacing: '0.08em',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = isLast ? current.color : current.colorBg; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = isLast ? current.accent : '#0d0b14'; }}
            >
              {isLast ? '¡ENTENDIDO! ✓' : 'SIGUIENTE →'}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div style={{
          textAlign: 'center', paddingBottom: 10,
          fontSize: 7, color: '#1e1e2a', letterSpacing: '0.15em',
        }}>
          ← → FLECHAS · ESC CERRAR
        </div>
      </div>

      <style>{`
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
