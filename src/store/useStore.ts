import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Domain {
  id: string;
  name: string;
  weeklyTargetMins: number;
  currentDebtMins: number;
  totalAccumulatedMins: number;
  beastId: string;
  isDefeated: boolean;
}

export interface BestiaryEntry {
  beastId: string;
  name: string;
  defeats: number;
  totalMinsDefeated: number;
}

// ─── Level System ─────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1,  xpRequired: 0,      title: 'Aprendiz',        icon: '🕯️' },
  { level: 2,  xpRequired: 500,    title: 'Escudero',        icon: '🗡️' },
  { level: 3,  xpRequired: 1200,   title: 'Guerrero',        icon: '⚔️' },
  { level: 4,  xpRequired: 2200,   title: 'Veterano',        icon: '🛡️' },
  { level: 5,  xpRequired: 3500,   title: 'Campeón',         icon: '🏅' },
  { level: 6,  xpRequired: 5100,   title: 'Héroe',           icon: '⭐' },
  { level: 7,  xpRequired: 7000,   title: 'Señor de Guerra', icon: '⚡' },
  { level: 8,  xpRequired: 9200,   title: 'Guardián',        icon: '🔱' },
  { level: 9,  xpRequired: 11700,  title: 'Arconte',         icon: '🌟' },
  { level: 10, xpRequired: 14500,  title: 'Leyenda',         icon: '💎' },
  { level: 11, xpRequired: 17600,  title: 'Ascendido',       icon: '✨' },
  { level: 12, xpRequired: 21000,  title: 'Maestro Arcano',  icon: '🔮' },
  { level: 13, xpRequired: 24700,  title: 'El Liche',        icon: '💀' },
  { level: 14, xpRequired: 28700,  title: 'Señor Oscuro',    icon: '🌑' },
  { level: 15, xpRequired: 33000,  title: 'Archimago',       icon: '🧙' },
  { level: 16, xpRequired: 37600,  title: 'Semidiós',        icon: '🌊' },
  { level: 17, xpRequired: 42500,  title: 'Avatar',          icon: '🌌' },
  { level: 18, xpRequired: 47700,  title: 'Inmortal',        icon: '♾️' },
  { level: 19, xpRequired: 53200,  title: 'Primordial',      icon: '🌠' },
  { level: 20, xpRequired: 59000,  title: 'Dios del Ritual', icon: '👑' },
];

const calculateLevel = (xp: number): number => {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      level = LEVELS[i].level;
      break;
    }
  }
  return level;
};

export const calculateXpGain = (mins: number, bossDefeated: boolean): number => {
  let xp = mins * 10;
  if (mins >= 120) xp = Math.floor(xp * 1.5);
  else if (mins >= 60) xp = Math.floor(xp * 1.25);
  else if (mins >= 30) xp = Math.floor(xp * 1.1);
  if (bossDefeated) xp += 150;
  return xp;
};

export interface Player {
  totalAccumulatedMins: number;
  xp: number;
  level: number;
  unlockedAchievements: string[];
  lastSessionXp: number;
  lastSessionBossDefeated: boolean;
  lastSessionMins: number;
}

export interface RitualSession {
  id: string;
  domainId: string;
  beastId: string;
  durationMins: number;
  timestamp: number;
}

export interface FocusStore {
  player: Player;
  domains: Domain[];
  bestiary: BestiaryEntry[];
  ritualSessions: RitualSession[];
  lastSyncDate: number;

  createDomain: (name: string, weeklyTargetMins: number, beastId: string) => void;
  completeRitual: (domainId: string, beastId: string, mins: number) => void;
  checkAndApplyWeeklyDebt: () => void;
}

// ─── Achievement Definitions ──────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: 'tiempo' | 'bestias' | 'dominios' | 'sesiones' | 'nivel';
  color: string;
  border: string;
  bg: string;
  check: (state: {
    player: Player;
    domains: Domain[];
    bestiary: BestiaryEntry[];
    ritualSessions: RitualSession[];
    sessionMins: number;
    bossDefeated: boolean;
  }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Tiempo ────────────────────────────────────────────────────────────────
  {
    id: 'primera_llama',
    title: 'Primera Llama',
    desc: 'Completar tu primer ritual',
    icon: '🕯️',
    category: 'tiempo',
    color: '#fbbf24', border: '#92400e', bg: '#0f0800',
    check: ({ ritualSessions }) => ritualSessions.length >= 1,
  },
  {
    id: 'centurion',
    title: 'El Centurión',
    desc: '100 minutos de maestría total',
    icon: '💯',
    category: 'tiempo',
    color: '#fbbf24', border: '#92400e', bg: '#0f0800',
    check: ({ player }) => player.totalAccumulatedMins >= 100,
  },
  {
    id: 'primer_alba',
    title: 'Primer Alba',
    desc: 'Completar una sesión de 60+ minutos',
    icon: '🌅',
    category: 'tiempo',
    color: '#fb923c', border: '#9a3412', bg: '#0f0500',
    check: ({ sessionMins }) => sessionMins >= 60,
  },
  {
    id: 'decano',
    title: 'El Decano',
    desc: '10 horas de maestría acumulada',
    icon: '⏳',
    category: 'tiempo',
    color: '#22d3ee', border: '#164e63', bg: '#000f15',
    check: ({ player }) => player.totalAccumulatedMins >= 600,
  },
  {
    id: 'veterano_oscuro',
    title: 'Veterano Oscuro',
    desc: '50 horas de maestría acumulada',
    icon: '⚔️',
    category: 'tiempo',
    color: '#a78bfa', border: '#4c1d95', bg: '#0a000f',
    check: ({ player }) => player.totalAccumulatedMins >= 3000,
  },
  {
    id: 'leyenda_eterna',
    title: 'Leyenda Eterna',
    desc: '100 horas de maestría acumulada',
    icon: '👑',
    category: 'tiempo',
    color: '#fde047', border: '#854d0e', bg: '#0f0800',
    check: ({ player }) => player.totalAccumulatedMins >= 6000,
  },
  // ── Bestias ───────────────────────────────────────────────────────────────
  {
    id: 'primera_sangre',
    title: 'Primera Sangre',
    desc: 'Derrotar a tu primer jefe',
    icon: '🩸',
    category: 'bestias',
    color: '#dc2626', border: '#7f1d1d', bg: '#0f0000',
    check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 1,
  },
  {
    id: 'cazador',
    title: 'El Cazador',
    desc: '5 derrotas en total',
    icon: '🏹',
    category: 'bestias',
    color: '#dc2626', border: '#7f1d1d', bg: '#0f0000',
    check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 5,
  },
  {
    id: 'matador',
    title: 'El Matador',
    desc: '20 derrotas en total',
    icon: '💀',
    category: 'bestias',
    color: '#dc2626', border: '#7f1d1d', bg: '#0f0000',
    check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 20,
  },
  {
    id: 'especialista',
    title: 'Especialista',
    desc: '5 derrotas al mismo jefe',
    icon: '🎯',
    category: 'bestias',
    color: '#c084fc', border: '#581c87', bg: '#0a000f',
    check: ({ bestiary }) => bestiary.some(b => b.defeats >= 5),
  },
  {
    id: 'exterminador',
    title: 'El Exterminador',
    desc: '10 derrotas al mismo jefe',
    icon: '☠️',
    category: 'bestias',
    color: '#c084fc', border: '#581c87', bg: '#0a000f',
    check: ({ bestiary }) => bestiary.some(b => b.defeats >= 10),
  },
  {
    id: 'coleccionista',
    title: 'El Coleccionista',
    desc: 'Derrotar 5 bestias diferentes',
    icon: '📋',
    category: 'bestias',
    color: '#34d399', border: '#065f46', bg: '#000f08',
    check: ({ bestiary }) => bestiary.filter(b => b.defeats >= 1).length >= 5,
  },
  // ── Dominios ──────────────────────────────────────────────────────────────
  {
    id: 'el_forjador',
    title: 'El Forjador',
    desc: 'Crear tu primer dominio',
    icon: '🔨',
    category: 'dominios',
    color: '#60a5fa', border: '#1e3a5f', bg: '#000a15',
    check: ({ domains }) => domains.length >= 1,
  },
  {
    id: 'el_gremio',
    title: 'El Gremio',
    desc: 'Tener 5 dominios activos',
    icon: '🏛️',
    category: 'dominios',
    color: '#60a5fa', border: '#1e3a5f', bg: '#000a15',
    check: ({ domains }) => domains.length >= 5,
  },
  {
    id: 'dominio_purgado',
    title: 'Dominio Purgado',
    desc: 'Completar la deuda de un dominio',
    icon: '📜',
    category: 'dominios',
    color: '#4ade80', border: '#14532d', bg: '#000f05',
    check: ({ bossDefeated }) => bossDefeated,
  },
  {
    id: 'gran_maestro',
    title: 'Gran Maestro',
    desc: '5 dominios completados en total',
    icon: '🎓',
    category: 'dominios',
    color: '#4ade80', border: '#14532d', bg: '#000f05',
    check: ({ domains }) => domains.filter(d => d.isDefeated).length >= 5,
  },
  {
    id: 'polimata',
    title: 'El Polímata',
    desc: '3 dominios con 60+ minutos cada uno',
    icon: '🧠',
    category: 'dominios',
    color: '#f0abfc', border: '#701a75', bg: '#0f000f',
    check: ({ domains }) => domains.filter(d => d.totalAccumulatedMins >= 60).length >= 3,
  },
  // ── Sesiones ──────────────────────────────────────────────────────────────
  {
    id: 'maratonista',
    title: 'El Maratonista',
    desc: 'Sesión de 2 horas o más',
    icon: '🏃',
    category: 'sesiones',
    color: '#fb923c', border: '#9a3412', bg: '#0f0500',
    check: ({ sessionMins }) => sessionMins >= 120,
  },
  {
    id: 'titan',
    title: 'El Titán',
    desc: 'Sesión de 4 horas o más',
    icon: '🗿',
    category: 'sesiones',
    color: '#f87171', border: '#7f1d1d', bg: '#0f0000',
    check: ({ sessionMins }) => sessionMins >= 240,
  },
  {
    id: 'decena',
    title: 'La Decena',
    desc: '10 rituales completados',
    icon: '🔟',
    category: 'sesiones',
    color: '#38bdf8', border: '#0c4a6e', bg: '#000a15',
    check: ({ ritualSessions }) => ritualSessions.length >= 10,
  },
  {
    id: 'centenario',
    title: 'El Centenario',
    desc: '50 rituales completados',
    icon: '💫',
    category: 'sesiones',
    color: '#818cf8', border: '#312e81', bg: '#05000f',
    check: ({ ritualSessions }) => ritualSessions.length >= 50,
  },
  // ── Nivel ─────────────────────────────────────────────────────────────────
  {
    id: 'iniciado',
    title: 'El Iniciado',
    desc: 'Alcanzar el nivel 5',
    icon: '🌱',
    category: 'nivel',
    color: '#86efac', border: '#166534', bg: '#000f05',
    check: ({ player }) => player.level >= 5,
  },
  {
    id: 'ascendido',
    title: 'El Ascendido',
    desc: 'Alcanzar el nivel 10',
    icon: '⚡',
    category: 'nivel',
    color: '#fcd34d', border: '#92400e', bg: '#0f0800',
    check: ({ player }) => player.level >= 10,
  },
  {
    id: 'dios_ritual',
    title: 'Dios del Ritual',
    desc: 'Alcanzar el nivel 20',
    icon: '👑',
    category: 'nivel',
    color: '#fde047', border: '#854d0e', bg: '#0f0800',
    check: ({ player }) => player.level >= 20,
  },
];

// ─── Bestiary Data ────────────────────────────────────────────────────────────

export const BEASTS = {
  albedo:   { id: 'albedo',   name: 'Albedo',   lore: 'El Erudito de las Mil Tintas. Maestro del conocimiento ancestral.',        spriteImg: 'img/pixeladas/albedo.png',   bgImg: 'img/pixeladas/albedoBg.png'   },
  alberic:  { id: 'alberic',  name: 'Alberic',  lore: 'El Caballero Dorado. Guardián de la paciencia y la disciplina.',           spriteImg: 'img/pixeladas/alberic.png',  bgImg: 'img/pixeladas/albericBg.png'  },
  aurelian: { id: 'aurelian', name: 'Aurelian', lore: 'El Emperador Inmortal. Soberano de la voluntad inquebrantable.',           spriteImg: 'img/pixeladas/aurelian.png', bgImg: 'img/pixeladas/aurelianBg.png' },
  horrax:   { id: 'horrax',   name: 'Horrax',   lore: 'El Devorador de Mundos. Terror cósmico sin igual.',                       spriteImg: 'img/pixeladas/horrax.png',   bgImg: 'img/pixeladas/horraxBg.png'   },
  kaelen:   { id: 'kaelen',   name: 'Kaelen',   lore: 'El Cazador Eterno. Persigue a sus presas sin descanso.',                  spriteImg: 'img/pixeladas/kaelen.png',   bgImg: 'img/pixeladas/kaelenBg.png'   },
  lysandra: { id: 'lysandra', name: 'Lysandra', lore: 'La Hechicera de Cristal. Tejedora de ilusiones mortales.',                spriteImg: 'img/pixeladas/lysandra.png', bgImg: 'img/pixeladas/lysandraBg.png' },
  maro:     { id: 'maro',     name: 'Maro',     lore: 'El Arquitecto Olvidado. Constructor de laberintos infinitos.',             spriteImg: 'img/pixeladas/maro.png',     bgImg: 'img/pixeladas/maroBg.png'     },
  morwenna: { id: 'morwenna', name: 'Morwenna', lore: 'La Bruja del Páramo. Señora de las tormentas y la niebla.',               spriteImg: 'img/pixeladas/morwenna.png', bgImg: 'img/pixeladas/morwennaBg.png' },
  nyr:      { id: 'nyr',      name: 'Nyr',      lore: 'El Mensajero del Vacío. Portador de secretos prohibidos.',                spriteImg: 'img/pixeladas/nyr.png',      bgImg: 'img/pixeladas/nyrBg.png'      },
  thereon:  { id: 'thereon',  name: 'Thereon',  lore: 'El Cambiaformas. Entidad de mil rostros y un solo propósito.',            spriteImg: 'img/pixeladas/thereon.png',  bgImg: 'img/pixeladas/thereonBg.png'  },
  vesper:   { id: 'vesper',   name: 'Vesper',   lore: 'La Sombra del Ocaso. Maestra de las artes ocultas.',                     spriteImg: 'img/pixeladas/vesper.png',   bgImg: 'img/pixeladas/vesperBg.png'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getWeeksPassed = (lastSyncDate: number): number => {
  const now = new Date();
  const lastSync = new Date(lastSyncDate);

  const getLastMondayBefore = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const daysToSubtract = day === 1 ? 7 : (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - daysToSubtract);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  let lastMonday = getLastMondayBefore(lastSync);
  let weeksCount = 0;
  let checkDate = new Date(lastMonday);

  while (checkDate <= now) {
    if (checkDate > lastSync) weeksCount++;
    checkDate.setDate(checkDate.getDate() + 7);
  }

  return weeksCount;
};

// ─── Store ────────────────────────────────────────────────────────────────────

const INITIAL_PLAYER: Player = {
  totalAccumulatedMins: 0,
  xp: 0,
  level: 1,
  unlockedAchievements: [],
  lastSessionXp: 0,
  lastSessionBossDefeated: false,
  lastSessionMins: 0,
};

export const useStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      player: INITIAL_PLAYER,
      domains: [],
      bestiary: [
        { beastId: 'albedo',   name: 'Albedo',   defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'alberic',  name: 'Alberic',  defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'aurelian', name: 'Aurelian', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'horrax',   name: 'Horrax',   defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'kaelen',   name: 'Kaelen',   defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'lysandra', name: 'Lysandra', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'maro',     name: 'Maro',     defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'morwenna', name: 'Morwenna', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'nyr',      name: 'Nyr',      defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'thereon',  name: 'Thereon',  defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'vesper',   name: 'Vesper',   defeats: 0, totalMinsDefeated: 0 },
      ],
      ritualSessions: [],
      lastSyncDate: Date.now(),

      createDomain: (name, weeklyTargetMins, beastId) => {
        const beast = BEASTS[beastId as keyof typeof BEASTS];
        if (!beast) return;

        set((state) => {
          const newDomains = [
            ...state.domains,
            {
              id: crypto.randomUUID(),
              name,
              weeklyTargetMins,
              currentDebtMins: weeklyTargetMins,
              totalAccumulatedMins: 0,
              beastId,
              isDefeated: false,
            },
          ];

          // Check domain-creation achievements
          const newAchievements = checkNewAchievements(state.player, newDomains, state.bestiary, state.ritualSessions, 0, false);
          return {
            domains: newDomains,
            player: {
              ...state.player,
              unlockedAchievements: [...state.player.unlockedAchievements, ...newAchievements],
            },
          };
        });
      },

      completeRitual: (domainId, beastId, mins) => {
        set((state) => {
          const domain = state.domains.find((d) => d.id === domainId);
          if (!domain) return state;

          const newDebtMins = Math.max(0, domain.currentDebtMins - mins);
          const wasDefeated = domain.isDefeated;
          const isNowDefeated = newDebtMins <= 0;
          const bossDefeated = isNowDefeated && !wasDefeated;

          const updatedBestiary = state.bestiary.map((entry) =>
            entry.beastId === beastId
              ? {
                  ...entry,
                  defeats: bossDefeated ? entry.defeats + 1 : entry.defeats,
                  totalMinsDefeated: entry.totalMinsDefeated + mins,
                }
              : entry
          );

          const updatedDomains = state.domains.map((d) =>
            d.id === domainId
              ? { ...d, currentDebtMins: newDebtMins, totalAccumulatedMins: d.totalAccumulatedMins + mins, isDefeated: isNowDefeated }
              : d
          );

          const newTotalAccumulatedMins = state.player.totalAccumulatedMins + mins;
          const xpGained = calculateXpGain(mins, bossDefeated);
          const newXp = state.player.xp + xpGained;
          const newLevel = calculateLevel(newXp);

          const updatedSessions = [
            ...state.ritualSessions,
            { id: crypto.randomUUID(), domainId, beastId, durationMins: mins, timestamp: Date.now() },
          ];

          const updatedPlayer: Player = {
            totalAccumulatedMins: newTotalAccumulatedMins,
            xp: newXp,
            level: newLevel,
            unlockedAchievements: state.player.unlockedAchievements,
            lastSessionXp: xpGained,
            lastSessionBossDefeated: bossDefeated,
            lastSessionMins: mins,
          };

          const newAchievements = checkNewAchievements(updatedPlayer, updatedDomains, updatedBestiary, updatedSessions, mins, bossDefeated);
          updatedPlayer.unlockedAchievements = [...state.player.unlockedAchievements, ...newAchievements];

          return {
            domains: updatedDomains,
            bestiary: updatedBestiary,
            player: updatedPlayer,
            ritualSessions: updatedSessions,
          };
        });
      },

      checkAndApplyWeeklyDebt: () => {
        set((state) => {
          const weeksPassed = getWeeksPassed(state.lastSyncDate);
          if (weeksPassed <= 0) return state;

          return {
            domains: state.domains.map((domain) => ({
              ...domain,
              currentDebtMins: domain.currentDebtMins + domain.weeklyTargetMins * weeksPassed,
              isDefeated: false,
            })),
            lastSyncDate: Date.now(),
          };
        });
      },

    }),
    {
      name: 'focus-souls-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const s = persistedState as Record<string, unknown>;
        if (version < 2) {
          const player = (s.player as Partial<Player & { rankIndex?: number }>) || {};
          const totalMins = player.totalAccumulatedMins || 0;
          const xp = player.xp || totalMins * 10;
          const { rankIndex: _r, ...playerRest } = player;
          return {
            ...s,
            player: {
              ...INITIAL_PLAYER,
              ...playerRest,
              xp,
              level: calculateLevel(xp),
              unlockedAchievements: playerRest.unlockedAchievements || [],
              lastSessionXp: playerRest.lastSessionXp || 0,
              lastSessionBossDefeated: playerRest.lastSessionBossDefeated || false,
              lastSessionMins: playerRest.lastSessionMins || 0,
            },
          };
        }
        return s;
      },
    }
  )
);

// ─── Achievement checker (outside store to avoid circular ref) ─────────────────

function checkNewAchievements(
  player: Player,
  domains: Domain[],
  bestiary: BestiaryEntry[],
  ritualSessions: RitualSession[],
  sessionMins: number,
  bossDefeated: boolean,
): string[] {
  const ctx = { player, domains, bestiary, ritualSessions, sessionMins, bossDefeated };
  return ACHIEVEMENTS
    .filter(a => !player.unlockedAchievements.includes(a.id) && a.check(ctx))
    .map(a => a.id);
}
