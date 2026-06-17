import { useAuth } from './auth/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { PlayerHud } from './components/PlayerHud';
import App from './App';

const FONT = '"Press Start 2P", monospace';

// Punto de entrada: decide entre login, onboarding de perfil y el juego.
export function Root() {
  const { loading, session, profile, refreshProfile, signOut } = useAuth();

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
      <App />
      <PlayerHud profile={profile} onSignOut={signOut} />
    </>
  );
}
