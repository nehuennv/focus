import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type ProfileRow } from '../lib/supabase';

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: ProfileRow | null;
}

// Hook central de autenticación: expone sesión + perfil y se mantiene
// sincronizado con los cambios de auth de Supabase.
export function useAuth() {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, profile: null });

  const loadProfile = useCallback(async (userId: string): Promise<ProfileRow | null> => {
    // maybeSingle: devuelve null sin error si la fila aún no existe (race con el
    // trigger de creación de perfil), en vez de lanzar un 406.
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data ?? null;
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const session = data.session;
      const profile = session ? await loadProfile(session.user.id) : null;
      if (!active) return;
      setState({ loading: false, session, profile });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session ? await loadProfile(session.user.id) : null;
      if (!active) return;
      setState({ loading: false, session, profile });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!state.session) return;
    const profile = await loadProfile(state.session.user.id);
    setState(s => ({ ...s, profile }));
  }, [state.session, loadProfile]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { ...state, refreshProfile, signOut };
}
