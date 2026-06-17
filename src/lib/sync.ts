import { supabase } from './supabase';
import type { ProfileRow } from './supabase';

// Sincroniza horas totales + rango del jugador al perfil online (fire-and-forget).
export async function syncProfileStats(totalMins: number, rankIndex: number): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await supabase.from('profiles')
      .update({ total_mins: Math.round(totalMins), rank_index: rankIndex })
      .eq('id', uid);
  } catch {
    // sin red / sin sesión — ignorar
  }
}

// Trae el perfil completo de cualquier usuario (RLS permite leer perfiles).
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}
