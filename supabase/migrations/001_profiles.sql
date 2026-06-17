-- ════════════════════════════════════════════════════════════════════════════
-- Focus Souls — Migración 001: Perfiles (Fase 1)
-- Pegá TODO este archivo en: Supabase → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tabla de perfiles (1 fila por usuario de auth) ───────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Anónimo',
  avatar_beast  text not null default 'maro',
  char_class    text,
  starting_item text,
  lore          text,
  total_mins    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Si la tabla ya existía de una corrida previa, agrega las columnas nuevas
-- (idempotente: re-ejecutar este archivo es seguro).
alter table public.profiles add column if not exists starting_item text;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Todos los usuarios autenticados pueden LEER perfiles (para rankings/grupos).
drop policy if exists "perfiles visibles para autenticados" on public.profiles;
create policy "perfiles visibles para autenticados"
  on public.profiles for select
  to authenticated
  using (true);

-- Cada usuario solo puede MODIFICAR su propio perfil.
drop policy if exists "editar propio perfil" on public.profiles;
create policy "editar propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert del propio perfil (respaldo; normalmente lo crea el trigger de abajo).
drop policy if exists "crear propio perfil" on public.profiles;
create policy "crear propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ── Trigger: crear perfil automáticamente al registrarse ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
