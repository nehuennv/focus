import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Hub2D } from './components/Hub2D';
import { DomainsScreen } from './components/DomainsScreen';
import { BestiaryScreen } from './components/BestiaryScreen';
import { TrophiesScreen } from './components/TrophiesScreen';

// 'menu' removed — ritual setup lives inside Hub2D via RPGDialogue
type Screen = 'hub' | 'domains' | 'bestiary' | 'trophies';
type SplashPhase = 'showing' | 'fading' | 'done';

function SplashScreen() {
  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          animation: 'ambient-pulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Title with soul ember */}
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              fontSize:      36,
              color:         '#fbbf24',
              textShadow:    '0 0 40px rgba(251,191,36,0.6), 0 0 80px rgba(245,158,11,0.4), 5px 5px 0 rgba(0,0,0,1)',
              letterSpacing: '0.15em',
              animation:     'title-float 3s ease-in-out infinite, title-glow 2.5s ease-in-out infinite',
            }}
          >
            FOCUS SOULS
          </div>
          <div
            style={{
              fontSize: '6px',
              color: '#71717a',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              opacity: 0.8,
            }}
          >
            Ritual of Debt
          </div>
        </div>

        {/* Soul ember - single animated element */}
        <div style={{ marginTop: 24, position: 'relative' }}>
          <div
            style={{
              width:      12,
              height:     12,
              background: '#fbbf24',
              borderRadius: '50%',
              animation:  'ember-float 2s ease-in-out infinite',
              boxShadow:  '0 0 30px #fbbf24, 0 0 60px #f59e0b, 0 0 90px rgba(245,158,11,0.6)',
            }}
          />
          {/* Particle sparks */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 3,
                height: 3,
                background: '#fcd34d',
                borderRadius: '50%',
                animation: `spark 1.5s ${i * 0.3}s ease-in-out infinite`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Developer credit */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <div
            style={{
              fontSize: '5px',
              color: '#52525b',
              letterSpacing: '0.25em',
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            Developed by
          </div>
          <div
            style={{
              fontSize:      11,
              color:         '#d6d3d1',
              textShadow:    '0 0 20px rgba(214,211,209,0.5)',
              letterSpacing: '0.2em',
              animation:     'name-flicker 4s ease-in-out infinite',
            }}
          >
            NEHUEN
          </div>
        </div>
      </div>

      <style>{`
        @keyframes title-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes title-glow {
          0%, 100% { opacity: 0.9; }
          50%       { opacity: 1; }
        }
        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
          50%       { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes ember-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
          50%       { transform: translateY(-6px) scale(1.05); opacity: 1; }
        }
        @keyframes spark {
          0%   { transform: translate(-50%, -50%) translate(0, 0); opacity: 0; }
          30%  { opacity: 0.8; }
          70%  { opacity: 0.4; }
          100% { transform: translate(-50%, -50%) translate(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random() * 20}px, -${20 + Math.random() * 30}px); opacity: 0; }
        }
        @keyframes name-flicker {
          0%, 100% { opacity: 0.8; }
          45%      { opacity: 0.9; }
          50%      { opacity: 1; }
          55%      { opacity: 0.9; }
          100%     { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function App() {
  const { checkAndApplyWeeklyDebt } = useStore();
  const [splash, setSplash] = useState<SplashPhase>('showing');
  const [currentScreen, setCurrentScreen] = useState<Screen>('hub');
  const [roomOpacity, setRoomOpacity] = useState(0);

  useEffect(() => {
    checkAndApplyWeeklyDebt();
  }, [checkAndApplyWeeklyDebt]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplash('fading'), 2000);
    const t2 = setTimeout(() => setSplash('done'),   3000);
    // Fade-in progresivo de la habitación después que desaparece la splash
    const t3 = setTimeout(() => setRoomOpacity(0.3),  3200);
    const t4 = setTimeout(() => setRoomOpacity(0.6),  3600);
    const t5 = setTimeout(() => setRoomOpacity(1),    4000);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
    };
  }, []);

  if (splash !== 'done') {
    return (
      <div style={{ transition: 'opacity 0.8s ease-out', opacity: splash === 'fading' ? 0 : 1 }}>
        <SplashScreen />
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'hub':
        return (
          <Hub2D
            onOpenBestiary={() => setCurrentScreen('bestiary')}
            onOpenDomains={() => setCurrentScreen('domains')}
          />
        );
      case 'domains':
        return <DomainsScreen onBackToMenu={() => setCurrentScreen('hub')} />;
      case 'bestiary':
        return <BestiaryScreen onBackToMenu={() => setCurrentScreen('hub')} />;
      case 'trophies':
        return <TrophiesScreen onBackToMenu={() => setCurrentScreen('hub')} />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0504]"
      style={{
        opacity: roomOpacity,
        transition: 'opacity 400ms ease-in-out',
      }}
    >
      {renderScreen()}
    </div>
  );
}

export default App;
