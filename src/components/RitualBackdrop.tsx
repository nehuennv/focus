// Fondo ritual reutilizable: glow ambiente + vignette + scanlines + embers
// flotantes. Mismo lenguaje visual que el TitleScreen / Portal Oscuro.

const EMBERS = [
  { left: '8%', top: '78%', delay: '0s', dur: '7s' },
  { left: '20%', top: '88%', delay: '1.4s', dur: '9s' },
  { left: '34%', top: '82%', delay: '0.6s', dur: '8s' },
  { left: '50%', top: '90%', delay: '2.1s', dur: '6.5s' },
  { left: '66%', top: '84%', delay: '0.3s', dur: '10s' },
  { left: '80%', top: '79%', delay: '3.2s', dur: '7.5s' },
  { left: '92%', top: '86%', delay: '1.8s', dur: '8.5s' },
];

export function RitualBackdrop() {
  return (
    <>
      {/* Ambient radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 80% 60% at 50% 42%, rgba(180,120,10,0.12) 0%, transparent 70%),' +
          'radial-gradient(ellipse 40% 30% at 50% 30%, rgba(251,191,36,0.08) 0%, transparent 60%)',
        animation: 'rb-ambient 5s ease-in-out infinite',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse 95% 85% at 50% 50%, transparent 45%, rgba(3,2,2,0.85) 100%)',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.09) 3px, rgba(0,0,0,0.09) 4px)',
      }} />

      {/* Chromatic edge lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 3, pointerEvents: 'none', background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.4) 40%, rgba(146,64,14,0.4) 60%, transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 3, pointerEvents: 'none', background: 'linear-gradient(to right, transparent, rgba(146,64,14,0.4) 40%, rgba(146,64,14,0.4) 60%, transparent)' }} />

      {/* Floating embers */}
      {EMBERS.map((e, i) => (
        <div key={i} style={{
          position: 'absolute', left: e.left, top: e.top, width: 3, height: 3, borderRadius: '50%',
          background: '#fbbf24', boxShadow: '0 0 6px #f59e0b', pointerEvents: 'none', zIndex: 2,
          animation: `rb-ember ${e.dur} ${e.delay} ease-in infinite`,
        }} />
      ))}

      <style>{`
        @keyframes rb-ambient { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes rb-ember {
          0%{transform:translateY(0) scale(1);opacity:0}
          10%{opacity:1} 80%{opacity:0.6}
          100%{transform:translateY(-70vh) scale(0.3);opacity:0}
        }
        @keyframes rb-breathe {
          0%,100%{text-shadow:0 0 40px rgba(251,191,36,0.45), 4px 4px 0 #000, 2px 2px 0 rgba(120,60,0,0.8)}
          50%{text-shadow:0 0 70px rgba(251,191,36,0.8), 4px 4px 0 #000, 2px 2px 0 rgba(120,60,0,0.8)}
        }
        @keyframes rb-throb {
          0%,100%{box-shadow:0 0 16px rgba(217,119,6,0.3), 4px 4px 0 #000}
          50%{box-shadow:0 0 30px rgba(217,119,6,0.55), 4px 4px 0 #000}
        }
        @keyframes rb-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

// Título FOCUS / SOULS con separador, reutilizable.
export function RitualTitle({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative', zIndex: 10 }}>
      <div style={{
        fontSize: 30, color: '#fbbf24', letterSpacing: '0.16em', lineHeight: 1,
        animation: 'rb-breathe 4s ease-in-out infinite',
      }}>FOCUS</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px auto', width: 240 }}>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, #92400e 30%, #d97706 70%, transparent)' }} />
        <span style={{ fontSize: 6, color: '#8b7355', letterSpacing: '0.35em', whiteSpace: 'nowrap' }}>RITUAL OF DEBT</span>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(to left, transparent, #92400e 30%, #d97706 70%, transparent)' }} />
      </div>

      <div style={{
        fontSize: 30, color: '#f59e0b', letterSpacing: '0.16em', lineHeight: 1,
        textShadow: '0 0 40px rgba(245,158,11,0.5), 4px 4px 0 #000, 2px 2px 0 rgba(100,50,0,0.8)',
      }}>SOULS</div>

      <div style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.3em', marginTop: 18 }}>⸺ {subtitle} ⸺</div>
    </div>
  );
}
