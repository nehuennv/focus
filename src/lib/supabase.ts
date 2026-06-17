import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Falla temprano y claro si faltan las env vars (ej. deploy sin configurar)
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisá tu archivo .env.local',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Tipos de la base de datos (espejo del esquema SQL) ───────────────────────

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_beast: string;
  char_class: string | null;
  starting_item: string | null;
  lore: string | null;
  total_mins: number;
  rank_index: number;
  created_at: string;
}
