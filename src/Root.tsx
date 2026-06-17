import { useState, useEffect } from 'react';
import { useAuth } from './auth/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { PlayerHud } from './components/PlayerHud';
import { TournamentsScreen } from './components/TournamentsScreen';
import { joinTournament } from './lib/tournaments';
import { syncProfileStats } from './lib/sync';
import { useStore } from './store/useStore';
import { sfx } from './lib/sfx';
import App from './App';

const FONT = '"Press Start 2P", monospace';

// Punto de entrada: decide entre login, onboarding de perfil y el juego.
export function Root() {
  const { loading, session, profile, refreshProfile, signOut } = useAuth();
  const [showTournaments, setShowTournaments] = useState(false);
  const [justJoined, setJustJoined] = useState<string | null>(null);
  const addTournamentDomain = useStore(s => s.addTournamentDomain);

  const ready = !!session && !!profile?.char_class;

  // Al entrar: empuja horas + rango locales al perfil online (sincroniza progreso previo).
  useEffect(() => {
    if (!ready) return;
    const p = useStore.getState().player;
    void syncProfileStats(p.totalAccumulatedMins, p.rankIndex);
  }, [ready]);

  // Link de invitación: ?join=CODE → une, crea el dominio y abre Torneos.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (!code) return;
    params.delete('join');
    const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', clean);
    joinTournament(code)
      .then(t => {
        addTournamentDomain({ id: t.id, name: t.name, beastId: t.beast_id, code: t.invite_code });
        sfx.success();
        setJustJoined(t.name);
      })
      .catch(() => setShowTournaments(true)); // código inválido: abrimos Torneos igual
  }, [ready, addTournamentDomain]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050302', fontFamily: FONT, fontSize: 10, color: '#8b7355', letterSpacing: '0.2em',
      }}>
        INVOCANDO...
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  // Perfil sin clase asignada = onboarding pendiente.
  if (!profile || !profile.char_class) {
    return <ProfileSetup profile={profile} userId={session.user.id} onDone={refreshProfile} />;
  }

  return (
    <>
      <App onOpenTournaments={() => setShowTournaments(true)} />
      <PlayerHud profile={profile} onSignOut={signOut} />
      {showTournaments && (
        <TournamentsScreen userId={profile.id} onClose={() => setShowTournaments(false)} />
      )}
      {justJoined && (
        <JoinedModal
          name={justJoined}
          onSeeRanking={() => { setJustJoined(null); setShowTournaments(true); }}
          onClose={() => setJustJoined(null)}
        />
      )}
    </>
  );
}

// Modal de bienvenida al entrar a un torneo por link.
function JoinedModal({ name, onSeeRanking, onClose }: { name: string; onSeeRanking: () => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,2,1,0.92)', backdropFilter: 'blur(5px)', fontFamily: FONT, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, textAlign: 'center', border: '2px solid #d97706', background: '#0a0504',
        boxShadow: '8px 8px 0 #000, 0 0 50px rgba(217,119,6,0.35)', padding: '32px 28px',
        animation: 'rb-fadein 0.4s ease-out',
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⚔️</div>
        <div style={{ fontSize: 7, color: '#6b5040', letterSpacing: '0.28em', marginBottom: 12 }}>⸺ TE UNISTE AL GREMIO ⸺</div>
        <div style={{ fontSize: 13, color: '#fbbf24', letterSpacing: '0.08em', textShadow: '2px 2px 0 #000', lineHeight: 1.6, marginBottom: 20 }}>{name}</div>
        <p style={{ fontSize: 8, color: '#a8865a', lineHeight: 1.9, marginBottom: 24 }}>
          Se forjó un dominio para este torneo. Estudiá en él y tus horas contarán al ranking del parcial.
        </p>
        <button onClick={onSeeRanking} onMouseEnter={() => sfx.hover()} style={{
          width: '100%', padding: 14, fontFamily: FONT, fontSize: 10, background: '#1c0e00', color: '#fbbf24',
          border: '2px solid #d97706', cursor: 'pointer', letterSpacing: '0.1em', textShadow: '2px 2px 0 #000',
          boxShadow: '0 0 14px rgba(217,119,6,0.28), 3px 3px 0 #000',
        }}>
          ⚔  VER EL RANKING
        </button>
      </div>
    </div>
  );
}
