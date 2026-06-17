-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 005: gestión de torneo, premios y feed social
-- Pegá TODO en: Supabase → SQL Editor → New query → Run. Re-ejecutable.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Salir de un torneo: borrar la propia membresía ───────────────────────────
drop policy if exists tm_delete on public.tournament_members;
create policy tm_delete on public.tournament_members for delete to authenticated
  using (user_id = auth.uid());

-- ── Premios persistentes ─────────────────────────────────────────────────────
alter table public.profiles    add column if not exists tournament_wins integer not null default 0;
alter table public.tournaments  add column if not exists winner_id uuid references auth.users(id);
alter table public.tournaments  add column if not exists finalized boolean not null default false;

-- Finaliza un torneo cerrado: marca ganador y suma su trofeo (idempotente).
create or replace function public.finalize_tournament(tid uuid)
returns public.tournaments language plpgsql security definer set search_path = public as $$
declare t public.tournaments; w uuid;
begin
  select * into t from tournaments where id = tid;
  if t.id is null then raise exception 'Torneo no encontrado'; end if;
  if t.finalized then return t; end if;
  if t.ends_at is null or t.ends_at > now() then return t; end if;  -- aún abierto
  select user_id into w from tournament_members
    where tournament_id = tid order by total_mins desc, joined_at asc limit 1;
  update tournaments set finalized = true, winner_id = w where id = tid returning * into t;
  if w is not null then
    update profiles set tournament_wins = tournament_wins + 1 where id = w;
  end if;
  return t;
end; $$;

-- ── Feed social (crónicas del torneo) ────────────────────────────────────────
create table if not exists public.tournament_events (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  text          text not null,
  mins          integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.tournament_events enable row level security;

drop policy if exists te_select on public.tournament_events;
create policy te_select on public.tournament_events for select to authenticated
  using (public.is_tournament_member(tournament_id));

drop policy if exists te_insert on public.tournament_events;
create policy te_insert on public.tournament_events for insert to authenticated
  with check (user_id = auth.uid() and public.is_tournament_member(tournament_id));

-- Realtime para el feed.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tournament_events'
  ) then
    alter publication supabase_realtime add table public.tournament_events;
  end if;
end $$;
