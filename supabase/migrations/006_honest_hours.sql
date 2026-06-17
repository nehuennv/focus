-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 006: horas honestas (anti-trampa server-side)
-- Pegá TODO en: Supabase → SQL Editor → New query → Run. Re-ejecutable.
--
-- Idea: el crédito de minutos a un torneo se topea al TIEMPO REAL transcurrido
-- desde el último crédito (reloj del servidor). Un cliente no puede inflar horas
-- editando su localStorage: now() lo decide Postgres, no el navegador.
-- ════════════════════════════════════════════════════════════════════════════

-- Marca temporal del último crédito por membresía.
alter table public.tournament_members add column if not exists last_credit_at timestamptz;

-- Reemplaza add_tournament_mins por una versión validada por tiempo real.
drop function if exists public.add_tournament_mins(uuid, integer);

create or replace function public.add_tournament_mins(tid uuid, mins integer)
returns integer language plpgsql security definer set search_path = public as $$
declare
  m record;
  elapsed_min integer;
  credited integer;
begin
  select * into m from tournament_members
    where tournament_id = tid and user_id = auth.uid();
  if m.user_id is null then return 0; end if;

  -- Minutos reales transcurridos desde el último crédito (o desde que se unió),
  -- con un pequeño margen de gracia para redondeos.
  elapsed_min := floor(extract(epoch from (now() - coalesce(m.last_credit_at, m.joined_at))) / 60)::int + 2;

  -- Acredita lo pedido, pero nunca más que el tiempo real disponible.
  credited := least(greatest(mins, 0), greatest(elapsed_min, 0));

  update tournament_members
    set total_mins = total_mins + credited, last_credit_at = now()
    where tournament_id = tid and user_id = auth.uid();

  return credited;
end; $$;
