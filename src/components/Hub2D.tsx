import { useEffect, useState, useCallback } from 'react';
import { useMovement, type Direction } from '../hooks/useMovement';
import { useStore, BEASTS } from '../store/useStore';
import { RPGDialogue, type DialogueOption } from './RPGDialogue';
import { Encounter } from './Encounter';

// ─── Grid constants ────────────────────────────────────────────────────────────
const TILE = 42;
const COLS = 20;
const ROWS = 15;

// ─── Tile type IDs ─────────────────────────────────────────────────────────────
const FLOOR  = 0;
const WALL   = 1;
const PORTAL = 2;   // → Ritual
const SHELF  = 3;   // → Bestiario
const DESK   = 4;   // → Dominios

const WALKABLE = new Set([FLOOR, PORTAL, SHELF, DESK]);

// ─── Tile map 20 × 15 ─────────────────────────────────────────────────────────
// Límites del área caminable:
//   Izquierda : cols 0-1 son muro  → caminable desde col 2
//   Derecha   : cols 18-19 son muro → caminable hasta col 17
//   Superior  : filas 0-3 son muro  → caminable desde fila 4
//   Inferior  : fila 14 es muro
const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0  ← pared superior (original)
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1  ← pared superior -1
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 2  ← pared superior -2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 3  ← pared superior -3
  [1,1,3,3,0,0,0,0,2,2,2,2,0,0,0,0,0,0,1,1], // 4  SHELF(2-3)  PORTAL(8-11) ← top
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 5
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 6
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 7
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1,1], // 8  ← spawn (9,8)  DESK(16) right-center
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 9
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 10
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 11
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 12
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1], // 13
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 14 ← pared inferior
];

const PLAYER_START = { x: 9, y: 8 };

// ─── Character sprites ─────────────────────────────────────────────────────────
const SPRITES: Record<Direction, { idle: string; frames: [string, string] }> = {
  down: {
    idle:   '/img/personaje/de-frente-reposo.png',
    frames: ['/img/personaje/de-frente-pie-der-adelante.png',
             '/img/personaje/de-frente-pie-izq-adelante.png'],
  },
  up: {
    idle:   '/img/personaje/de-espaldas-reposo.png',
    frames: ['/img/personaje/de-espaldas-pie-der-adelante.png',
             '/img/personaje/de-espaldas-pie-izq-adelante.png'],
  },
  right: {
    idle:   '/img/personaje/costado-der-pie-der-adelante.png',
    frames: ['/img/personaje/costado-der-pie-der-adelante.png',
             '/img/personaje/costado-der-pie-izq-adelante.png'],
  },
  left: {
    idle:   '/img/personaje/costado-izq-pie-der-adelante.png',
    frames: ['/img/personaje/costado-izq-pie-der-adelante.png',
             '/img/personaje/costado-izq-pie-izq-adelante.png'],
  },
};

// Sprite display — fixed height only, width is auto (preserves each sprite's aspect ratio)
const SPR_H = TILE * 3; // 126 px — ajusta este único valor para cambiar el tamaño

// ─── Trigger zone overlays (for visual glow on the map) ───────────────────────
const TRIGGER_ZONES = [
  { key: 'portal', col: 8,  row: 12, span: 4, color: '107,33,168',  border: '139,92,246', label: 'RITUAL',    tile: PORTAL },
  { key: 'shelf',  col: 2,  row: 4,  span: 2, color: '146,64,14',   border: '217,119,6',  label: 'BESTIARIO', tile: SHELF  },
  { key: 'desk',   col: 16, row: 4,  span: 2, color: '14,116,144',  border: '6,182,212',  label: 'DOMINIOS',  tile: DESK   },
];

// ─── Trigger proximity info ────────────────────────────────────────────────────
const TRIGGER_INFO: Record<number, { label: string; hint: string; color: string }> = {
  [PORTAL]: { label: 'PORTAL OSCURO', hint: 'Comenzar Ritual',  color: '#a855f7' },
  [SHELF]:  { label: 'BIBLIOTECA',    hint: 'Abrir Bestiario',  color: '#f59e0b' },
  [DESK]:   { label: 'ESCRITORIO',    hint: 'Ver Dominios',     color: '#22d3ee' },
};

// ─── Duration options ──────────────────────────────────────────────────────────
const DURATION_OPTIONS: DialogueOption[] = [
  { id: '60',  label: '1 hora   · 60 min'  },
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
  onOpenDomains:  () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function Hub2D({ onOpenBestiary, onOpenDomains }: Hub2DProps) {
  const { domains } = useStore();

  // Ritual state
  const [dialogPhase, setDialogPhase] = useState<DialogPhase | null>(null);
  const [ritual, setRitual]           = useState<Partial<RitualData>>({});
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [inEncounter, setInEncounter] = useState(false);

  const isBlocked = dialogPhase !== null || fadeToBlack || inEncounter;

  // Movement
  const { position, facing, isMoving } = useMovement({
    initialPosition: PLAYER_START,
    tileMap:         MAP,
    walkableTiles:   WALKABLE,
    enabled:         !isBlocked,
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
        domainId:     prev.domainId    ?? '',
        beastId:      opt.id,
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
      if (currentTile === PORTAL)      setDialogPhase('duration');
      else if (currentTile === SHELF)  onOpenBestiary();
      else if (currentTile === DESK)   onOpenDomains();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBlocked, currentTile, onOpenBestiary, onOpenDomains]);

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
  const sprTop     = position.y * TILE + TILE - SPR_H;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#04040a] select-none"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* ── Top HUD ── */}
      {!isBlocked && (
        <div className="mb-3 flex gap-6" style={{ color: '#27272a', fontSize: '7px' }}>
          <span>WASD · FLECHAS → MOVER</span>
          <span>ENTER → INTERACTUAR</span>
        </div>
      )}

      {/* ── Grid container ── */}
      <div
        className="relative overflow-hidden"
        style={{
          width:     gridW,
          height:    gridH,
          border:    '4px solid #0f0f18',
          boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 120px rgba(0,0,0,0.7)',
        }}
      >
        {/* Layer 0 — Room background */}
        <img
          src="/img/background-room.png"
          alt=""
          draggable={false}
          style={{
            position:        'absolute',
            inset:           0,
            width:           '100%',
            height:          '100%',
            objectFit:       'fill',
            imageRendering:  'pixelated',
            pointerEvents:   'none',
            zIndex:          0,
          }}
        />

        {/* Layer 1 — Trigger zone glow overlays */}
        {TRIGGER_ZONES.map(({ key, col, row, span, color, border, tile }) => {
          const isActive = currentTile === tile && !isBlocked;
          return (
            <div
              key={key}
              style={{
                position:   'absolute',
                left:       col * TILE,
                top:        row * TILE,
                width:      span * TILE,
                height:     TILE,
                background: `rgba(${color}, ${isActive ? 0.45 : 0.18})`,
                border:     `1px solid rgba(${border}, ${isActive ? 0.7 : 0.3})`,
                boxShadow:  isActive
                  ? `inset 0 0 20px rgba(${color}, 0.5), 0 0 12px rgba(${color}, 0.4)`
                  : `inset 0 0 10px rgba(${color}, 0.2)`,
                transition: 'background 0.2s, box-shadow 0.2s',
                pointerEvents: 'none',
                zIndex:     1,
                animation:  key === 'portal' ? 'portal-pulse 2.5s ease-in-out infinite' : undefined,
              }}
            />
          );
        })}

        {/* Layer 2 — Zone labels (always subtle, brighter when active) */}
        {TRIGGER_ZONES.map(({ key, col, row, span, border, label, tile }) => {
          const isActive = currentTile === tile && !isBlocked;
          return (
            <div
              key={`lbl-${key}`}
              style={{
                position:   'absolute',
                left:       col * TILE,
                top:        row * TILE,
                width:      span * TILE,
                height:     TILE,
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex:     2,
              }}
            >
              <span
                style={{
                  fontSize:   '5px',
                  color:      `rgba(${border}, ${isActive ? 1 : 0.5})`,
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
            position:        'absolute',
            left:            sprCenterX,
            top:             sprTop,
            height:          SPR_H,
            width:           'auto',
            transform:       'translateX(-50%)',
            imageRendering:  'pixelated',
            filter:          'drop-shadow(0 5px 4px rgba(0,0,0,0.7))',
            zIndex:          10,
            transition:      'left 0.12s linear, top 0.12s linear',
          }}
        />

        {/* Layer 4 — Vignette */}
        <div
          style={{
            position:      'absolute',
            inset:         0,
            background:    'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
            zIndex:        15,
          }}
        />

        {/* Layer 5 — Fade-to-black for encounter transition */}
        {fadeToBlack && (
          <div
            style={{
              position:  'absolute',
              inset:     0,
              background:'#000',
              zIndex:    50,
              animation: 'hub-fadeblack 0.9s ease-in forwards',
            }}
          />
        )}
      </div>

      {/* ── Trigger prompt strip ── */}
      <div style={{ marginTop: 14, height: 32 }}>
        {triggerInfo ? (
          <div
            style={{
              padding:   '6px 16px',
              border:    `2px solid ${triggerInfo.color}`,
              color:     triggerInfo.color,
              fontSize:  '7px',
              boxShadow: `0 0 14px ${triggerInfo.color}44`,
              animation: 'prompt-pulse 1.4s ease-in-out infinite',
            }}
          >
            [{triggerInfo.label}] — ENTER para {triggerInfo.hint}
          </div>
        ) : (
          <div style={{ color: '#1a1a28', fontSize: '7px' }}>Explora la habitación</div>
        )}
      </div>

      {/* ── RPG Dialogue overlay ── */}
      {dialogueProps && <RPGDialogue {...dialogueProps} />}

      <style>{`
        @keyframes portal-pulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1;    }
        }
        @keyframes hub-fadeblack {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes prompt-pulse {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
