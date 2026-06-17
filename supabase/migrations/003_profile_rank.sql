-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 003: Rango en perfil + ranking con rango
-- Pegá TODO en: Supabase → SQL Editor → New query → Run. Re-ejecutable.
-- ════════════════════════════════════════════════════════════════════════════

-- Rango (rankIndex del juego) en el perfil, para mostrar nivel a los demás.
alter table public.profiles add column if not exists rank_index integer not null default 0;

-- Vista de ranking: incluir rango para mostrarlo en la lista.
drop view if exists public.tournament_leaderboard;
create view public.tournament_leaderboard
  with (security_invoker = true) as
  select m.tournament_id, m.user_id, m.total_mins, m.joined_at,
         p.display_name, p.avatar_beast, p.char_class, p.rank_index
  from public.tournament_members m
  join public.profiles p on p.id = m.user_id;

grant select on public.tournament_leaderboard to authenticated;
