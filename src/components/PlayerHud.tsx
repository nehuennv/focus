import { useState, useEffect } from 'react';
import { BEASTS } from '../store/useStore';
import type { ProfileRow } from '../lib/supabase';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sfx';
import { TournamentsScreen } from './TournamentsScreen';
import { joinTournament } from '../lib/tournaments';

const FONT = '"Press Start 2P", monospace';

// HUD flotante: iniciado logueado, acceso a Torneos y logout.
export function PlayerHud({ profile, onSignOut }: {
  profile: ProfileRow; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showTournaments, setShowTournaments] = useState(false);
  const beast = BEASTS[profile.avatar_beast as keyof typeof BEASTS] ?? BEASTS.maro;

  // Link de invitación: ?join=CODE → une y abre Torneos.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (!code) return;
    // Limpia el query para no re-unir en cada reload.
    params.delete('join');
    const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', clean);
    joinTournament(code)
      .then(() => { sfx.success(); setShowTournaments(true); })
      .catch(() => { setShowTournaments(true); });
  }, []);

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
        <img src={asset(beast.spriteImg)} alt={beast.name}
          style={{ width: 26, height: 26, imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, filter: `drop-shadow(0 0 4px ${beast.color}aa)` }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 8, color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{profile.display_name}</div>
          <div style={{ fontSize: 6, color: '#6b5040', marginTop: 3, letterSpacing: '0.08em' }}>{profile.char_class?.toUpperCase()}</div>
        </div>
        {open && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { sfx.click(); setShowTournaments(true); }} onMouseEnter={() => sfx.hover()} style={hudBtn('#d97706', '#fbbf24', '#1c0e00')}>
              ⚔ TORNEOS
            </button>
            <button onClick={() => { sfx.click(); onSignOut(); }} style={hudBtn('#7f1d1d', '#f87171', '#160404')}>
              SALIR
            </button>
          </div>
        )}
      </div>

      {showTournaments && <TournamentsScreen userId={profile.id} onClose={() => setShowTournaments(false)} />}
    </>
  );
}

const hudBtn = (border: string, color: string, bg: string): React.CSSProperties => ({
  flexShrink: 0, fontFamily: FONT, fontSize: 6, padding: '7px 9px',
  background: bg, color, border: `2px solid ${border}`, cursor: 'pointer',
  letterSpacing: '0.06em', whiteSpace: 'nowrap',
});
