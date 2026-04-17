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

// ─── XP Score (vanity metric — no longer drives progression) ──────────────────

export const calculateXpGain = (mins: number, bossDefeated: boolean): number => {
  let xp = mins * 10;
  if (mins >= 120) xp = Math.floor(xp * 1.5);
  else if (mins >= 60) xp = Math.floor(xp * 1.25);
  else if (mins >= 30) xp = Math.floor(xp * 1.1);
  if (bossDefeated) xp += 150;
  return xp;
};

// ─── Progression System: La Jerarquía del Rito ────────────────────────────────
// 10 Eras × 10 Rangos = 100 rangos totales, basados en minutos totales de foco.
//
// Referencia de tiempo (usuario dedicado 3h/día):
//   Era I   Novicio      0–500 min       (~3 días)
//   Era II  Iniciado     500–1500 min    (~1 semana)
//   Era III Guerrero     1500–4000 min   (~3 semanas)
//   Era IV  Cazador      4000–9000 min   (~2 meses)
//   Era V   Paladín      9000–20000 min  (~4 meses)
//   Era VI  Conjurador   20000–40000 min (~8 meses)
//   Era VII Señor de Guerra  40000–80000 min  (~1 año)
//   Era VIII Archimago   80000–140000 min (~1.5 años)
//   Era IX  Leyenda      140000–220000 min (~2.5 años)
//   Era X   Inmortal     220000+ min     (endgame absoluto)

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

export interface EraConfig {
  index: number;
  name: string;
  icon: string;
  color: string;
  border: string;
  bg: string;
  glow: string;
  startMins: number;
  minsPerRank: number;
}

export const ERAS: EraConfig[] = [
  {
    index: 0, name: 'Novicio',        icon: '📜',
    color: '#9ca3af', border: '#374151', bg: '#060608', glow: 'rgba(156,163,175,0.15)',
    startMins: 0,      minsPerRank: 50,
  },
  {
    index: 1, name: 'Iniciado',       icon: '🕯️',
    color: '#d1d5db', border: '#6b7280', bg: '#080808', glow: 'rgba(209,213,219,0.15)',
    startMins: 500,    minsPerRank: 100,
  },
  {
    index: 2, name: 'Guerrero',       icon: '⚔️',
    color: '#4ade80', border: '#14532d', bg: '#000f05', glow: 'rgba(74,222,128,0.15)',
    startMins: 1500,   minsPerRank: 250,
  },
  {
    index: 3, name: 'Cazador',        icon: '🏹',
    color: '#60a5fa', border: '#1e3a5f', bg: '#00050f', glow: 'rgba(96,165,250,0.15)',
    startMins: 4000,   minsPerRank: 500,
  },
  {
    index: 4, name: 'Paladín',        icon: '🛡️',
    color: '#fbbf24', border: '#92400e', bg: '#0f0800', glow: 'rgba(251,191,36,0.15)',
    startMins: 9000,   minsPerRank: 1100,
  },
  {
    index: 5, name: 'Conjurador',     icon: '🔮',
    color: '#c084fc', border: '#581c87', bg: '#0a000f', glow: 'rgba(192,132,252,0.15)',
    startMins: 20000,  minsPerRank: 2000,
  },
  {
    index: 6, name: 'Señor de Guerra', icon: '⚡',
    color: '#f87171', border: '#7f1d1d', bg: '#0f0000', glow: 'rgba(248,113,113,0.15)',
    startMins: 40000,  minsPerRank: 4000,
  },
  {
    index: 7, name: 'Archimago',      icon: '🧙',
    color: '#a78bfa', border: '#4c1d95', bg: '#050010', glow: 'rgba(167,139,250,0.2)',
    startMins: 80000,  minsPerRank: 6000,
  },
  {
    index: 8, name: 'Leyenda',        icon: '👑',
    color: '#fde047', border: '#854d0e', bg: '#0f0800', glow: 'rgba(253,224,71,0.2)',
    startMins: 140000, minsPerRank: 8000,
  },
  {
    index: 9, name: 'Inmortal',       icon: '💀',
    color: '#f8fafc', border: '#4a4a5a', bg: '#060610', glow: 'rgba(248,250,252,0.25)',
    startMins: 220000, minsPerRank: 13000,
  },
];

export const calculateRankIndex = (totalMins: number): number => {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (totalMins >= era.startMins) {
      const rank = Math.min(
        Math.floor((totalMins - era.startMins) / era.minsPerRank),
        9,
      );
      return i * 10 + rank;
    }
  }
  return 0;
};

export const getRankProgress = (totalMins: number) => {
  const rankIndex  = calculateRankIndex(totalMins);
  const eraIdx     = Math.floor(rankIndex / 10);
  const rankInEra  = rankIndex % 10;
  const era        = ERAS[Math.min(eraIdx, ERAS.length - 1)];
  const rankStart  = era.startMins + rankInEra * era.minsPerRank;
  const rankEnd    = rankStart + era.minsPerRank;
  const isAbsMax   = rankIndex === 99 && totalMins >= rankEnd;
  const progress   = isAbsMax ? 100 : Math.min(100, ((totalMins - rankStart) / era.minsPerRank) * 100);
  return { rankIndex, eraIdx, rankInEra: rankInEra + 1, era, rankStart, rankEnd, progress, isAbsMax };
};

export const getRankDisplay = (rankIndex: number) => {
  const eraIdx    = Math.floor(rankIndex / 10);
  const rankInEra = rankIndex % 10;
  const era       = ERAS[Math.min(eraIdx, ERAS.length - 1)];
  return {
    era,
    rankInEra: rankInEra + 1,
    roman: ROMAN[rankInEra],
    fullTitle: `${era.name} ${ROMAN[rankInEra]}`,
  };
};

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  totalAccumulatedMins: number;
  xp: number;
  rankIndex: number;
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
  tutorialSeen: boolean;

  createDomain: (name: string, weeklyTargetMins: number, beastId: string) => void;
  completeRitual: (domainId: string, beastId: string, mins: number) => void;
  checkAndApplyWeeklyDebt: () => void;
  setTutorialSeen: (seen: boolean) => void;
}

// ─── Achievement Definitions ──────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: 'tiempo' | 'bestias' | 'dominios' | 'sesiones' | 'progresion';
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
    desc: '100 minutos de enfoque total',
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
    desc: '10 horas de enfoque acumuladas',
    icon: '⏳',
    category: 'tiempo',
    color: '#22d3ee', border: '#164e63', bg: '#000f15',
    check: ({ player }) => player.totalAccumulatedMins >= 600,
  },
  {
    id: 'veterano_oscuro',
    title: 'Veterano Oscuro',
    desc: '50 horas de enfoque acumuladas',
    icon: '⚔️',
    category: 'tiempo',
    color: '#a78bfa', border: '#4c1d95', bg: '#0a000f',
    check: ({ player }) => player.totalAccumulatedMins >= 3000,
  },
  {
    id: 'leyenda_eterna',
    title: 'Leyenda Eterna',
    desc: '100 horas de enfoque acumuladas',
    icon: '👑',
    category: 'tiempo',
    color: '#fde047', border: '#854d0e', bg: '#0f0800',
    check: ({ player }) => player.totalAccumulatedMins >= 6000,
  },
  {
    id: 'mil_horas',
    title: 'Las Mil Horas',
    desc: '1000 horas de enfoque acumuladas',
    icon: '🌌',
    category: 'tiempo',
    color: '#f8fafc', border: '#4a4a5a', bg: '#060610',
    check: ({ player }) => player.totalAccumulatedMins >= 60000,
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
  {
    id: 'obsesionado',
    title: 'El Obsesionado',
    desc: '200 rituales completados',
    icon: '🔁',
    category: 'sesiones',
    color: '#f472b6', border: '#831843', bg: '#0f0008',
    check: ({ ritualSessions }) => ritualSessions.length >= 200,
  },
  // ── Progresión ────────────────────────────────────────────────────────────
  {
    id: 'primera_ascension',
    title: 'Primera Ascensión',
    desc: 'Alcanzar la Era II — Iniciado',
    icon: '🕯️',
    category: 'progresion',
    color: '#d1d5db', border: '#6b7280', bg: '#080808',
    check: ({ player }) => player.rankIndex >= 10,
  },
  {
    id: 'forja_de_guerra',
    title: 'Forja de Guerra',
    desc: 'Alcanzar la Era III — Guerrero',
    icon: '⚔️',
    category: 'progresion',
    color: '#4ade80', border: '#14532d', bg: '#000f05',
    check: ({ player }) => player.rankIndex >= 20,
  },
  {
    id: 'paladinato',
    title: 'El Paladinato',
    desc: 'Alcanzar la Era V — Paladín (~150h)',
    icon: '🛡️',
    category: 'progresion',
    color: '#fbbf24', border: '#92400e', bg: '#0f0800',
    check: ({ player }) => player.rankIndex >= 40,
  },
  {
    id: 'arte_oscuro',
    title: 'Arte Oscuro',
    desc: 'Alcanzar la Era VI — Conjurador (~333h)',
    icon: '🔮',
    category: 'progresion',
    color: '#c084fc', border: '#581c87', bg: '#0a000f',
    check: ({ player }) => player.rankIndex >= 50,
  },
  {
    id: 'señor_de_la_guerra',
    title: 'Señor de la Guerra',
    desc: 'Alcanzar la Era VII (~667h)',
    icon: '⚡',
    category: 'progresion',
    color: '#f87171', border: '#7f1d1d', bg: '#0f0000',
    check: ({ player }) => player.rankIndex >= 60,
  },
  {
    id: 'archimago_supremo',
    title: 'Archimago Supremo',
    desc: 'Alcanzar la Era VIII (~1333h)',
    icon: '🧙',
    category: 'progresion',
    color: '#a78bfa', border: '#4c1d95', bg: '#050010',
    check: ({ player }) => player.rankIndex >= 70,
  },
  {
    id: 'la_leyenda',
    title: 'La Leyenda',
    desc: 'Alcanzar la Era IX (~2333h)',
    icon: '👑',
    category: 'progresion',
    color: '#fde047', border: '#854d0e', bg: '#0f0800',
    check: ({ player }) => player.rankIndex >= 80,
  },
  {
    id: 'el_inmortal',
    title: 'El Inmortal',
    desc: 'Alcanzar la Era X — el rango más alto (~3667h)',
    icon: '💀',
    category: 'progresion',
    color: '#f8fafc', border: '#4a4a5a', bg: '#060610',
    check: ({ player }) => player.rankIndex >= 90,
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
  rankIndex: 0,
  unlockedAchievements: [],
  lastSessionXp: 0,
  lastSessionBossDefeated: false,
  lastSessionMins: 0,
};

export const useStore = create<FocusStore>()(
  persist(
    (set) => ({
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
      tutorialSeen: false,

      setTutorialSeen: (seen) => set({ tutorialSeen: seen }),

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

          const newDebtMins    = Math.max(0, domain.currentDebtMins - mins);
          const wasDefeated    = domain.isDefeated;
          const isNowDefeated  = newDebtMins <= 0;
          const bossDefeated   = isNowDefeated && !wasDefeated;

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
          const xpGained  = calculateXpGain(mins, bossDefeated);
          const newXp     = state.player.xp + xpGained;
          const newRank   = calculateRankIndex(newTotalAccumulatedMins);

          const updatedSessions = [
            ...state.ritualSessions,
            { id: crypto.randomUUID(), domainId, beastId, durationMins: mins, timestamp: Date.now() },
          ];

          const updatedPlayer: Player = {
            totalAccumulatedMins: newTotalAccumulatedMins,
            xp: newXp,
            rankIndex: newRank,
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
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        const s = persistedState as Record<string, unknown>;
        // For any previous version, recalculate rankIndex and mark tutorial as seen
        // (existing users already know how to use the app)
        if (version < 4) {
          const player = (s.player as Partial<Player & { level?: number }>) || {};
          const totalMins = player.totalAccumulatedMins || 0;
          const xp = player.xp || totalMins * 10;
          const { level: _l, ...playerRest } = player as { level?: number } & Partial<Player>;
          return {
            ...s,
            tutorialSeen: true,
            player: {
              ...INITIAL_PLAYER,
              ...playerRest,
              xp,
              rankIndex: calculateRankIndex(totalMins),
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

// ─── Achievement checker ──────────────────────────────────────────────────────

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
