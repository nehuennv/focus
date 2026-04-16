import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Domain = Materia universitaria
 * Representa la "deuda de tiempo" que el estudiante tiene con cada materia.
 */
export interface Domain {
  id: string;
  name: string;              // ej. "Análisis Matemático II"
  weeklyTargetMins: number;  // Meta semanal en minutos (ej. 120 = 2h/semana)
  currentDebtMins: number;   // Deuda actual (HP del boss)
  totalAccumulatedMins: number; // Maestría acumulada (para el rango de 1000h)
  beastId: string;           // ID del jefe del bestiario asociado (Alberic, Vesper, etc.)
  isDefeated: boolean;       // currentDebtMins <= 0
}

/**
 * Bestiary = Registro de cuántas veces derrotamos a cada jefe arquetípico
 */
export interface BestiaryEntry {
  beastId: string;           // ej. "alberic", "vesper", "horrax", "kaelen"
  name: string;              // Nombre visible del jefe
  defeats: number;           // Veces que lo derrotamos
  totalMinsDefeated: number; // Minutos totales enfocados en este jefe
}

/**
 * Rangos del jugador basados en totalAccumulatedMins (maestría total)
 */
export const PLAYER_RANKS = [
  { minMins: 0, title: 'Erudito', icon: '📜' },
  { minMins: 500, title: 'Estudioso', icon: '📚' },
  { minMins: 1000, title: 'Académico', icon: '🎓' },
  { minMins: 2500, title: 'Sabio', icon: '🌟' },
  { minMins: 5000, title: 'Maestro', icon: '⭐' },
  { minMins: 10000, title: 'Archimago', icon: '🔮' },
  { minMins: 50000, title: 'Legendario', icon: '👑' },
  { minMins: 100000, title: 'Inmortal', icon: '💫' },
];

export interface Player {
  totalAccumulatedMins: number; // Minutos totales de enfoque (maestría global)
  rankIndex: number;            // Índice en PLAYER_RANKS
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
  lastSyncDate: number; // Para calcular deuda semanal retroactiva

  // Actions - Domain Management
  createDomain: (name: string, weeklyTargetMins: number, beastId: string) => void;

  // Actions - Core Combat
  completeRitual: (domainId: string, beastId: string, mins: number) => void;

  // Actions - Weekly Debt System
  checkAndApplyWeeklyDebt: () => void;

  // Utility
  getPlayerRank: () => typeof PLAYER_RANKS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Bestiary Data - Jefes Predefinidos
// ─────────────────────────────────────────────────────────────────────────────

export const BEASTS = {
  albedo: { id: 'albedo', name: 'Albedo', lore: 'El Erudito de las Mil Tintas. Maestro del conocimiento ancestral.', spriteImg: 'img/pixeladas/albedo.png', bgImg: 'img/pixeladas/albedoBg.png' },
  alberic: { id: 'alberic', name: 'Alberic', lore: 'El Caballero Dorado. Guardián de la paciencia y la disciplina.', spriteImg: 'img/pixeladas/alberic.png', bgImg: 'img/pixeladas/albericBg.png' },
  aurelian: { id: 'aurelian', name: 'Aurelian', lore: 'El Emperador Inmortal. Soberano de la voluntad inquebrantable.', spriteImg: 'img/pixeladas/aurelian.png', bgImg: 'img/pixeladas/aurelianBg.png' },
  horrax: { id: 'horrax', name: 'Horrax', lore: 'El Devorador de Mundos. Terror cósmico sin igual.', spriteImg: 'img/pixeladas/horrax.png', bgImg: 'img/pixeladas/horraxBg.png' },
  kaelen: { id: 'kaelen', name: 'Kaelen', lore: 'El Cazador Eterno. Persigue a sus presas sin descanso.', spriteImg: 'img/pixeladas/kaelen.png', bgImg: 'img/pixeladas/kaelenBg.png' },
  lysandra: { id: 'lysandra', name: 'Lysandra', lore: 'La Hechicera de Cristal. Tejedora de ilusiones mortales.', spriteImg: 'img/pixeladas/lysandra.png', bgImg: 'img/pixeladas/lysandraBg.png' },
  maro: { id: 'maro', name: 'Maro', lore: 'El Arquitecto Olvidado. Constructor de laberintos infinitos.', spriteImg: 'img/pixeladas/maro.png', bgImg: 'img/pixeladas/maroBg.png' },
  morwenna: { id: 'morwenna', name: 'Morwenna', lore: 'La Bruja del Páramo. Señora de las tormentas y la niebla.', spriteImg: 'img/pixeladas/morwenna.png', bgImg: 'img/pixeladas/morwennaBg.png' },
  nyr: { id: 'nyr', name: 'Nyr', lore: 'El Mensajero del Vacío. Portador de secretos prohibidos.', spriteImg: 'img/pixeladas/nyr.png', bgImg: 'img/pixeladas/nyrBg.png' },
  thereon: { id: 'thereon', name: 'Thereon', lore: 'El Cambiaformas. Entidad de mil rostros y un solo propósito.', spriteImg: 'img/pixeladas/thereon.png', bgImg: 'img/pixeladas/thereonBg.png' },
  vesper: { id: 'vesper', name: 'Vesper', lore: 'La Sombra del Ocaso. Maestra de las artes ocultas.', spriteImg: 'img/pixeladas/vesper.png', bgImg: 'img/pixeladas/vesperBg.png' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get Player Rank from totalAccumulatedMins
// ─────────────────────────────────────────────────────────────────────────────

const calculateRankIndex = (totalAccumulatedMins: number): number => {
  let rankIndex = 0;
  for (let i = PLAYER_RANKS.length - 1; i >= 0; i--) {
    if (totalAccumulatedMins >= PLAYER_RANKS[i].minMins) {
      rankIndex = i;
      break;
    }
  }
  return rankIndex;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get number of weeks passed (Mondays) since lastSyncDate
// ─────────────────────────────────────────────────────────────────────────────

const getWeeksPassed = (lastSyncDate: number): number => {
  const now = new Date();
  const lastSync = new Date(lastSyncDate);

  // Find the most recent Monday at 00:00 before lastSync
  const getLastMondayBefore = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Go back to the previous Monday (if today is Monday, go to last week's Monday)
    const daysToSubtract = day === 1 ? 7 : (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - daysToSubtract);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  let lastMonday = getLastMondayBefore(lastSync);

  // Count how many Mondays at 00:00 have passed since lastSync
  let weeksCount = 0;
  let checkDate = new Date(lastMonday);

  while (checkDate <= now) {
    if (checkDate > lastSync) {
      weeksCount++;
    }
    checkDate.setDate(checkDate.getDate() + 7);
  }

  return weeksCount;
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      player: {
        totalAccumulatedMins: 0,
        rankIndex: 0,
      },
      domains: [],
      bestiary: [
        { beastId: 'albedo', name: 'Albedo', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'alberic', name: 'Alberic', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'aurelian', name: 'Aurelian', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'horrax', name: 'Horrax', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'kaelen', name: 'Kaelen', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'lysandra', name: 'Lysandra', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'maro', name: 'Maro', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'morwenna', name: 'Morwenna', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'nyr', name: 'Nyr', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'thereon', name: 'Thereon', defeats: 0, totalMinsDefeated: 0 },
        { beastId: 'vesper', name: 'Vesper', defeats: 0, totalMinsDefeated: 0 },
      ],
      ritualSessions: [],
      lastSyncDate: Date.now(),

      createDomain: (name, weeklyTargetMins, beastId) => {
        const beast = BEASTS[beastId as keyof typeof BEASTS];
        if (!beast) {
          console.error(`Beast "${beastId}" not found`);
          return;
        }

        set((state) => ({
          domains: [
            ...state.domains,
            {
              id: crypto.randomUUID(),
              name,
              weeklyTargetMins,
              currentDebtMins: weeklyTargetMins, // Start at full debt
              totalAccumulatedMins: 0,
              beastId,
              isDefeated: false,
            },
          ],
        }));
      },

      completeRitual: (domainId, beastId, mins) => {
        set((state) => {
          const domain = state.domains.find((d) => d.id === domainId);
          if (!domain) return state;

          // Calculate new debt (can't go below 0)
          const newDebtMins = Math.max(0, domain.currentDebtMins - mins);
          const wasDefeated = domain.isDefeated;
          const isNowDefeated = newDebtMins <= 0;

          // Update bestiary
          const updatedBestiary = state.bestiary.map((entry) => {
            if (entry.beastId === beastId) {
              return {
                ...entry,
                defeats: isNowDefeated && !wasDefeated ? entry.defeats + 1 : entry.defeats,
                totalMinsDefeated: entry.totalMinsDefeated + mins,
              };
            }
            return entry;
          });

          // Update player total (maestría global)
          const newTotalAccumulatedMins = state.player.totalAccumulatedMins + mins;

          return {
            domains: state.domains.map((d) =>
              d.id === domainId
                ? {
                    ...d,
                    currentDebtMins: newDebtMins,
                    totalAccumulatedMins: d.totalAccumulatedMins + mins,
                    isDefeated: isNowDefeated,
                  }
                : d
            ),
            bestiary: updatedBestiary,
            player: {
              totalAccumulatedMins: newTotalAccumulatedMins,
              rankIndex: calculateRankIndex(newTotalAccumulatedMins),
            },
            ritualSessions: [
              ...state.ritualSessions,
              {
                id: crypto.randomUUID(),
                domainId,
                beastId,
                durationMins: mins,
                timestamp: Date.now(),
              },
            ],
          };
        });
      },

      checkAndApplyWeeklyDebt: () => {
        set((state) => {
          const weeksPassed = getWeeksPassed(state.lastSyncDate);

          if (weeksPassed <= 0) {
            return state; // No weeks passed, no debt to apply
          }

          // Apply debt for each week that passed
          const updatedDomains = state.domains.map((domain) => ({
            ...domain,
            currentDebtMins: domain.currentDebtMins + domain.weeklyTargetMins * weeksPassed,
            isDefeated: false, // Bosses come back to life with new debt
          }));

          return {
            domains: updatedDomains,
            lastSyncDate: Date.now(),
          };
        });
      },

      getPlayerRank: () => {
        const state = get();
        return PLAYER_RANKS[state.player.rankIndex] || PLAYER_RANKS[0];
      },
    }),
    {
      name: 'focus-souls-storage',
    }
  )
);
