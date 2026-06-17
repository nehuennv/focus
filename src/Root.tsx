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
      .then(t => { addTournamentDomain({ id: t.id, name: t.name, beastId: t.beast_id, code: t.invite_code }); sfx.success(); })
      .catch(() => { /* código inválido: igual abrimos Torneos */ })
      .finally(() => setShowTournaments(true));
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
    </>
  );
}
