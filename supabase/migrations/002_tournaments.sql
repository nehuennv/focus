-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 002: Torneos (Fase 2)
-- Pegá TODO en: Supabase → SQL Editor → New query → Run. Es re-ejecutable.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Torneos ──────────────────────────────────────────────────────────────────
create table if not exists public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  beast_id    text not null default 'aurelian',   -- bestia que representa al torneo
  owner_id    uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  ends_at     timestamptz,                         -- fecha del parcial (opcional)
  created_at  timestamptz not null default now()
);

-- ── Miembros ─────────────────────────────────────────────────────────────────
create table if not exists public.tournament_members (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  total_mins    integer not null default 0,        -- mins asignados a este torneo
  joined_at     timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

-- ── Helper: ¿soy miembro? (security definer evita recursión de RLS) ───────────
create or replace function public.is_tournament_member(tid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from tournament_members
    where tournament_id = tid and user_id = auth.uid()
  );
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.tournaments enable row level security;
alter table public.tournament_members enable row level security;

drop policy if exists t_select on public.tournaments;
create policy t_select on public.tournaments for select to authenticated
  using (owner_id = auth.uid() or public.is_tournament_member(id));

drop policy if exists t_insert on public.tournaments;
create policy t_insert on public.tournaments for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists t_update on public.tournaments;
create policy t_update on public.tournaments for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists t_delete on public.tournaments;
create policy t_delete on public.tournaments for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists tm_select on public.tournament_members;
create policy tm_select on public.tournament_members for select to authenticated
  using (public.is_tournament_member(tournament_id));

drop policy if exists tm_insert on public.tournament_members;
create policy tm_insert on public.tournament_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists tm_update on public.tournament_members;
create policy tm_update on public.tournament_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Owner se auto-une al crear ───────────────────────────────────────────────
create or replace function public.handle_new_tournament()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into tournament_members (tournament_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_tournament_created on public.tournaments;
create trigger on_tournament_created after insert on public.tournaments
  for each row execute function public.handle_new_tournament();

-- ── Unirse por código (security definer: un no-miembro puede entrar) ──────────
create or replace function public.join_tournament(code text)
returns public.tournaments language plpgsql security definer set search_path = public as $$
declare t public.tournaments;
begin
  select * into t from tournaments where invite_code = code;
  if t.id is null then
    raise exception 'Torneo no encontrado';
  end if;
  insert into tournament_members (tournament_id, user_id)
  values (t.id, auth.uid())
  on conflict do nothing;
  return t;
end; $$;

-- ── Sumar minutos a mi membresía ─────────────────────────────────────────────
create or replace function public.add_tournament_mins(tid uuid, mins integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tournament_members
  set total_mins = total_mins + greatest(mins, 0)
  where tournament_id = tid and user_id = auth.uid();
end; $$;

-- ── Vista de ranking (security_invoker: respeta RLS de los miembros) ──────────
drop view if exists public.tournament_leaderboard;
create view public.tournament_leaderboard
  with (security_invoker = true) as
  select m.tournament_id, m.user_id, m.total_mins, m.joined_at,
         p.display_name, p.avatar_beast, p.char_class
  from public.tournament_members m
  join public.profiles p on p.id = m.user_id;

grant select on public.tournament_leaderboard to authenticated;
