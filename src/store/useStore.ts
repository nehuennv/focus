import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Domain {
  id: string;
  name: string;
  dailyTargetHours: number;   // hours per day (reference, not enforced)
  activeDaysPerWeek: number;  // 1–7, for weekly total calculation
  totalAccumulatedMins: number;
  beastId: string;
  avatar: string;             // emoji profile picture
}

export interface DailySession {
  totalDayMins: number;
  elapsedDayMins: number;
  activeDomainId: string;
  activeBeastId: string;
  phase: 'idle' | 'attacking' | 'resting';
  isDayComplete: boolean;
  chargedSecs: number;
  remainingAttackSecs: number;
  remainingRestSecs: number;
  lastAttackMins: number;
  lastAttackXp: number;
  lastBossDefeated: boolean;
  lastRankUp: boolean;
  lastNewRankIndex: number;
  lastExcessMins: number;
  dayDate: string; // YYYY-MM-DD
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
  { index: 0, name: 'Novicio', icon: '📜', color: '#9ca3af', border: '#374151', bg: '#060608', glow: 'rgba(156,163,175,0.15)', startMins: 0, minsPerRank: 50 },
  { index: 1, name: 'Iniciado', icon: '🕯️', color: '#d1d5db', border: '#6b7280', bg: '#080808', glow: 'rgba(209,213,219,0.15)', startMins: 500, minsPerRank: 100 },
  { index: 2, name: 'Guerrero', icon: '⚔️', color: '#4ade80', border: '#14532d', bg: '#000f05', glow: 'rgba(74,222,128,0.15)', startMins: 1500, minsPerRank: 250 },
  { index: 3, name: 'Cazador', icon: '🏹', color: '#60a5fa', border: '#1e3a5f', bg: '#00050f', glow: 'rgba(96,165,250,0.15)', startMins: 4000, minsPerRank: 500 },
  { index: 4, name: 'Paladín', icon: '🛡️', color: '#fbbf24', border: '#92400e', bg: '#0f0800', glow: 'rgba(251,191,36,0.15)', startMins: 9000, minsPerRank: 1100 },
  { index: 5, name: 'Conjurador', icon: '🔮', color: '#c084fc', border: '#581c87', bg: '#0a000f', glow: 'rgba(192,132,252,0.15)', startMins: 20000, minsPerRank: 2000 },
  { index: 6, name: 'Señor de Guerra', icon: '⚡', color: '#f87171', border: '#7f1d1d', bg: '#0f0000', glow: 'rgba(248,113,113,0.15)', startMins: 40000, minsPerRank: 4000 },
  { index: 7, name: 'Archimago', icon: '🧙', color: '#a78bfa', border: '#4c1d95', bg: '#050010', glow: 'rgba(167,139,250,0.2)', startMins: 80000, minsPerRank: 6000 },
  { index: 8, name: 'Leyenda', icon: '👑', color: '#fde047', border: '#854d0e', bg: '#0f0800', glow: 'rgba(253,224,71,0.2)', startMins: 140000, minsPerRank: 8000 },
  { index: 9, name: 'Inmortal', icon: '💀', color: '#f8fafc', border: '#4a4a5a', bg: '#060610', glow: 'rgba(248,250,252,0.25)', startMins: 220000, minsPerRank: 13000 },
];

export const calculateRankIndex = (totalMins: number): number => {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (totalMins >= era.startMins) {
      const rank = Math.min(Math.floor((totalMins - era.startMins) / era.minsPerRank), 9);
      return i * 10 + rank;
    }
  }
  return 0;
};

export const getRankProgress = (totalMins: number) => {
  const rankIndex = calculateRankIndex(totalMins);
  const eraIdx = Math.floor(rankIndex / 10);
  const rankInEra = rankIndex % 10;
  const era = ERAS[Math.min(eraIdx, ERAS.length - 1)];
  const rankStart = era.startMins + rankInEra * era.minsPerRank;
  const rankEnd = rankStart + era.minsPerRank;
  const isAbsMax = rankIndex === 99 && totalMins >= rankEnd;
  const progress = isAbsMax ? 100 : Math.min(100, ((totalMins - rankStart) / era.minsPerRank) * 100);
  return { rankIndex, eraIdx, rankInEra: rankInEra + 1, era, rankStart, rankEnd, progress, isAbsMax };
};

export const getRankDisplay = (rankIndex: number) => {
  const eraIdx = Math.floor(rankIndex / 10);
  const rankInEra = rankIndex % 10;
  const era = ERAS[Math.min(eraIdx, ERAS.length - 1)];
  return { era, rankInEra: rankInEra + 1, roman: ROMAN[rankInEra], fullTitle: `${era.name} ${ROMAN[rankInEra]}` };
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
  dailySession: DailySession | null;
  tutorialSeen: boolean;
  isDay: boolean;
  settings: { musicVol: number; sfxVol: number; hubScale: number };
  debugUnlockAll: boolean;

  createDomain: (name: string, dailyTargetHours: number, activeDaysPerWeek: number, beastId: string, avatar: string) => void;
  updateDomain: (id: string, patch: Partial<Pick<Domain, 'name' | 'dailyTargetHours' | 'activeDaysPerWeek' | 'beastId' | 'avatar'>>) => void;
  deleteDomain: (id: string) => void;
  completeAttack: (domainId: string, beastId: string, attackedMins: number) => void;
  startDailySession: (totalMins: number, domainId: string, beastId: string) => void;
  updateDailySession: (patch: Partial<DailySession>) => void;
  switchSessionDomain: (domainId: string, beastId: string) => void;
  endDailySession: () => void;
  setTutorialSeen: (seen: boolean) => void;
  setIsDay: (isDay: boolean) => void;
  setSettings: (patch: Partial<FocusStore['settings']>) => void;
  setDebugUnlockAll: (v: boolean) => void;
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
  { id: 'primera_llama', title: 'Primera Llama', desc: 'Completar tu primer ritual', icon: '🕯️', category: 'tiempo', color: '#fbbf24', border: '#92400e', bg: '#0f0800', check: ({ ritualSessions }) => ritualSessions.length >= 1 },
  { id: 'centurion', title: 'El Centurión', desc: '100 minutos de enfoque total', icon: '💯', category: 'tiempo', color: '#fbbf24', border: '#92400e', bg: '#0f0800', check: ({ player }) => player.totalAccumulatedMins >= 100 },
  { id: 'primer_alba', title: 'Primer Alba', desc: 'Completar una sesión de 60+ minutos', icon: '🌅', category: 'tiempo', color: '#fb923c', border: '#9a3412', bg: '#0f0500', check: ({ sessionMins }) => sessionMins >= 60 },
  { id: 'decano', title: 'El Decano', desc: '10 horas de enfoque acumuladas', icon: '⏳', category: 'tiempo', color: '#22d3ee', border: '#164e63', bg: '#000f15', check: ({ player }) => player.totalAccumulatedMins >= 600 },
  { id: 'veterano_oscuro', title: 'Veterano Oscuro', desc: '50 horas de enfoque acumuladas', icon: '⚔️', category: 'tiempo', color: '#a78bfa', border: '#4c1d95', bg: '#0a000f', check: ({ player }) => player.totalAccumulatedMins >= 3000 },
  { id: 'leyenda_eterna', title: 'Leyenda Eterna', desc: '100 horas de enfoque acumuladas', icon: '👑', category: 'tiempo', color: '#fde047', border: '#854d0e', bg: '#0f0800', check: ({ player }) => player.totalAccumulatedMins >= 6000 },
  { id: 'mil_horas', title: 'Las Mil Horas', desc: '1000 horas de enfoque acumuladas', icon: '🌌', category: 'tiempo', color: '#f8fafc', border: '#4a4a5a', bg: '#060610', check: ({ player }) => player.totalAccumulatedMins >= 60000 },
  // ── Bestias ───────────────────────────────────────────────────────────────
  { id: 'primera_sangre', title: 'Primera Sangre', desc: 'Derrotar a tu primer jefe', icon: '🩸', category: 'bestias', color: '#dc2626', border: '#7f1d1d', bg: '#0f0000', check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 1 },
  { id: 'cazador', title: 'El Cazador', desc: '5 derrotas en total', icon: '🏹', category: 'bestias', color: '#dc2626', border: '#7f1d1d', bg: '#0f0000', check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 5 },
  { id: 'matador', title: 'El Matador', desc: '20 derrotas en total', icon: '💀', category: 'bestias', color: '#dc2626', border: '#7f1d1d', bg: '#0f0000', check: ({ bestiary }) => bestiary.reduce((s, b) => s + b.defeats, 0) >= 20 },
  { id: 'especialista', title: 'Especialista', desc: '5 derrotas al mismo jefe', icon: '🎯', category: 'bestias', color: '#c084fc', border: '#581c87', bg: '#0a000f', check: ({ bestiary }) => bestiary.some(b => b.defeats >= 5) },
  { id: 'exterminador', title: 'El Exterminador', desc: '10 derrotas al mismo jefe', icon: '☠️', category: 'bestias', color: '#c084fc', border: '#581c87', bg: '#0a000f', check: ({ bestiary }) => bestiary.some(b => b.defeats >= 10) },
  { id: 'coleccionista', title: 'El Coleccionista', desc: 'Derrotar 5 bestias diferentes', icon: '📋', category: 'bestias', color: '#34d399', border: '#065f46', bg: '#000f08', check: ({ bestiary }) => bestiary.filter(b => b.defeats >= 1).length >= 5 },
  // ── Dominios ──────────────────────────────────────────────────────────────
  { id: 'el_forjador', title: 'El Forjador', desc: 'Crear tu primer dominio', icon: '🔨', category: 'dominios', color: '#60a5fa', border: '#1e3a5f', bg: '#000a15', check: ({ domains }) => domains.length >= 1 },
  { id: 'el_gremio', title: 'El Gremio', desc: 'Tener 5 dominios activos', icon: '🏛️', category: 'dominios', color: '#60a5fa', border: '#1e3a5f', bg: '#000a15', check: ({ domains }) => domains.length >= 5 },
  { id: 'dominio_purgado', title: 'Dominio Purgado', desc: 'Completar el objetivo diario de un dominio en un ataque', icon: '📜', category: 'dominios', color: '#4ade80', border: '#14532d', bg: '#000f05', check: ({ bossDefeated }) => bossDefeated },
  { id: 'gran_maestro', title: 'Gran Maestro', desc: '5 dominios con 10h+ acumuladas cada uno', icon: '🎓', category: 'dominios', color: '#4ade80', border: '#14532d', bg: '#000f05', check: ({ domains }) => domains.filter(d => d.totalAccumulatedMins >= 600).length >= 5 },
  { id: 'polimata', title: 'El Polímata', desc: '3 dominios con 60+ minutos cada uno', icon: '🧠', category: 'dominios', color: '#f0abfc', border: '#701a75', bg: '#0f000f', check: ({ domains }) => domains.filter(d => d.totalAccumulatedMins >= 60).length >= 3 },
  // ── Sesiones ──────────────────────────────────────────────────────────────
  { id: 'maratonista', title: 'El Maratonista', desc: 'Sesión de 2 horas o más', icon: '🏃', category: 'sesiones', color: '#fb923c', border: '#9a3412', bg: '#0f0500', check: ({ sessionMins }) => sessionMins >= 120 },
  { id: 'titan', title: 'El Titán', desc: 'Sesión de 4 horas o más', icon: '🗿', category: 'sesiones', color: '#f87171', border: '#7f1d1d', bg: '#0f0000', check: ({ sessionMins }) => sessionMins >= 240 },
  { id: 'decena', title: 'La Decena', desc: '10 rituales completados', icon: '🔟', category: 'sesiones', color: '#38bdf8', border: '#0c4a6e', bg: '#000a15', check: ({ ritualSessions }) => ritualSessions.length >= 10 },
  { id: 'centenario', title: 'El Centenario', desc: '50 rituales completados', icon: '💫', category: 'sesiones', color: '#818cf8', border: '#312e81', bg: '#05000f', check: ({ ritualSessions }) => ritualSessions.length >= 50 },
  { id: 'obsesionado', title: 'El Obsesionado', desc: '200 rituales completados', icon: '🔁', category: 'sesiones', color: '#f472b6', border: '#831843', bg: '#0f0008', check: ({ ritualSessions }) => ritualSessions.length >= 200 },
  // ── Progresión ────────────────────────────────────────────────────────────
  { id: 'primera_ascension', title: 'Primera Ascensión', desc: 'Alcanzar la Era II — Iniciado', icon: '🕯️', category: 'progresion', color: '#d1d5db', border: '#6b7280', bg: '#080808', check: ({ player }) => player.rankIndex >= 10 },
  { id: 'forja_de_guerra', title: 'Forja de Guerra', desc: 'Alcanzar la Era III — Guerrero', icon: '⚔️', category: 'progresion', color: '#4ade80', border: '#14532d', bg: '#000f05', check: ({ player }) => player.rankIndex >= 20 },
  { id: 'paladinato', title: 'El Paladinato', desc: 'Alcanzar la Era V — Paladín (~150h)', icon: '🛡️', category: 'progresion', color: '#fbbf24', border: '#92400e', bg: '#0f0800', check: ({ player }) => player.rankIndex >= 40 },
  { id: 'arte_oscuro', title: 'Arte Oscuro', desc: 'Alcanzar la Era VI — Conjurador (~333h)', icon: '🔮', category: 'progresion', color: '#c084fc', border: '#581c87', bg: '#0a000f', check: ({ player }) => player.rankIndex >= 50 },
  { id: 'señor_de_la_guerra', title: 'Señor de la Guerra', desc: 'Alcanzar la Era VII (~667h)', icon: '⚡', category: 'progresion', color: '#f87171', border: '#7f1d1d', bg: '#0f0000', check: ({ player }) => player.rankIndex >= 60 },
  { id: 'archimago_supremo', title: 'Archimago Supremo', desc: 'Alcanzar la Era VIII (~1333h)', icon: '🧙', category: 'progresion', color: '#a78bfa', border: '#4c1d95', bg: '#050010', check: ({ player }) => player.rankIndex >= 70 },
  { id: 'la_leyenda', title: 'La Leyenda', desc: 'Alcanzar la Era IX (~2333h)', icon: '👑', category: 'progresion', color: '#fde047', border: '#854d0e', bg: '#0f0800', check: ({ player }) => player.rankIndex >= 80 },
  { id: 'el_inmortal', title: 'El Inmortal', desc: 'Alcanzar la Era X — el rango más alto (~3667h)', icon: '💀', category: 'progresion', color: '#f8fafc', border: '#4a4a5a', bg: '#060610', check: ({ player }) => player.rankIndex >= 90 },
];

// ─── Bestiary Data ────────────────────────────────────────────────────────────

export const BEASTS = {
  albedo: { id: 'albedo', name: 'Albedo', fullName: 'Albedo, la Musa Fragmentada', color: '#8b6a3e', floats: true, scale: 1.0, spriteImg: 'img/pixeladas/albedo.png', bgImg: 'img/originales/albedoBg.png', lore: 'Albedo es el naufragio de la identidad. Fue el espejo donde otros se vieron reflejados, hasta que se pulverizó bajo el peso de las expectativas ajenas. No tiene forma porque se la dieron toda, y en el proceso, no le dejaron nada.' },
  alberic: { id: 'alberic', name: 'Alberic', fullName: 'Alberic, el Escriba sin Rostro', color: '#8b6a3e', floats: true, scale: 1.1, spriteImg: 'img/pixeladas/alberic.png', bgImg: 'img/originales/albericBg.png', lore: 'Alberic creyó que el conocimiento era un fin en sí mismo. Devoró bibliotecas enteras, acumulando sabiduría como un avaro acumula oro, hasta que el peso de lo inútil le arrancó el rostro y la identidad.' },
  aurelian: { id: 'aurelian', name: 'Aurelian', fullName: 'Aurelian, el Juez Saliente', color: '#4a5e58', floats: false, scale: 1.3, spriteImg: 'img/pixeladas/aurelian.png', bgImg: 'img/originales/aurelianBg.png', lore: 'Aurelian es el eco internalizado de cada "no eres suficiente". No juzga con una espada, sino con el silencio ensordecedor de la autocrítica convertida en verdugo.' },
  horrax: { id: 'horrax', name: 'Horrax', fullName: 'Horrax, el Vástago de la Escoria', color: '#7a3a1e', floats: false, scale: 1.45, spriteImg: 'img/pixeladas/horrax.png', bgImg: 'img/originales/horraxBg.png', lore: 'Horrax no fue derrotado por un enemigo, sino por el yunque de su propia obsesión. Es la encarnación de la autoexplotación, la crítica feroz a una cultura que venera el esfuerzo infinito.' },
  kaelen: { id: 'kaelen', name: 'Kaelen', fullName: 'Kaelen, el Indeciso', color: '#6a6a6a', floats: false, scale: 0.85, spriteImg: 'img/pixeladas/kaelen.png', bgImg: 'img/originales/kaelenBg.png', lore: 'Kaelen es el cementerio de las posibilidades. Su tragedia no es la falta de potencial, sino la maldición de verlo todo y atreverse con nada.' },
  lysandra: { id: 'lysandra', name: 'Lysandra', fullName: 'Lysandra, la Vidente Estancada', color: '#2a8a9a', floats: true, scale: 1.05, spriteImg: 'img/pixeladas/lysandra.png', bgImg: 'img/originales/lysandraBg.png', lore: 'Lysandra no vive en el tiempo, es el tiempo quien vive en ella. Un río de ayeres y mañanas que la ahoga, impidiéndole habitar el único instante real: el ahora.' },
  maro: { id: 'maro', name: 'Maro', fullName: 'Maro, el Bufón Dorado', color: '#c8a020', floats: true, scale: 0.8, spriteImg: 'img/pixeladas/maro.png', bgImg: 'img/originales/maroBg.png', lore: 'Maro es el susurro seductor de la distracción. No roba la vida con un cuchillo, sino con una promesa vacía de diversión eterna.' },
  morwenna: { id: 'morwenna', name: 'Morwenna', fullName: 'Morwenna, Madre de los Brotes Marchitos', color: '#8a7a1a', floats: false, scale: 1.0, spriteImg: 'img/pixeladas/morwenna.png', bgImg: 'img/originales/morwennaBg.png', lore: 'Morwenna es el jardín de los comienzos abortados. Cada sueño postergado, cada talento abandonado por miedo o pereza, hizo que una de sus flores se pudriera en el tallo.' },
  nyr: { id: 'nyr', name: 'Nyr', fullName: 'Nyr, el Santo Encadenado', color: '#7a8a9a', floats: false, scale: 1.0, spriteImg: 'img/pixeladas/nyr.png', bgImg: 'img/originales/nyrBg.png', lore: 'Nyr es la bondad convertida en patología. Se entregó tanto a las causas ajenas que olvidó cómo tener una propia.' },
  thereon: { id: 'thereon', name: 'Thereon', fullName: 'Thereon, el Eco de la Perfección', color: '#3a8068', floats: true, scale: 1.15, spriteImg: 'img/pixeladas/thereon.png', bgImg: 'img/originales/thereonBg.png', lore: 'Thereon es el vacío que queda tras perseguir un espejismo. Nació de la comparación y se alimenta de la insatisfacción.' },
  vesper: { id: 'vesper', name: 'Vesper', fullName: 'Vesper, el Festín Vacío', color: '#3a6a9a', floats: true, scale: 1.2, spriteImg: 'img/pixeladas/vesper.png', bgImg: 'img/originales/vesperBg.png', lore: 'Vesper es el hambre que persiste después del banquete. Gobernó la noche, creyendo que la validación externa podría llenar el vacío interno.' },
};

// ─── Beast Unlock Order ───────────────────────────────────────────────────────

export const BEAST_UNLOCK_ORDER: Array<{ beastId: keyof typeof BEASTS; eraIndex: number }> = [
  { beastId: 'maro', eraIndex: 0 },
  { beastId: 'albedo', eraIndex: 0 },
  { beastId: 'kaelen', eraIndex: 1 },
  { beastId: 'morwenna', eraIndex: 1 },
  { beastId: 'alberic', eraIndex: 2 },
  { beastId: 'nyr', eraIndex: 2 },
  { beastId: 'lysandra', eraIndex: 3 },
  { beastId: 'aurelian', eraIndex: 4 },
  { beastId: 'thereon', eraIndex: 5 },
  { beastId: 'vesper', eraIndex: 6 },
  { beastId: 'horrax', eraIndex: 7 },
];

export const getBeastEraRequirement = (beastId: string): number =>
  BEAST_UNLOCK_ORDER.find(b => b.beastId === beastId)?.eraIndex ?? 0;

export const isBeastUnlocked = (beastId: string, playerEraIndex: number, forceUnlock = false): boolean =>
  forceUnlock || playerEraIndex >= getBeastEraRequirement(beastId);

// ─── Weekly Stats Helper ──────────────────────────────────────────────────────

const getMondayMidnightOf = (weekOffset = 0): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff - weekOffset * 7);
  return d.getTime();
};

export const getWeekMins = (domainId: string, ritualSessions: RitualSession[], weekOffset = 0): number => {
  const weekStart = getMondayMidnightOf(weekOffset);
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  return ritualSessions
    .filter(s => s.domainId === domainId && s.timestamp >= weekStart && s.timestamp < weekEnd)
    .reduce((sum, s) => sum + s.durationMins, 0);
};

export const getTodayMins = (domainId: string, ritualSessions: RitualSession[]): number => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return ritualSessions
    .filter(s => s.domainId === domainId && s.timestamp >= todayStart.getTime())
    .reduce((sum, s) => sum + s.durationMins, 0);
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
      isDay: false,
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
      dailySession: null,
      tutorialSeen: false,
      settings: { musicVol: 0.42, sfxVol: 0.6, hubScale: 1.0 },
      debugUnlockAll: false,

      setTutorialSeen: (seen) => set({ tutorialSeen: seen }),
      setIsDay: (isDay) => set({ isDay }),
      setSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),
      setDebugUnlockAll: (v) => set({ debugUnlockAll: v }),

      createDomain: (name, dailyTargetHours, activeDaysPerWeek, beastId, avatar) => {
        const beast = BEASTS[beastId as keyof typeof BEASTS];
        if (!beast) return;
        set((state) => {
          const newDomains = [
            ...state.domains,
            { id: crypto.randomUUID(), name, dailyTargetHours, activeDaysPerWeek, totalAccumulatedMins: 0, beastId, avatar },
          ];
          const newAchievements = checkNewAchievements(state.player, newDomains, state.bestiary, state.ritualSessions, 0, false);
          return {
            domains: newDomains,
            player: { ...state.player, unlockedAchievements: [...state.player.unlockedAchievements, ...newAchievements] },
          };
        });
      },

      updateDomain: (id, patch) => set((state) => ({
        domains: state.domains.map(d => d.id === id ? { ...d, ...patch } : d),
      })),

      deleteDomain: (id) => set((state) => ({
        domains: state.domains.filter(d => d.id !== id),
        dailySession: state.dailySession?.activeDomainId === id ? null : state.dailySession,
      })),

      startDailySession: (totalMins, domainId, beastId) => {
        const dayDate = new Date().toISOString().slice(0, 10);
        set({
          dailySession: {
            totalDayMins: totalMins,
            elapsedDayMins: 0,
            activeDomainId: domainId,
            activeBeastId: beastId,
            phase: 'idle',
            isDayComplete: false,
            chargedSecs: 0,
            remainingAttackSecs: 0,
            remainingRestSecs: 0,
            lastAttackMins: 0,
            lastAttackXp: 0,
            lastBossDefeated: false,
            lastRankUp: false,
            lastNewRankIndex: 0,
            lastExcessMins: 0,
            dayDate,
          },
        });
      },

      updateDailySession: (patch) => {
        set((state) => {
          if (!state.dailySession) return state;
          return { dailySession: { ...state.dailySession, ...patch } };
        });
      },

      switchSessionDomain: (domainId, beastId) => {
        set((state) => {
          if (!state.dailySession) return state;
          return { dailySession: { ...state.dailySession, activeDomainId: domainId, activeBeastId: beastId } };
        });
      },

      endDailySession: () => set({ dailySession: null }),

      completeAttack: (domainId, beastId, attackedMins) => {
        set((state) => {
          const domain = state.domains.find(d => d.id === domainId);
          if (!domain || !state.dailySession) return state;

          const dailyTargetMins = Math.max(1, Math.round(domain.dailyTargetHours * 60));
          const todayBefore = getTodayMins(domainId, state.ritualSessions);
          const bossDefeated = domain.dailyTargetHours > 0 && (todayBefore + attackedMins) >= dailyTargetMins;
          const excessMins = domain.dailyTargetHours > 0
            ? Math.max(0, todayBefore + attackedMins - dailyTargetMins)
            : 0;

          const updatedBestiary = state.bestiary.map(entry =>
            entry.beastId === beastId
              ? { ...entry, defeats: bossDefeated ? entry.defeats + 1 : entry.defeats, totalMinsDefeated: entry.totalMinsDefeated + attackedMins }
              : entry
          );

          const updatedDomains = state.domains.map(d =>
            d.id === domainId
              ? { ...d, totalAccumulatedMins: d.totalAccumulatedMins + attackedMins }
              : d
          );

          const newTotalMins = state.player.totalAccumulatedMins + attackedMins;
          const bonusXp = Math.floor(excessMins * 8);
          const xpGained = calculateXpGain(attackedMins, bossDefeated) + bonusXp;
          const newXp = state.player.xp + xpGained;
          const newRankIndex = calculateRankIndex(newTotalMins);
          const leveledUp = newRankIndex > state.player.rankIndex;

          const updatedSessions = [
            ...state.ritualSessions,
            { id: crypto.randomUUID(), domainId, beastId, durationMins: attackedMins, timestamp: Date.now() },
          ];

          const updatedPlayer: Player = {
            totalAccumulatedMins: newTotalMins,
            xp: newXp,
            rankIndex: newRankIndex,
            unlockedAchievements: state.player.unlockedAchievements,
            lastSessionXp: xpGained,
            lastSessionBossDefeated: bossDefeated,
            lastSessionMins: attackedMins,
          };

          const newAchievements = checkNewAchievements(updatedPlayer, updatedDomains, updatedBestiary, updatedSessions, attackedMins, bossDefeated);
          updatedPlayer.unlockedAchievements = [...state.player.unlockedAchievements, ...newAchievements];

          const newElapsed = state.dailySession.elapsedDayMins + attackedMins;
          const isDayComplete = newElapsed >= state.dailySession.totalDayMins;

          return {
            domains: updatedDomains,
            bestiary: updatedBestiary,
            player: updatedPlayer,
            ritualSessions: updatedSessions,
            dailySession: {
              ...state.dailySession,
              elapsedDayMins: newElapsed,
              phase: 'resting',
              isDayComplete,
              chargedSecs: 0,
              remainingAttackSecs: 0,
              remainingRestSecs: 600,
              lastAttackMins: attackedMins,
              lastAttackXp: xpGained,
              lastBossDefeated: bossDefeated,
              lastRankUp: leveledUp,
              lastNewRankIndex: newRankIndex,
              lastExcessMins: excessMins,
            },
          };
        });
      },
    }),
    {
      name: 'focus-souls-storage',
      version: 6,
      migrate: (persistedState: unknown, version: number) => {
        const s = persistedState as Record<string, unknown>;

        // v3 and below → v4 base migration
        if (version < 4) {
          const player = (s.player as Partial<Player & { level?: number }>) || {};
          const totalMins = player.totalAccumulatedMins || 0;
          const xp = player.xp || totalMins * 10;
          const { level: _l, ...playerRest } = player as { level?: number } & Partial<Player>;
          Object.assign(s, {
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
          });
        }

        // v4 → v5: convert debt-based domains to daily-target domains
        if (version < 5) {
          const oldDomains = (s.domains as any[]) || [];
          s.domains = oldDomains.map((d: any) => {
            const weeklyMins = d.weeklyTargetMins || 300;
            const rawHours = weeklyMins / (5 * 60);
            const dailyTargetHours = Math.max(0.5, Math.round(rawHours * 2) / 2);
            return {
              id: d.id || crypto.randomUUID(),
              name: d.name || 'Dominio',
              dailyTargetHours,
              activeDaysPerWeek: 5,
              totalAccumulatedMins: d.totalAccumulatedMins || 0,
              beastId: d.beastId || 'maro',
            };
          });
          s.dailySession = null;
          delete (s as any).lastSyncDate;
        }

        // v5 → v6: add avatar emoji to existing domains
        if (version < 6) {
          const domains = (s.domains as any[]) || [];
          s.domains = domains.map((d: any) => ({ ...d, avatar: d.avatar || '📚' }));
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
