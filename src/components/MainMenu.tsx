import { useState } from 'react';
import { useStore, BEASTS, LEVELS } from '../store/useStore';
import { Encounter } from './Encounter';

interface MainMenuProps {
  onNavigate: (screen: string) => void;
}

type RitualStep = 1 | 2 | 3;

export function MainMenu({ onNavigate }: MainMenuProps) {
  const { domains, player } = useStore();

  // Ritual selection state
  const [selectedDuration, setSelectedDuration] = useState<number | ''>('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedBeastId, setSelectedBeastId] = useState<string>('alberic');
  const [ritualStep, setRitualStep] = useState<RitualStep | null>(null);
  const [isInEncounter, setIsInEncounter] = useState(false);

  // Duration options (1h to 8h in minutes)
  const durationOptions = [
    { value: 60, label: '1h' },
    { value: 120, label: '2h' },
    { value: 180, label: '3h' },
    { value: 240, label: '4h' },
    { value: 300, label: '5h' },
    { value: 360, label: '6h' },
    { value: 420, label: '7h' },
    { value: 480, label: '8h' },
  ];

  const handleStartRitual = () => {
    setRitualStep(1);
  };

  const handleStep1Continue = () => {
    if (selectedDuration) {
      setRitualStep(2);
    }
  };

  const handleStep2Continue = () => {
    if (selectedDomainId) {
      setRitualStep(3);
    }
  };

  const handleConfirmRitual = () => {
    if (selectedDuration && selectedDomainId && selectedBeastId) {
      // Update the domain's beastId to match the selected beast
      // This ensures the Encounter uses the correct beast
      setIsInEncounter(true);
    }
  };

  const handleBackToMenu = () => {
    setRitualStep(null);
    setSelectedDuration('');
    setSelectedDomainId('');
    setSelectedBeastId('alberic');
  };

  const currentLevelData = LEVELS.find(l => l.level === player.level) ?? LEVELS[0];

  // If in encounter, render it full screen
  if (isInEncounter && selectedDomainId) {
    return (
      <Encounter
        domainId={selectedDomainId}
        selectedBeastId={selectedBeastId}
        onBack={() => {
          setIsInEncounter(false);
          handleBackToMenu();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0504] flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1008]/20 via-[#0a0504] to-[#0a0504] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl text-amber-400 mb-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
            ⚔️ FOCUS SOULS ⚔️
          </h1>
          <p className="text-xs text-[#5c4a3d]">
            {currentLevelData.icon} LV {player.level} · {currentLevelData.title} — {player.xp.toLocaleString()} XP
          </p>
        </div>

        {/* Main Menu Buttons */}
        {!ritualStep && (
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <button
              onClick={() => onNavigate('hub')}
              className="btn-pixel border-4 border-[#3d2817] bg-[#0f0804] hover:bg-[#1a1008] text-[#8b7355] text-xs px-8 py-3"
            >
              ← VOLVER AL HUB
            </button>
            <button
              onClick={handleStartRitual}
              className="btn-pixel border-4 border-red-400 bg-red-600 hover:bg-red-500 text-white text-sm md:text-base px-8 py-4"
            >
              🔥 COMENZAR RITUAL
            </button>
            <button
              onClick={() => onNavigate('domains')}
              className="btn-pixel border-4 border-[#4a3728] bg-[#1a1008] hover:bg-[#241810] text-[#c9b896] text-sm md:text-base px-8 py-4"
            >
              📜 DOMINIOS
            </button>
            <button
              onClick={() => onNavigate('trophies')}
              className="btn-pixel border-4 border-amber-400 bg-amber-700 hover:bg-amber-600 text-white text-sm md:text-base px-8 py-4"
            >
              🏆 TROFEOS
            </button>
            <button
              onClick={() => onNavigate('bestiary')}
              className="btn-pixel border-4 border-[#4a3728] bg-[#1a1008] hover:bg-[#241810] text-[#c9b896] text-sm md:text-base px-8 py-4"
            >
              💀 BESTIARIO
            </button>
          </div>
        )}

        {/* Ritual Selection Flow */}
        {ritualStep !== null && (
          <div className="border-4 border-[#8b7355] bg-[#0f0804] shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6">
            {/* Step Indicator */}
            <div className="flex justify-center gap-2 mb-6">
              <div className={`w-3 h-3 border-2 ${ritualStep >= 1 ? 'bg-amber-400 border-amber-400' : 'bg-[#2a1810] border-[#3d2817]'}`} />
              <div className={`w-3 h-3 border-2 ${ritualStep >= 2 ? 'bg-amber-400 border-amber-400' : 'bg-[#2a1810] border-[#3d2817]'}`} />
              <div className={`w-3 h-3 border-2 ${ritualStep >= 3 ? 'bg-amber-400 border-amber-400' : 'bg-[#2a1810] border-[#3d2817]'}`} />
            </div>

            {/* Step 1: Duration Selection */}
            {ritualStep === 1 && (
              <div className="text-center">
                <h2 className="text-lg text-amber-400 mb-4">
                  ¿CUÁL ES TU OFRENDA?
                </h2>
                <p className="text-xs text-[#8b7355] mb-6">
                  Elige la duración de tu ritual de enfoque
                </p>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedDuration(opt.value)}
                      className={`btn-pixel px-4 py-3 text-sm ${
                        selectedDuration === opt.value
                          ? 'border-2 border-amber-400 bg-amber-600'
                          : 'border-2 border-[#3d2817] bg-[#1a1008] hover:bg-[#241810]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBackToMenu}
                    className="flex-1 btn-pixel border-2 border-[#3d2817] bg-[#1a1008] hover:bg-[#241810] text-[#8b7355] text-sm px-4 py-3"
                  >
                    VOLVER
                  </button>
                  <button
                    onClick={handleStep1Continue}
                    disabled={!selectedDuration}
                    className={`flex-1 btn-pixel text-sm px-4 py-3 ${
                      selectedDuration
                        ? 'border-2 border-green-400 bg-green-600 hover:bg-green-500 text-white'
                        : 'border-2 border-[#3d2817] bg-[#241810] text-[#5c4a3d] cursor-not-allowed'
                    }`}
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Domain Selection */}
            {ritualStep === 2 && (
              <div className="text-center">
                <h2 className="text-lg text-amber-400 mb-4">
                  ¿QUÉ DOMINIO DESEAS CONQUISTAR?
                </h2>
                <p className="text-xs text-[#8b7355] mb-6">
                  Selecciona la materia que enfrentarás
                </p>

                {domains.length === 0 ? (
                  <div className="p-4 border-2 border-[#3d2817] bg-[#1a1008] mb-6">
                    <p className="text-[#8b7355] text-sm mb-4">
                      No has invocado ningún dominio aún.
                    </p>
                    <button
                      onClick={() => onNavigate('domains')}
                      className="btn-pixel border-4 border-amber-400 bg-amber-600 hover:bg-amber-500 text-white text-sm px-6 py-3 w-full"
                    >
                      📜 IR A DOMINIOS Y CREAR EL PRIMERO
                    </button>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border-2 border-[#3d2817] bg-[#0f0804] mb-6">
                    {domains.map((domain) => (
                      <button
                        key={domain.id}
                        onClick={() => setSelectedDomainId(domain.id)}
                        className={`w-full p-3 text-left border-b border-[#2a1810] ${
                          selectedDomainId === domain.id
                            ? 'bg-amber-900/30'
                            : 'hover:bg-[#1a1008]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">{domain.name}</span>
                          <span className="text-xs text-[#5c4a3d]">
                            {domain.currentDebtMins <= 0 ? (
                              <span className="text-[#5c4a3d]">✓ DERROTADO</span>
                            ) : (
                              `${domain.currentDebtMins} min deuda`
                            )}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setRitualStep(1)}
                    className="flex-1 btn-pixel border-2 border-[#3d2817] bg-[#1a1008] hover:bg-[#241810] text-[#8b7355] text-sm px-4 py-3"
                  >
                    ATRÁS
                  </button>
                  <button
                    onClick={handleStep2Continue}
                    disabled={!selectedDomainId || domains.length === 0}
                    className={`flex-1 btn-pixel text-sm px-4 py-3 ${
                      selectedDomainId && domains.length > 0
                        ? 'border-2 border-green-400 bg-green-600 hover:bg-green-500 text-white'
                        : 'border-2 border-[#3d2817] bg-[#241810] text-[#5c4a3d] cursor-not-allowed'
                    }`}
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Beast Selection */}
            {ritualStep === 3 && (
              <div className="relative">
                {/* Background Preview of Selected Beast */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
                  style={{ backgroundImage: `url(${BEASTS[selectedBeastId as keyof typeof BEASTS]?.bgImg})` }}
                />
                <div className="absolute inset-0 bg-stone-900/80 pointer-events-none" />

                <div className="relative z-10 text-center">
                  <h2 className="text-lg text-amber-400 mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    ¿A QUÉ BESTIA TE ENFRENTARÁS?
                  </h2>
                  <p className="text-xs text-stone-400 mb-6">
                    Elige tu adversario para este ritual
                  </p>

                  {/* Selected Beast Preview */}
                  <div className="mb-6 p-4 border-4 border-amber-400 bg-stone-950/90 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {/* Boss Sprite Preview */}
                      <div className="w-32 h-32 bg-stone-900 border-4 border-stone-700 flex items-center justify-center overflow-hidden">
                        <img
                          src={BEASTS[selectedBeastId as keyof typeof BEASTS]?.spriteImg}
                          alt={BEASTS[selectedBeastId as keyof typeof BEASTS]?.name}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      {/* Boss Info */}
                      <div className="text-left">
                        <h3 className="text-xl text-amber-400 font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                          {BEASTS[selectedBeastId as keyof typeof BEASTS]?.name}
                        </h3>
                        <p className="text-xs text-stone-400 mt-2 italic">
                          {BEASTS[selectedBeastId as keyof typeof BEASTS]?.lore}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Boss Selection Grid */}
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 max-h-64 overflow-y-auto p-3 border-2 border-stone-800 bg-stone-950/90">
                    {Object.values(BEASTS).map((beast) => (
                      <button
                        key={beast.id}
                        onClick={() => setSelectedBeastId(beast.id)}
                        className={`p-2 border-4 transition-all flex flex-col items-center ${
                          selectedBeastId === beast.id
                            ? 'border-amber-400 bg-amber-900/40 scale-110 shadow-[2px_2px_0_0_rgba(251,191,36,1)]'
                            : 'border-stone-700 bg-stone-900 hover:border-stone-500'
                        }`}
                      >
                        {/* Boss Mini Sprite */}
                        <div className="w-12 h-12 bg-stone-900 border-2 border-stone-800 flex items-center justify-center overflow-hidden mb-1">
                          <img
                            src={beast.spriteImg}
                            alt={beast.name}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        {/* Boss Name */}
                        <p className="text-xs text-white font-bold">{beast.name}</p>
                      </button>
                    ))}
                  </div>

                  {/* Ritual Summary */}
                  <div className="p-3 border-2 border-stone-700 bg-stone-950/90 mb-6 text-left">
                    <p className="text-xs text-stone-400 mb-1">RESUMEN DEL RITUAL:</p>
                    <p className="text-sm text-white">
                      ⏱️ {selectedDuration} min —
                      📜 {domains.find(d => d.id === selectedDomainId)?.name} —
                      ⚔️ {BEASTS[selectedBeastId as keyof typeof BEASTS]?.name}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setRitualStep(2)}
                      className="flex-1 btn-pixel border-2 border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-400 text-sm px-4 py-3"
                    >
                      ATRÁS
                    </button>
                    <button
                      onClick={handleConfirmRitual}
                      className="flex-1 btn-pixel border-2 border-red-400 bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-3"
                    >
                      🔥 COMENZAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
