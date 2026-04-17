import { useState, useEffect } from 'react';

interface RestScreenProps {
  onFinish: () => void;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function RestScreen({ onFinish }: RestScreenProps) {
  const [timeLeft, setTimeLeft] = useState(300);

  const playBonefireSound = () => {
    const audio = new Audio(`${import.meta.env.BASE_URL}sounds/bonefire.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    playBonefireSound();

    return () => {};
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          new Audio(`${import.meta.env.BASE_URL}sounds/bell.mp3`).play().catch(() => {});
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: '#0a0504',
        backgroundImage: 'radial-gradient(ellipse at 50% 60%, rgba(180,80,0,0.12) 0%, transparent 55%)',
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      {/* Top label */}
      <p
        className="text-[7px] tracking-[0.3em] mb-2"
        style={{ color: '#5c4a3d', animation: 'seal-breathe 3s ease-in-out infinite' }}
      >
        ⸺ RITUAL CONCLUIDO ⸺
      </p>

      {/* Title */}
      <h1
        className="text-[14px] md:text-[18px] mb-2 tracking-widest drop-shadow-[2px_2px_0_#000]"
        style={{ color: '#fbbf24', animation: 'ember-pulse 3s ease-in-out infinite' }}
      >
        LA FOGATA
      </h1>

      <p className="text-[7px] mb-10 tracking-widest" style={{ color: '#8b7355' }}>
        DESCANSA, MAESTRO
      </p>

      {/* Timer */}
      <div
        className="mb-8 px-8 py-4"
        style={{
          border: '2px solid #3a2000',
          background: '#09050000',
        }}
      >
        <p
          className="text-[40px] md:text-[56px] drop-shadow-[3px_3px_0_#000]"
          style={{ color: '#d97706', letterSpacing: '0.05em' }}
        >
          {fmt(timeLeft)}
        </p>
      </div>

      {/* Bonefire GIF */}
      <div className="mb-10">
        <img
          src={`${import.meta.env.BASE_URL}img/bonefire.gif`}
          alt="Fogata"
          style={{
            width: 180,
            height: 180,
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 20px rgba(180,80,0,0.4))',
          }}
        />
      </div>

      {/* Divider */}
      <div
        className="mb-8"
        style={{
          height: 1,
          width: 200,
          background: 'linear-gradient(to right, transparent, #3a2000, transparent)',
        }}
      />

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setTimeLeft(prev => prev + 300);
            playBonefireSound();
          }}
          className="btn-pixel text-[8px] px-5 py-3"
          style={{ borderColor: '#14532d', background: '#05150a', color: '#4ade80' }}
        >
          + 5 MIN
        </button>
        <button
          onClick={onFinish}
          className="btn-pixel text-[8px] px-5 py-3"
          style={{ borderColor: '#3d2817', background: '#0f0804', color: '#8b7355' }}
        >
          CONTINUAR
        </button>
      </div>

      {/* Bottom whisper */}
      <p
        className="mt-10 text-[6px] tracking-widest"
        style={{ color: '#3d2817', animation: 'seal-breathe 4s ease-in-out infinite' }}
      >
        El fuego se desvanece. El camino espera.
      </p>
    </div>
  );
}
