import { useState } from 'react';
import { BEASTS, getRankDisplay } from '../store/useStore';
import type { ProfileRow } from '../lib/supabase';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sfx';
import { BestiaryScreen } from './BestiaryScreen';
import { ProfileCard } from './ProfileCard';

const FONT = '"Press Start 2P", monospace';

// HUD flotante: iniciado logueado, rango, acceso al Bestiario y logout.
export function PlayerHud({ profile, onSignOut }: {
  profile: ProfileRow; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const beast = BEASTS[profile.avatar_beast as keyof typeof BEASTS] ?? BEASTS.maro;
  const rank = getRankDisplay(profile.rank_index);

  return (
    <>
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 9000,
          fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', background: 'rgba(10,5,4,0.92)',
          border: `2px solid ${open ? '#d97706' : '#2a1810'}`,
          boxShadow: open ? '0 0 16px rgba(217,119,6,0.3), 3px 3px 0 #000' : '3px 3px 0 #000',
          transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'default',
        }}
      >
        <img src={asset(beast.spriteImg)} alt={beast.name} title="Ver mi ficha"
          onClick={() => { sfx.click(); setShowProfile(true); }}
          style={{ width: 26, height: 26, imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, cursor: 'pointer', filter: `drop-shadow(0 0 4px ${beast.color}aa)` }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 8, color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{profile.display_name}</div>
          <div style={{ fontSize: 6, color: rank.era.color, marginTop: 3, letterSpacing: '0.08em' }}>{rank.era.icon} {rank.fullTitle}</div>
        </div>
        {open && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { sfx.click(); setShowBestiary(true); }} onMouseEnter={() => sfx.hover()} style={hudBtn('#d97706', '#fbbf24', '#1c0e00')}>
              📖 BESTIARIO
            </button>
            <button onClick={() => { sfx.click(); onSignOut(); }} style={hudBtn('#7f1d1d', '#f87171', '#160404')}>
              SALIR
            </button>
          </div>
        )}
      </div>

      {showBestiary && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, overflowY: 'auto', background: '#070402' }}>
          <BestiaryScreen onBackToMenu={() => { sfx.click(); setShowBestiary(false); }} />
        </div>
      )}

      {showProfile && <ProfileCard userId={profile.id} onClose={() => setShowProfile(false)} />}
    </>
  );
}

const hudBtn = (border: string, color: string, bg: string): React.CSSProperties => ({
  flexShrink: 0, fontFamily: FONT, fontSize: 6, padding: '7px 9px',
  background: bg, color, border: `2px solid ${border}`, cursor: 'pointer',
  letterSpacing: '0.06em', whiteSpace: 'nowrap',
});
