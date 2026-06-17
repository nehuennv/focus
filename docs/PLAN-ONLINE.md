# 🗡️ Focus Souls — Plan de Integración Online (Multiplayer + Torneos)

> Objetivo: convertir la app local (localStorage) en una web multiusuario donde amigos
> se loguean, ven horas de foco de cada uno, crean **grupos por link de invitación** y
> compiten en **torneos por parcial** (ej. "PARCIAL ANÁLISIS MATEMÁTICO 2") con ranking
> y premios semanales, con contabilización de horas **confiable (server-side)**.

---

## 0. Decisiones de diseño (cerradas)

- **Sin deuda visible.** Reemplazada por torneos con objetivo opcional.
- **Grupos** = espacios privados con `invite_code` (link). Cualquiera con el link entra.
- **Torneos** = competencia dentro de un grupo, con nombre/materia, fecha inicio y fin.
  Solo cuentan las sesiones dentro de la ventana. Opcional: meta de horas (`target_mins`).
- **Honestidad Nivel 2 (server-side timer + heartbeat).** El servidor mide el tiempo real;
  el cliente NO reporta minutos. Si el navegador se cierra, la sesión se cierra sola.
- **Avatar** = bestia del bestiario actual (lore ya escrito) o clase de Era. Cero arte nuevo.

---

## 1. Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | React + Vite (ya existe) | Reusar todo |
| Auth | Supabase Auth (Google + email) | Gratis, sin backend propio |
| DB | Supabase Postgres | Free tier suficiente para grupo de amigos |
| Lógica anti-cheat | Supabase Edge Functions (Deno) | Tiempo medido en el servidor |
| Realtime ranking | Supabase Realtime | Ranking en vivo sin recargar |
| Hosting front | Vercel o Netlify | Deploy gratis, CI desde git |

Costo: **$0** en free tier para uso de grupo chico.

---

## 2. Modelo de datos (esquema SQL)

```
profiles
  id            uuid (= auth.users.id)  PK
  display_name  text
  avatar_beast  text      -- id de BEASTS (albedo, horrax, ...)
  char_class    text      -- opcional: clase de Era
  lore          text      -- mini-lore elegido/escrito
  total_mins    int       -- cache de minutos validados totales
  created_at    timestamptz

groups
  id            uuid PK
  name          text
  description   text
  invite_code   text UNIQUE   -- para link de invitación
  owner_id      uuid -> profiles.id
  created_at    timestamptz

group_members
  group_id  uuid -> groups.id
  user_id   uuid -> profiles.id
  role      text  -- 'owner' | 'member'
  joined_at timestamptz
  PK (group_id, user_id)

tournaments
  id           uuid PK
  group_id     uuid -> groups.id
  name         text         -- "PARCIAL ANÁLISIS MATEMÁTICO 2"
  subject      text         -- materia
  starts_at    timestamptz
  ends_at      timestamptz
  target_mins  int NULL     -- meta opcional de horas
  created_by   uuid -> profiles.id
  created_at   timestamptz

tournament_participants
  tournament_id uuid -> tournaments.id
  user_id       uuid -> profiles.id
  joined_at     timestamptz
  PK (tournament_id, user_id)

domains              -- materias personales (como hoy)
  id            uuid PK
  user_id       uuid -> profiles.id
  name          text
  beast_id      text
  daily_target_hours numeric
  total_mins    int
  created_at    timestamptz

sessions             -- corazón del anti-cheat
  id             uuid PK
  user_id        uuid -> profiles.id
  domain_id      uuid -> domains.id  NULL
  tournament_id  uuid -> tournaments.id  NULL  -- a qué torneo cuenta
  beast_id       text
  start_at       timestamptz   -- puesto por el SERVIDOR
  last_heartbeat timestamptz   -- actualizado cada 30-60s
  end_at         timestamptz   NULL
  mins           int           -- calculado por el SERVIDOR al cerrar
  status         text          -- 'active' | 'closed' | 'expired'
```

**Ranking de torneo** = sumar `sessions.mins` de status `closed`, donde
`tournament_id = X` y `start_at` dentro de `[starts_at, ends_at]`, agrupado por `user_id`.

---

## 3. Anti-cheat (Nivel 2) — cómo funciona

Tres Edge Functions. El cliente nunca decide cuántos minutos ganó.

1. **`session-start`** → crea fila `sessions` con `start_at = now()` del servidor, `status='active'`.
   Regla: máximo 1 sesión activa por usuario. Devuelve `session_id`.
2. **`session-heartbeat`** → cada 30–60s el cliente llama; el servidor actualiza
   `last_heartbeat = now()`. Si el reloj del cliente miente, da igual: manda el servidor.
3. **`session-end`** → `end_at = now()`, `mins = clamp(end_at - start_at)` pero **acotado
   por `last_heartbeat`** (si el último heartbeat fue hace 10 min, no contás 3h fantasma).
   Tope diario configurable (ej. 12h/día) para evitar números absurdos.

**Limpieza:** un cron (`pg_cron`) marca `expired` las sesiones `active` cuyo
`last_heartbeat` quedó viejo (ej. >3 min) y las cierra con los minutos válidos.
Así cerrar el navegador no infla horas.

**RLS (Row Level Security):** cada usuario solo escribe/lee lo suyo; lecturas de ranking
van por vistas/funciones que exponen solo lo necesario del grupo.

---

## 4. Premios semanales / rankings

- **Ranking de torneo** (principal): minutos dentro de la ventana del torneo.
- **Ranking semanal de grupo** (secundario): minutos de la semana (lógica `getMondayMidnightOf` ya existe).
- **Premio:** al cerrar un torneo (`ends_at`), un cron congela el ranking y asigna
  trofeo/título al podio (#1, #2, #3). Cosmético, visible en perfil.
- **Feed social** (opcional fase 2): "Nehuén derrotó a Horrax — 2h de Cálculo".

---

## 5. Fases de implementación (qué hago YO)

### Fase 1 — Cimientos (auth + perfil)
- [ ] Cliente Supabase en el front (`src/lib/supabase.ts`)
- [ ] Pantalla login (Google + email)
- [ ] Crear/editar perfil: nombre, avatar (bestia), mini-lore
- [ ] Migrar `useStore` para leer/escribir perfil desde Supabase (mantener localStorage como cache offline)

### Fase 2 — Sesiones confiables
- [ ] Edge Functions `session-start` / `session-heartbeat` / `session-end`
- [ ] Reconectar el timer de batalla actual (`Encounter.tsx`) a las 3 funciones
- [ ] Cron de expiración de sesiones colgadas
- [ ] Reescribir `completeAttack` para que los minutos vengan del servidor

### Fase 3 — Grupos + invitaciones
- [ ] CRUD grupos, generación de `invite_code`
- [ ] Página de unirse por link `/join/:code`
- [ ] Vista de grupo: miembros + sus horas totales

### Fase 4 — Torneos
- [ ] Crear torneo (nombre, materia, fechas, meta opcional)
- [ ] Unirse a torneo, elegir a qué torneo cuenta la sesión
- [ ] Ranking de torneo en vivo (Realtime)
- [ ] Cierre automático + asignación de premios

### Fase 5 — Pulido
- [ ] Feed social, trofeos de torneo en perfil, notificaciones, tope diario configurable
- [ ] Deploy a Vercel/Netlify con CI

---

## 6. Qué tenés que hacer VOS (paso a paso)

> Todo lo demás lo hago yo. Esto requiere tu cuenta porque genera credenciales.

### Paso A — Crear proyecto Supabase
1. Andá a https://supabase.com → "Start your project" → login con GitHub/Google.
2. "New project". Nombre: `focus-souls`. Region: la más cercana (ej. São Paulo). Poné password de DB y guardala.
3. Esperá ~2 min a que aprovisione.

### Paso B — Pasarme las llaves (placeholder)
En el proyecto: **Settings → API**. Copiá y pegámelas en este formato:

```
SUPABASE_URL=___________________________      # "Project URL"
SUPABASE_ANON_KEY=______________________      # "anon public"
SUPABASE_SERVICE_ROLE_KEY=______________      # "service_role" (SECRETA, para Edge Functions)
SUPABASE_DB_PASSWORD=___________________      # la del Paso A2
```

> ⚠️ La `service_role` y la `DB_PASSWORD` son secretas. No las subas a git.
> Las pongo en variables de entorno / secrets de Supabase, nunca en el código.

### Paso C — (Opcional) Login con Google
Si querés botón "Entrar con Google" (recomendado, más cómodo que email):
1. Supabase → **Authentication → Providers → Google → Enable**.
2. Te va a pedir un `Client ID` y `Client Secret` de Google Cloud.
   - https://console.cloud.google.com → crear proyecto → "OAuth consent screen" (External) →
     "Credentials → Create OAuth client ID → Web application".
   - En "Authorized redirect URIs" pegá la URL que te muestra Supabase.
3. Pegámelos:
```
GOOGLE_CLIENT_ID=______________________
GOOGLE_CLIENT_SECRET=__________________
```
> Si esto te complica, arrancamos solo con **email/contraseña** (cero config extra) y
> agregamos Google después.

### Paso D — (Más adelante) Deploy
Cuando esté listo para que entren tus amigos:
1. Cuenta en https://vercel.com (login con GitHub).
2. Yo dejo el repo listo; vos hacés "Import Project" y pegás las env vars públicas
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Te doy el paso a paso exacto en ese momento.

---

## 7. Bloque de credenciales a entregar (resumen)

Copiá esto, completá lo que tengas, y pegámelo:

```
# --- REQUERIDO para empezar (Fase 1) ---
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=

# --- OPCIONAL (login Google) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Más tarde (deploy) ---
VERCEL=  # solo avisame cuando tengas la cuenta
```

---

## 8. Riesgos / límites honestos

- **Trampa residual:** el Nivel 2 evita regalarse horas, pero alguien puede dejar la sesión
  corriendo sin estudiar. Es el mismo límite de Forest/cualquier app de foco. Mitigación
  opcional: pausar al perder foco de ventana (`document.visibilityState`).
- **Free tier:** suficiente para decenas de usuarios. Si crece mucho, hay que ver límites.
- **Offline:** mantenemos localStorage como cache; si no hay red, juega local y sincroniza
  al volver. (Fase 2+.)
```
