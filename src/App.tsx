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
      className="min-h-screen bg-black flex flex-col items-center justify-center gap-6"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      <div
        style={{
          fontSize:      28,
          color:         '#f59e0b',
          textShadow:    '0 0 20px #f59e0b66, 4px 4px 0 rgba(0,0,0,1)',
          letterSpacing: '0.05em',
        }}
      >
        FOCUS
      </div>
      <div style={{ fontSize: '8px', color: '#3f3f46', letterSpacing: '0.3em' }}>
        RITUAL OF DEBT
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width:      6,
              height:     6,
              background: '#f59e0b',
              animation:  `dot-blink 1.2s ${i * 0.4}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dot-blink {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.9;  }
        }
      `}</style>
    </div>
  );
}

function App() {
  const { checkAndApplyWeeklyDebt } = useStore();
  const [splash, setSplash] = useState<SplashPhase>('showing');
  const [currentScreen, setCurrentScreen] = useState<Screen>('hub');

  useEffect(() => {
    checkAndApplyWeeklyDebt();
  }, [checkAndApplyWeeklyDebt]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplash('fading'), 1600);
    const t2 = setTimeout(() => setSplash('done'),   2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (splash !== 'done') {
    return (
      <div style={{ transition: 'opacity 0.4s ease-out', opacity: splash === 'fading' ? 0 : 1 }}>
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
    <div className="min-h-screen bg-zinc-950">
      {renderScreen()}
    </div>
  );
}

export default App;
