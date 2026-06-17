import { useState } from 'react';
import { BEASTS } from '../store/useStore';
import type { ProfileRow } from '../lib/supabase';

const FONT = '"Press Start 2P", monospace';

// HUD flotante: muestra el iniciado logueado y permite cerrar sesión.
// Discreto en una esquina; se expande al pasar el mouse.
export function PlayerHud({ profile, onSignOut }: {
  profile: ProfileRow; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const beast = BEASTS[profile.avatar_beast as keyof typeof BEASTS] ?? BEASTS.maro;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 9999,
        fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', background: 'rgba(10,5,4,0.92)',
        border: `2px solid ${open ? '#d97706' : '#2a1810'}`,
        boxShadow: open ? '0 0 16px rgba(217,119,6,0.3), 3px 3px 0 #000' : '3px 3px 0 #000',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'default', maxWidth: open ? 260 : 160,
      }}
    >
      <img src={`/${beast.spriteImg}`} alt={beast.name}
        style={{ width: 26, height: 26, imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, filter: `drop-shadow(0 0 4px ${beast.color}aa)` }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 8, color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.display_name}</div>
        <div style={{ fontSize: 6, color: '#6b5040', marginTop: 3, letterSpacing: '0.08em' }}>{profile.char_class?.toUpperCase()}</div>
      </div>
      {open && (
        <button
          onClick={onSignOut}
          style={{
            flexShrink: 0, fontFamily: FONT, fontSize: 6, padding: '6px 8px',
            background: '#160404', color: '#f87171', border: '2px solid #7f1d1d',
            cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap',
          }}
        >
          SALIR
        </button>
      )}
    </div>
  );
}
