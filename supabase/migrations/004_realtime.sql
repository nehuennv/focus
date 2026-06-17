-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 004: Realtime en torneos
-- Pegá TODO en: Supabase → SQL Editor → New query → Run. Re-ejecutable.
-- ════════════════════════════════════════════════════════════════════════════

-- Habilita replicación realtime: al unirse alguien (INSERT) o sumar minutos
-- (UPDATE) en tournament_members, los clientes suscriptos reciben el evento.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tournament_members'
  ) then
    alter publication supabase_realtime add table public.tournament_members;
  end if;
end $$;

-- replica identity full: incluye datos en UPDATE/DELETE para los filtros.
alter table public.tournament_members replica identity full;
