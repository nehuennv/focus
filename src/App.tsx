import { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from './store/useStore';
import { Hub2D } from './components/Hub2D';
import { DomainsScreen } from './components/DomainsScreen';
import { BestiaryScreen } from './components/BestiaryScreen';
import { TrophiesScreen } from './components/TrophiesScreen';
import { Tutorial } from './components/Tutorial';

type Screen = 'hub' | 'domains' | 'bestiary' | 'trophies';
type AppPhase = 'title' | 'lore' | 'hub';
type TitlePhase = 'enter' | 'idle' | 'exit';

// ─── Lore lines ────────────────────────────────────────────────────────────────
const LORE_LINES = [
  {
    speaker: 'VOZ DEL VACÍO',
    text: '...Despiertas. El tiempo que debes ha crecido en las sombras mientras dormías.',
  },
  {
    speaker: 'VOZ DEL VACÍO',
    text: 'Cada dominio que abandonas forja una deuda. Las bestias que lo habitan se vuelven más poderosas con cada semana que ignoras.',
  },
  {
    speaker: 'VOZ DEL VACÍO',
    text: 'El Portal te llevará al combate. La Hoguera, a tu descanso. Y el enfoque... ese es tu único arma.',
  },
  {
    speaker: 'VOZ DEL VACÍO',
    text: 'Ofrece minutos. Purga la deuda. Derrota a las bestias. El ritual... comienza cuando tú lo decidas.',
  },
];

// ─── Floating ember ────────────────────────────────────────────────────────────
function Ember({ style }: { style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', width: 3, height: 3, borderRadius: '50%',
      background: '#fbbf24', boxShadow: '0 0 6px #f59e0b',
      pointerEvents: 'none', ...style,
    }} />
  );
}

// ─── Title Screen ──────────────────────────────────────────────────────────────
function TitleScreen({ onContinue }: { onContinue: () => void }) {
  const [titlePhase, setTitlePhase] = useState<TitlePhase>('enter');
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTitlePhase('idle'), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (titlePhase !== 'idle') return;
    const iv = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(iv);
  }, [titlePhase]);

  useEffect(() => {
    if (titlePhase !== 'idle') return;
    const handler = () => {
      setTitlePhase('exit');
      setTimeout(onContinue, 650);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [titlePhase, onContinue]);

  const entering = titlePhase === 'enter';
  const exiting = titlePhase === 'exit';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative select-none"
      style={{
        overflow: 'hidden',
        background: '#050302',
        fontFamily: '"Press Start 2P", monospace',
        cursor: titlePhase === 'idle' ? 'pointer' : 'default',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.06)' : 'scale(1)',
        filter: exiting ? 'brightness(2.5)' : 'brightness(1)',
        transition: exiting ? 'opacity 0.6s ease-in, transform 0.6s ease-in, filter 0.4s ease-in' : undefined,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(180,120,10,0.1) 0%, transparent 70%),' +
          'radial-gradient(ellipse 40% 30% at 50% 35%, rgba(251,191,36,0.07) 0%, transparent 60%)',
        animation: 'ambient 5s ease-in-out infinite',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* Floating embers */}
      {[
        { left: '12%', animationDelay: '0s', animationDuration: '6s', top: '70%' },
        { left: '25%', animationDelay: '1.2s', animationDuration: '8s', top: '80%' },
        { left: '50%', animationDelay: '0.4s', animationDuration: '7s', top: '75%' },
        { left: '72%', animationDelay: '2s', animationDuration: '9s', top: '85%' },
        { left: '88%', animationDelay: '0.8s', animationDuration: '6.5s', top: '78%' },
        { left: '38%', animationDelay: '1.8s', animationDuration: '7.5s', top: '82%' },
        { left: '62%', animationDelay: '3s', animationDuration: '8.5s', top: '72%' },
      ].map((s, i) => (
        <Ember key={i} style={{ ...s, animation: `ember-rise ${s.animationDuration} ${s.animationDelay} ease-in infinite` }} />
      ))}

      {/* Title block */}
      <div className="relative z-10 flex flex-col items-center" style={{ gap: 0 }}>

        {/* FOCUS */}
        <div style={{
          fontSize: 'clamp(52px, 10vw, 96px)',
          color: '#fbbf24',
          letterSpacing: '0.18em',
          lineHeight: 1,
          textShadow:
            '0 0 60px rgba(251,191,36,0.5), 0 0 120px rgba(245,158,11,0.3),' +
            '6px 6px 0 rgba(0,0,0,1), 3px 3px 0 rgba(120,60,0,0.8)',
          opacity: entering ? 0 : 1,
          transform: entering ? 'translateY(-60px)' : 'translateY(0)',
          transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          animation: !entering ? 'focus-breathe 4s ease-in-out infinite' : undefined,
        }}>
          FOCUS
        </div>

        {/* Separator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          margin: '10px 0',
          width: 'clamp(280px, 50vw, 520px)',
          opacity: entering ? 0 : 1,
          transform: entering ? 'scaleX(0)' : 'scaleX(1)',
          transition: 'opacity 0.6s ease 0.25s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s',
        }}>
          <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, #92400e 30%, #d97706 70%, transparent)' }} />
          <span style={{ fontSize: 'clamp(5px, 1vw, 7px)', color: '#8b7355', letterSpacing: '0.4em', whiteSpace: 'nowrap' }}>
            RITUAL OF DEBT
          </span>
          <div style={{ flex: 1, height: 2, background: 'linear-gradient(to left, transparent, #92400e 30%, #d97706 70%, transparent)' }} />
        </div>

        {/* SOULS */}
        <div style={{
          fontSize: 'clamp(52px, 10vw, 96px)',
          color: '#f59e0b',
          letterSpacing: '0.18em',
          lineHeight: 1,
          textShadow:
            '0 0 60px rgba(245,158,11,0.6), 0 0 120px rgba(251,191,36,0.3),' +
            '6px 6px 0 rgba(0,0,0,1), 3px 3px 0 rgba(100,50,0,0.8)',
          opacity: entering ? 0 : 1,
          transform: entering ? 'translateY(60px)' : 'translateY(0)',
          transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s',
          animation: !entering ? 'souls-throb 3s ease-in-out infinite' : undefined,
        }}>
          SOULS
        </div>

        {/* Press any key */}
        <div style={{
          marginTop: 52,
          fontSize: 'clamp(7px, 1.5vw, 10px)',
          letterSpacing: '0.15em',
          color: '#c9b896',
          textShadow: '0 0 16px rgba(201,184,150,0.4)',
          opacity: entering ? 0 : (blink ? 1 : 0),
          transition: entering ? 'none' : 'opacity 0.15s',
          visibility: entering ? 'hidden' : 'visible',
        }}>
          PULSA CUALQUIER TECLA PARA CONTINUAR
        </div>

        {/* Diamonds */}
        <div style={{
          marginTop: 16, display: 'flex', gap: 8, alignItems: 'center',
          opacity: entering ? 0 : 0.4,
          transition: 'opacity 0.6s ease 1s',
        }}>
          {['◆', '◇', '◆'].map((s, i) => (
            <span key={i} style={{ fontSize: 8, color: '#3d2817', animation: `diamond-pulse 2s ${i * 0.4}s ease-in-out infinite` }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Developer credit */}
      <div style={{
        position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center',
        opacity: entering ? 0 : 1,
        transform: entering ? 'translateY(20px)' : 'translateY(0)',
        transition: 'opacity 0.8s ease 0.9s, transform 0.8s ease 0.9s',
      }}>
        <div style={{ fontSize: 'clamp(5px, 1vw, 6px)', color: '#3d2817', letterSpacing: '0.4em', marginBottom: 8 }}>DEVELOPED BY</div>
        <div style={{
          fontSize: 'clamp(9px, 2vw, 12px)', color: '#d6d3d1',
          letterSpacing: '0.3em', textShadow: '0 0 20px rgba(214,211,209,0.3)',
          animation: !entering ? 'name-flicker 5s ease-in-out infinite' : undefined,
        }}>NEHUEN</div>
      </div>

      {/* Version */}
      <div style={{ position: 'absolute', bottom: 16, right: 24, fontSize: '6px', color: '#1c1410', letterSpacing: '0.2em', opacity: entering ? 0 : 1, transition: 'opacity 0.5s ease 1.2s' }}>v1.0</div>

      <style>{`
        @keyframes ambient { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes focus-breathe {
          0%, 100% { text-shadow: 0 0 60px rgba(251,191,36,0.5), 0 0 120px rgba(245,158,11,0.3), 6px 6px 0 #000, 3px 3px 0 rgba(120,60,0,0.8); }
          50%       { text-shadow: 0 0 80px rgba(251,191,36,0.8), 0 0 160px rgba(245,158,11,0.5), 6px 6px 0 #000, 3px 3px 0 rgba(120,60,0,0.8); }
        }
        @keyframes souls-throb {
          0%, 100% { text-shadow: 0 0 60px rgba(245,158,11,0.6), 0 0 120px rgba(251,191,36,0.3), 6px 6px 0 #000, 3px 3px 0 rgba(100,50,0,0.8); }
          50%       { text-shadow: 0 0 90px rgba(251,191,36,0.9), 0 0 180px rgba(245,158,11,0.5), 6px 6px 0 #000, 3px 3px 0 rgba(100,50,0,0.8); }
        }
        @keyframes ember-rise {
          0%   { transform: translateY(0) scale(1);    opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-80vh) scale(0.3); opacity: 0; }
        }
        @keyframes name-flicker {
          0%, 100% { opacity: 0.7; } 48% { opacity: 0.8; } 50% { opacity: 1; } 52% { opacity: 0.8; }
        }
        @keyframes diamond-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}

// ─── Lore Screen ───────────────────────────────────────────────────────────────
function LoreScreen({ onFinish }: { onFinish: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [blink, setBlink] = useState(true);
  const fullText = LORE_LINES[lineIndex].text;
  const charRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    charRef.current = 0;
    setDisplayed('');
    setIsTyping(true);
    const iv = setInterval(() => {
      charRef.current++;
      setDisplayed(fullText.slice(0, charRef.current));
      if (charRef.current >= fullText.length) { clearInterval(iv); setIsTyping(false); }
    }, 26);
    return () => clearInterval(iv);
  }, [lineIndex, fullText]);

  useEffect(() => {
    if (isTyping) return;
    const iv = setInterval(() => setBlink(b => !b), 550);
    return () => clearInterval(iv);
  }, [isTyping]);

  const advance = useCallback(() => {
    if (isTyping) { setDisplayed(fullText); setIsTyping(false); return; }
    if (lineIndex < LORE_LINES.length - 1) { setLineIndex(i => i + 1); setBlink(true); }
    else { setExiting(true); setTimeout(onFinish, 800); }
  }, [isTyping, lineIndex, fullText, onFinish]);

  useEffect(() => {
    const h = () => advance();
    window.addEventListener('keydown', h);
    window.addEventListener('click', h);
    return () => { window.removeEventListener('keydown', h); window.removeEventListener('click', h); };
  }, [advance]);

  return (
    <div
      className="min-h-screen flex flex-col relative select-none"
      style={{
        overflow: 'hidden',
        background: '#030204',
        fontFamily: '"Press Start 2P", monospace',
        cursor: 'pointer',
        opacity: exiting ? 0 : (visible ? 1 : 0),
        transition: exiting ? 'opacity 0.8s ease-in' : 'opacity 0.6s ease-out',
      }}
    >
      {/* ── FULL BACKGROUND beast image ─────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'url(/img/background-lore.png)',
        backgroundSize: 'cover', backgroundPosition: 'bottom left',
        opacity: 0.6,
        imageRendering: 'pixelated',
      }} />

      {/* Dark vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(3,2,4,0.4) 0%, rgba(3,2,4,0.85) 75%),' +
          'linear-gradient(to bottom, rgba(3,2,4,0.5) 0%, transparent 30%, transparent 55%, rgba(3,2,4,0.7) 100%)',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
      }} />

      {/* Chromatic aberration lines — top & bottom */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.4) 40%, rgba(146,64,14,0.4) 60%, transparent)', pointerEvents: 'none', zIndex: 6 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.4) 40%, rgba(146,64,14,0.4) 60%, transparent)', pointerEvents: 'none', zIndex: 6 }} />

      {/* Embers */}
      {[
        { left: '5%', animationDelay: '0s', animationDuration: '7s', top: '85%' },
        { left: '22%', animationDelay: '1.4s', animationDuration: '9s', top: '90%' },
        { left: '50%', animationDelay: '0.6s', animationDuration: '8s', top: '88%' },
        { left: '75%', animationDelay: '2s', animationDuration: '6.5s', top: '82%' },
        { left: '92%', animationDelay: '0.3s', animationDuration: '10s', top: '87%' },
        { left: '38%', animationDelay: '3.2s', animationDuration: '7.5s', top: '93%' },
      ].map((s, i) => (
        <Ember key={i} style={{ ...s, animation: `ember-rise ${s.animationDuration} ${s.animationDelay} ease-in infinite`, zIndex: 7 }} />
      ))}

      {/* ── CENTERED TEXT ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '24px' }}>
        <div style={{
          maxWidth: '700px',
          textAlign: 'center',
        }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
            {LORE_LINES.map((_, i) => (
              <div key={i} style={{
                width: i === lineIndex ? 24 : 8, height: 8,
                background: i < lineIndex ? '#92400e' : i === lineIndex ? '#d97706' : '#1a1008',
                boxShadow: i === lineIndex ? '0 0 12px rgba(217,119,6,0.9)' : 'none',
                transition: 'width 0.3s, background 0.3s, box-shadow 0.3s',
              }} />
            ))}
          </div>

          {/* Lore text */}
          <div style={{
            fontSize: 'clamp(11px, 2vw, 14px)',
            color: '#ede0c8',
            lineHeight: 2.2,
            letterSpacing: '0.08em',
            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
            marginBottom: 24,
          }}>
            <span style={{ color: '#5c2d0a', fontSize: 'clamp(14px, 2.5vw, 18px)', marginRight: 8, verticalAlign: 'top', lineHeight: 1 }}>❝</span>
            {displayed}
            {/* Typing cursor */}
            <span style={{
              display: 'inline-block', width: 10, height: 3,
              background: '#d97706', marginLeft: 3, verticalAlign: 'middle',
              opacity: isTyping ? 1 : (blink ? 1 : 0),
              animation: isTyping ? 'cursor-blink 0.55s ease-in-out infinite' : 'none',
            }} />
          </div>

          {/* Advance hint */}
          <div style={{
            fontSize: 'clamp(7px, 1vw, 9px)',
            color: !isTyping && blink ? '#d97706' : 'transparent',
            letterSpacing: '0.2em',
            textShadow: '0 0 12px rgba(217,119,6,0.7)',
            transition: 'color 0.15s',
          }}>
            {lineIndex < LORE_LINES.length - 1 ? 'CONTINUAR' : 'INICIAR RITUAL'} ▶▶
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ember-rise {
          0%   { transform: translateY(0) scale(1);    opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-80vh) scale(0.3); opacity: 0; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const { checkAndApplyWeeklyDebt, tutorialSeen } = useStore();
  const [appPhase, setAppPhase] = useState<AppPhase>('title');
  const [currentScreen, setCurrentScreen] = useState<Screen>('hub');
  const [hubOpacity, setHubOpacity] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    checkAndApplyWeeklyDebt();
  }, [checkAndApplyWeeklyDebt]);

  // Auto-show tutorial for new users once hub is visible
  useEffect(() => {
    if (appPhase === 'hub' && !tutorialSeen) {
      const t = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(t);
    }
  }, [appPhase, tutorialSeen]);

  const handleTitleDone = useCallback(() => setAppPhase('lore'), []);

  const handleLoreDone = useCallback(() => {
    setAppPhase('hub');
    setTimeout(() => setHubOpacity(0.4), 50);
    setTimeout(() => setHubOpacity(0.75), 300);
    setTimeout(() => setHubOpacity(1), 650);
  }, []);

  const openTutorial = useCallback(() => setShowTutorial(true), []);
  const closeTutorial = useCallback(() => setShowTutorial(false), []);

  if (appPhase === 'title') return <TitleScreen onContinue={handleTitleDone} />;
  if (appPhase === 'lore') return <LoreScreen onFinish={handleLoreDone} />;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'hub':
        return (
          <Hub2D
            onOpenBestiary={() => setCurrentScreen('bestiary')}
            onOpenDomains={() => setCurrentScreen('domains')}
            onOpenTrophies={() => setCurrentScreen('trophies')}
            onOpenTutorial={openTutorial}
          />
        );
      case 'domains': return <DomainsScreen onBackToMenu={() => setCurrentScreen('hub')} />;
      case 'bestiary': return <BestiaryScreen onBackToMenu={() => setCurrentScreen('hub')} />;
      case 'trophies': return (
        <TrophiesScreen
          onBackToMenu={() => setCurrentScreen('hub')}
          onOpenTutorial={openTutorial}
        />
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0504]"
      style={{ opacity: hubOpacity, transition: 'opacity 350ms ease-in-out' }}
    >
      {renderScreen()}
      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </div>
  );
}

export default App;
