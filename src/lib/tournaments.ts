import { supabase } from './supabase';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  beast_id: string;
  owner_id: string;
  invite_code: string;
  ends_at: string | null;
  created_at: string;
}

export interface LeaderboardRow {
  tournament_id: string;
  user_id: string;
  total_mins: number;
  joined_at: string;
  display_name: string;
  avatar_beast: string;
  char_class: string | null;
  rank_index: number;
}

// Crea un torneo (el owner se auto-une vía trigger). Devuelve el torneo creado.
export async function createTournament(name: string, beastId: string, endsAt: string | null): Promise<Tournament> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error('No hay sesión');
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ name: name.trim(), beast_id: beastId, ends_at: endsAt, owner_id: uid })
    .select()
    .single();
  if (error) throw error;
  return data as Tournament;
}

// Une al usuario por código de invitación. Devuelve el torneo.
export async function joinTournament(code: string): Promise<Tournament> {
  const { data, error } = await supabase.rpc('join_tournament', { code: code.trim() });
  if (error) throw error;
  return data as Tournament;
}

// Torneos a los que pertenezco.
export async function getMyTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tournament[];
}

// Ranking de un torneo, ordenado por minutos desc.
export async function getLeaderboard(tournamentId: string): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('tournament_leaderboard')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('total_mins', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

// Suma minutos a mi membresía (fire-and-forget desde el juego).
export async function addTournamentMins(tournamentId: string, mins: number): Promise<void> {
  if (mins <= 0) return;
  await supabase.rpc('add_tournament_mins', { tid: tournamentId, mins: Math.round(mins) });
}

// Link de invitación absoluto (respeta el base de la app).
export function inviteLink(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?join=${code}`;
}
