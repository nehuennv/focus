import { useEffect, useState } from 'react';
import { BEASTS, getRankDisplay } from '../store/useStore';
import { getProfile } from '../lib/sync';
import { classById, itemById } from '../lib/lore';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sfx';
import type { ProfileRow } from '../lib/supabase';

const FONT = '"Press Start 2P", monospace';

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

// Ficha de perfil de un participante: rango, clase, reliquia, horas, lore.
export function ProfileCard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProfile(userId).then(p => { if (active) { setProfile(p); setLoading(false); } });
    return () => { active = false; };
  }, [userId]);

  const beast = profile ? (BEASTS[profile.avatar_beast as keyof typeof BEASTS] ?? BEASTS.maro) : null;
  const rank = profile ? getRankDisplay(profile.rank_index) : null;
  const cls = classById(profile?.char_class);
  const item = itemById(profile?.starting_item);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,2,1,0.9)', backdropFilter: 'blur(5px)', fontFamily: FONT, padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, border: '2px solid #92400e', background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 50px rgba(146,64,14,0.25)',
      }}>
        {loading || !profile || !beast || !rank ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 9, color: '#6b5040' }}>INVOCANDO...</div>
        ) : (
          <>
            {/* Cabecera con sello */}
            <div style={{ position: 'relative', overflow: 'hidden', padding: '24px 22px', borderBottom: `2px solid ${rank.era.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
              {beast.bgImg && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${asset(beast.bgImg)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.14 }} />
              )}
              <img src={asset(beast.spriteImg)} alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, position: 'relative', filter: `drop-shadow(0 0 8px ${beast.color}aa)` }} />
              <div style={{ position: 'relative', minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8, textShadow: '2px 2px 0 #000', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.display_name}</div>
                <div style={{ fontSize: 8, color: rank.era.color, letterSpacing: '0.08em' }}>{rank.era.icon} {rank.fullTitle}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row label="HORAS DE FOCO" value={fmtMins(profile.total_mins)} />
              {profile.tournament_wins > 0 && <Row label="TORNEOS GANADOS" value={`🏆 ${profile.tournament_wins}`} />}
              {cls && <Row label="CLASE" value={`${cls.icon} ${cls.name}`} />}
              {item && <Row label="RELIQUIA" value={`${item.icon} ${item.name}`} />}
              {profile.lore && (
                <div>
                  <div style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.2em', marginBottom: 8 }}>JURAMENTO</div>
                  <p style={{ fontSize: 8, color: '#a8865a', fontStyle: 'italic', lineHeight: 1.9, borderLeft: '2px solid #2a1810', paddingLeft: 12 }}>"{profile.lore}"</p>
                </div>
              )}
            </div>

            <div style={{ padding: '0 22px 20px' }}>
              <button onClick={() => { sfx.click(); onClose(); }} style={{
                width: '100%', padding: 12, fontFamily: FONT, fontSize: 9, background: '#0f0804',
                color: '#8b7355', border: '2px solid #2a1810', cursor: 'pointer', boxShadow: '3px 3px 0 #000',
              }}>CERRAR</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 7, color: '#8b7355', letterSpacing: '0.15em' }}>{label}</span>
      <span style={{ fontSize: 9, color: '#ede0c8', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
