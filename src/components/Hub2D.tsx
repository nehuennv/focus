import { useEffect, useState, useCallback } from 'react';
import { useMovement, type Direction } from '../hooks/useMovement';
import { useStore, BEASTS, LEVELS } from '../store/useStore';
import { RPGDialogue, type DialogueOption } from './RPGDialogue';
import { Encounter } from './Encounter';

// ─── Grid constants ────────────────────────────────────────────────────────────
const TILE = 42;
const COLS = 20;
const ROWS = 15;

// ─── Tile type IDs ─────────────────────────────────────────────────────────────
const FLOOR = 0;
// const WALL = 1;
const PORTAL = 2;   // → Ritual
const SHELF = 3;   // → Bestiario
const DESK = 4;   // → Dominios

const WALKABLE = new Set([FLOOR, PORTAL, SHELF, DESK]);

// ─── Tile map 20 × 15 ─────────────────────────────────────────────────────────
// Límites del área caminable:
//   Izquierda : cols 0-1 son muro  → caminable desde col 2
//   Derecha   : cols 18-19 son muro → caminable hasta col 17
//   Superior  : filas 0-3 son muro  → caminable desde fila 4
//   Inferior  : fila 14 es muro
const MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0  ← pared superior (original)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 1  ← pared superior -1
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 2  ← pared superior -2
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 3  ← pared superior -3
  [1, 1, 1, 1, 1, 0, 0, 0, 2, 2, 2, 2, 0, 0, 1, 1, 1, 1, 1, 1], // 4  PORTAL(8-11) ← top-center
  [1, 1, 3, 3, 3, 3, 0, 0, 2, 2, 2, 2, 0, 0, 1, 1, 1, 1, 1, 1], // 5  SHELF(3-4)
  [1, 1, 3, 3, 3, 3, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 1, 1, 1, 1, 1], // 7
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 8  DESK(13)
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 10
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 11
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 12
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 13
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 14 ← pared inferior
];

const PLAYER_START = { x: 9, y: 8 };

// ─── Character sprites ─────────────────────────────────────────────────────────
const SPRITES: Record<Direction, { idle: string; frames: [string, string] }> = {
  down: {
    idle: 'img/personaje/de-frente-reposo.png',
    frames: ['img/personaje/de-frente-pie-der-adelante.png',
      'img/personaje/de-frente-pie-izq-adelante.png'],
  },
  up: {
    idle: 'img/personaje/de-espaldas-reposo.png',
    frames: ['img/personaje/de-espaldas-pie-der-adelante.png',
      'img/personaje/de-espaldas-pie-izq-adelante.png'],
  },
  right: {
    idle: 'img/personaje/costado-der-pie-der-adelante.png',
    frames: ['img/personaje/costado-der-pie-der-adelante.png',
      'img/personaje/costado-der-pie-izq-adelante.png'],
  },
  left: {
    idle: 'img/personaje/costado-izq-pie-der-adelante.png',
    frames: ['img/personaje/costado-izq-pie-der-adelante.png',
      'img/personaje/costado-izq-pie-izq-adelante.png'],
  },
};

// Sprite display — fixed height only, width is auto (preserves each sprite's aspect ratio)
const SPR_H = TILE * 3; // 126 px — ajusta este único valor para cambiar el tamaño

// ─── Trigger zone overlays (for visual glow on the map) ───────────────────────
const TRIGGER_ZONES = [
  { key: 'portal', col: 8, row: 4, span: 4, color: '180, 18, 18', border: '248,113,113', label: 'PORTAL', tile: PORTAL },
  { key: 'shelf', col: 3, row: 5, span: 2, color: '146,64,14', border: '217,119,6', label: 'BESTIARIO', tile: SHELF },
  { key: 'desk', col: 12, row: 8, span: 2, color: '133, 133, 133', border: '133, 133, 133', label: 'DOMINIOS', tile: DESK },
];

// ─── Trigger proximity info ────────────────────────────────────────────────────
const TRIGGER_INFO: Record<number, { label: string; hint: string; color: string }> = {
  [PORTAL]: { label: 'PORTAL', hint: 'Comenzar Ritual', color: '#ff362bff' },
  [SHELF]: { label: 'BIBLIOTECA', hint: 'Abrir Bestiario', color: '#f59e0b' },
  [DESK]: { label: 'ESCRITORIO', hint: 'Ver Dominios', color: '#22d3ee' },
};

// ─── Duration options ──────────────────────────────────────────────────────────
const DURATION_OPTIONS: DialogueOption[] = [
  { id: '60', label: '1 hora   · 60 min' },
  { id: '120', label: '2 horas  · 120 min' },
  { id: '180', label: '3 horas  · 180 min' },
  { id: '240', label: '4 horas  · 240 min' },
  { id: '300', label: '5 horas  · 300 min' },
  { id: '360', label: '6 horas  · 360 min' },
  { id: '420', label: '7 horas  · 420 min' },
  { id: '480', label: '8 horas  · 480 min' },
];

// ─── Ritual state machine ──────────────────────────────────────────────────────
type DialogPhase = 'duration' | 'domain' | 'beast';
interface RitualData { durationMins: number; domainId: string; beastId: string; }

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Hub2DProps {
  onOpenBestiary: () => void;
  onOpenDomains: () => void;
  onOpenTrophies: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function Hub2D({ onOpenBestiary, onOpenDomains, onOpenTrophies }: Hub2DProps) {
  const { domains, player } = useStore();
  const currentLevelData = LEVELS.find(l => l.level === player.level) ?? LEVELS[0];
  const nextLevelData     = LEVELS.find(l => l.level === player.level + 1);
  const isMaxLevel        = player.level >= LEVELS[LEVELS.length - 1].level;
  const xpIntoLevel       = player.xp - currentLevelData.xpRequired;
  const xpNeededForLevel  = isMaxLevel ? 1 : (nextLevelData!.xpRequired - currentLevelData.xpRequired);
  const levelProgress     = isMaxLevel ? 100 : Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100);

  // Ritual state
  const [dialogPhase, setDialogPhase] = useState<DialogPhase | null>(null);
  const [ritual, setRitual] = useState<Partial<RitualData>>({});
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [inEncounter, setInEncounter] = useState(false);

  const isBlocked = dialogPhase !== null || fadeToBlack || inEncounter;

  // Movement
  const { position, facing, isMoving } = useMovement({
    initialPosition: PLAYER_START,
    tileMap: MAP,
    walkableTiles: WALKABLE,
    enabled: !isBlocked,
  });

  // Walk frame — toggles on every step
  const [walkFrame, setWalkFrame] = useState<0 | 1>(0);
  useEffect(() => {
    setWalkFrame(f => (f === 0 ? 1 : 0) as 0 | 1);
  }, [position]);

  const currentSprite = isMoving
    ? SPRITES[facing].frames[walkFrame]
    : SPRITES[facing].idle;

  const currentTile = MAP[position.y]?.[position.x] ?? FLOOR;
  const triggerInfo = !isBlocked ? (TRIGGER_INFO[currentTile] ?? null) : null;

  // ── Launch encounter ───────────────────────────────────────────────────────
  const launchEncounter = useCallback((finalRitual: RitualData) => {
    setRitual(finalRitual);
    setDialogPhase(null);
    setFadeToBlack(true);
    setTimeout(() => setInEncounter(true), 900);
  }, []);

  // ── Dialogue handlers ──────────────────────────────────────────────────────
  const handleDurationSelect = useCallback((opt: DialogueOption) => {
    setRitual(prev => ({ ...prev, durationMins: Number(opt.id) }));
    setDialogPhase('domain');
  }, []);

  const handleDomainSelect = useCallback((opt: DialogueOption) => {
    setRitual(prev => ({ ...prev, domainId: opt.id }));
    setDialogPhase('beast');
  }, []);

  const handleBeastSelect = useCallback((opt: DialogueOption) => {
    setRitual(prev => {
      const final: RitualData = {
        durationMins: prev.durationMins ?? 60,
        domainId: prev.domainId ?? '',
        beastId: opt.id,
      };
      launchEncounter(final);
      return prev;
    });
  }, [launchEncounter]);

  // ── Dialogue props per phase ───────────────────────────────────────────────
  const getDialogueProps = () => {
    switch (dialogPhase) {
      case 'duration':
        return {
          speakerName: 'PORTAL OSCURO',
          text: '¿Qué ofrenda de tiempo entregarás en este ciclo?',
          options: DURATION_OPTIONS,
          onSelect: handleDurationSelect,
          onClose: () => setDialogPhase(null),
        };
      case 'domain': {
        if (domains.length === 0) {
          return {
            speakerName: 'PORTAL OSCURO',
            text: 'No tienes dominios forjados. Ve al Escritorio a crear uno primero.',
            options: [],
            onClose: () => setDialogPhase(null),
          };
        }
        return {
          speakerName: 'PORTAL OSCURO',
          text: '¿Qué dominio deseas purgar hoy?',
          options: domains.map(d => ({
            id: d.id,
            label: `${d.name.slice(0, 22).padEnd(22)} · ${d.currentDebtMins}min`,
          })),
          onSelect: handleDomainSelect,
          onClose: () => setDialogPhase(null),
        };
      }
      case 'beast':
        return {
          speakerName: 'PORTAL OSCURO',
          text: '¿A qué bestia te enfrentarás en el combate?',
          options: Object.values(BEASTS).map(b => ({ id: b.id, label: b.name })),
          onSelect: handleBeastSelect,
          onClose: () => setDialogPhase(null),
        };
      default:
        return null;
    }
  };

  // ── Hub ENTER/SPACE activation ─────────────────────────────────────────────
  useEffect(() => {
    if (isBlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();

      // Check proximity to triggers (including 1 tile away)
      const isNearPortal = (currentTile === PORTAL) || (Math.abs(position.x - 8) <= 4 && Math.abs(position.y - 4) <= 1);
      const isNearShelf = (currentTile === SHELF) || (Math.abs(position.x - 3) <= 2 && Math.abs(position.y - 5) <= 1);
      const isNearDesk = (currentTile === DESK) || (Math.abs(position.x - 12) <= 2 && Math.abs(position.y - 8) <= 1);

      if (isNearPortal) setDialogPhase('duration');
      else if (isNearShelf) onOpenBestiary();
      else if (isNearDesk) onOpenDomains();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBlocked, currentTile, position, onOpenBestiary, onOpenDomains]);

  // ── Encounter full-screen ─────────────────────────────────────────────────
  if (inEncounter && ritual.domainId && ritual.beastId) {
    return (
      <Encounter
        domainId={ritual.domainId}
        selectedBeastId={ritual.beastId}
        onBack={() => { setInEncounter(false); setFadeToBlack(false); setRitual({}); }}
      />
    );
  }

  // ── Hub render ────────────────────────────────────────────────────────────
  const gridW = COLS * TILE;
  const gridH = ROWS * TILE;
  const dialogueProps = getDialogueProps();

  // Player sprite pixel position
  // X = centro del tile; Y = pies en el borde inferior del tile
  const sprCenterX = position.x * TILE + TILE / 2;
  const sprTop = position.y * TILE + TILE - SPR_H;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#0a0504] select-none"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* ── Top HUD ── */}
      {!isBlocked && (
        <div className="mb-3 w-full flex items-center justify-between px-2" style={{ maxWidth: COLS * TILE }}>
          <div className="flex gap-6" style={{ color: '#3d2817', fontSize: '7px' }}>
            <span>WASD · FLECHAS → MOVER</span>
            <span>ENTER → INTERACTUAR</span>
          </div>
          {/* Level / XP indicator */}
          <button
            onClick={onOpenTrophies}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '2px solid #2d1b69', background: '#07000a',
              padding: '5px 10px', cursor: 'pointer', boxShadow: '2px 2px 0 #000',
            }}
          >
            <span style={{ fontSize: 12 }}>{currentLevelData.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '7px', color: '#c084fc', fontFamily: '"Press Start 2P", monospace', marginBottom: 2 }}>
                LV {player.level} · {player.xp.toLocaleString()} XP
              </div>
              {/* Mini XP bar */}
              <div style={{ width: 80, height: 4, background: '#07000f', border: '1px solid #2d1b69', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${levelProgress}%`, background: '#7c3aed' }} />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Grid container ── */}
      <div
        className="relative overflow-hidden"
        style={{
          width: gridW,
          height: gridH,
          border: '4px solid #1a1008',
          boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 120px rgba(0,0,0,0.7)',
        }}
      >
        {/* Layer 0 — Room background */}
        <img
          src="img/background-room.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Layer 1 — Trigger zone glow overlays */}
        {TRIGGER_ZONES.map(({ key, col, row, span, color, tile }) => {
          const isActive = currentTile === tile && !isBlocked;
          // Portal (ritual) - solo un glow rojo difuminado, SIN bordes ni cuadrados
          if (key === 'portal') {
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: col * TILE,
                  top: row * TILE,
                  width: span * TILE,
                  height: TILE,
                  background: 'transparent',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  boxShadow: isActive
                    ? `0 0 40px rgba(220, 38, 38, 0.7)`
                    : `0 0 20px rgba(180, 18, 18, 0.25)`,
                  transition: 'box-shadow 0.3s ease',
                  pointerEvents: 'none',
                  zIndex: 1,
                  animation: 'portal-pulse 2.5s ease-in-out infinite',
                }}
              />
            );
          }
          // Bestiario - glow sutil sin bordes marcados
          if (key === 'shelf') {
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: col * TILE,
                  top: row * TILE,
                  width: span * TILE,
                  height: TILE,
                  background: `rgba(${color}, ${isActive ? 0.25 : 0.08})`,
                  borderRadius: '4px',
                  boxShadow: isActive
                    ? `0 0 25px rgba(${color}, 0.5)`
                    : `0 0 10px rgba(${color}, 0.15)`,
                  transition: 'box-shadow 0.2s ease',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            );
          }
          // Dominios - mismo efecto que ritual pero en gris
          if (key === 'desk') {
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: col * TILE,
                  top: row * TILE,
                  width: span * TILE,
                  height: TILE,
                  background: 'transparent',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  boxShadow: isActive
                    ? `0 0 40px rgba(133, 133, 133, 0.7)`
                    : `0 0 20px rgba(133, 133, 133, 0.25)`,
                  transition: 'box-shadow 0.3s ease',
                  pointerEvents: 'none',
                  zIndex: 1,
                  animation: 'desk-pulse 2.5s ease-in-out infinite',
                }}
              />
            );
          }
          return null;
        })}

        {/* Layer 2 — Zone labels (always subtle, brighter when active) */}
        {TRIGGER_ZONES.map(({ key, col, row, span, border, label, tile }) => {
          const isActive = currentTile === tile && !isBlocked;
          return (
            <div
              key={`lbl-${key}`}
              style={{
                position: 'absolute',
                left: col * TILE,
                top: row * TILE,
                width: span * TILE,
                height: TILE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: '5px',
                  color: `rgba(${border}, ${isActive ? 1 : 0.5})`,
                  textShadow: isActive ? `0 0 8px rgba(${border}, 0.8)` : 'none',
                  letterSpacing: '0.1em',
                  transition: 'color 0.2s, text-shadow 0.2s',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}

        {/* Layer 3 — Player character sprite
            left apunta al centro del tile; translateX(-50%) lo centra horizontalmente.
            El ancho es 'auto' para que cada sprite respete su propio aspect ratio. */}
        <img
          src={currentSprite}
          alt="Player"
          style={{
            position: 'absolute',
            left: sprCenterX,
            top: sprTop,
            height: SPR_H,
            width: 'auto',
            transform: 'translateX(-50%)',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.7))',
            zIndex: 10,
            transition: 'left 0.12s linear, top 0.12s linear',
          }}
        />

        {/* Layer 4 — Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />

        {/* Layer 5 — Fade-to-black for encounter transition */}
        {fadeToBlack && (
          <>
            {/* Shake effect on the grid container */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                animation: 'encounter-shake 0.9s ease-in-out',
                pointerEvents: 'none',
                zIndex: 40,
              }}
            />
            {/* White flash */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#fff',
                zIndex: 55,
                animation: 'encounter-flash 0.9s ease-out forwards',
              }}
            />
            {/* Red glow border */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '4px solid #dc2626',
                zIndex: 45,
                animation: 'encounter-red-glow 0.9s ease-in-out',
                pointerEvents: 'none',
              }}
            />
            {/* Fade to black overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#000',
                zIndex: 50,
                animation: 'hub-fadeblack 0.9s ease-in forwards',
              }}
            />
          </>
        )}
      </div>

      {/* ── Trigger prompt strip ── */}
      <div style={{ marginTop: 14, height: 32 }}>
        {triggerInfo ? (
          <div
            style={{
              padding: '8px 20px',
              border: `2px solid ${triggerInfo.color}`,
              color: triggerInfo.color,
              fontSize: '9px',
              fontWeight: 'bold',
              boxShadow: `0 0 20px ${triggerInfo.color}66, inset 0 0 10px ${triggerInfo.color}22`,
              animation: 'prompt-pulse 1.2s ease-in-out infinite',
              textShadow: `0 0 8px ${triggerInfo.color}`,
            }}
          >
            [{triggerInfo.label}] — ENTER para {triggerInfo.hint}
          </div>
        ) : (
          <div
            style={{
              color: '#a1a1aa',
              fontSize: '9px',
              textShadow: '0 0 10px rgba(161,161,170,0.5)',
              animation: 'explore-fade 2s ease-in-out infinite',
            }}
          >
            ✦ Explora la habitación ✦
          </div>
        )}
      </div>

      {/* ── RPG Dialogue overlay ── */}
      {dialogueProps && <RPGDialogue {...dialogueProps} />}

      <style>{`
        @keyframes desk-pulse {
          0%, 100% {
            opacity: 0.7;
            box-shadow: 0 0 15px rgba(133, 133, 133, 0.3);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 25px rgba(133, 133, 133, 0.5);
          }
        }
        @keyframes portal-pulse {
          0%, 100% {
            opacity: 0.7;
            box-shadow: 0 0 15px rgba(248, 113, 113, 0.3);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 25px rgba(248, 113, 113, 0.5);
          }
        }
        @keyframes hub-fadeblack {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes prompt-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        @keyframes explore-fade {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1; text-shadow: 0 0 20px rgba(161,161,170,0.8); }
        }
        @keyframes encounter-shake {
          0%, 100% { transform: translateX(0); }
          10%      { transform: translateX(-10px); }
          20%      { transform: translateX(10px); }
          30%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          50%      { transform: translateX(-10px); }
          60%      { transform: translateX(10px); }
          70%      { transform: translateX(-10px); }
          80%      { transform: translateX(10px); }
          90%      { transform: translateX(-10px); }
        }
        @keyframes encounter-flash {
          0%   { opacity: 0; }
          30%  { opacity: 1; background: #fff; }
          100% { opacity: 0; }
        }
        @keyframes encounter-red-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(220,38,38,0.5), inset 0 0 60px rgba(220,38,38,0.3); }
          50%      { box-shadow: 0 0 100px rgba(220,38,38,0.8), inset 0 0 100px rgba(220,38,38,0.5); }
        }
      `}</style>
    </div>
  );
}
