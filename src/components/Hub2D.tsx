import { useEffect, useState, useCallback } from 'react';
import { useMovement, type Direction } from '../hooks/useMovement';
import { useStore, ERAS, getRankProgress } from '../store/useStore';
import { RPGDialogue } from './RPGDialogue';
import { Encounter } from './Encounter';
import { DailySetupScreen } from './DailySetupScreen';

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
const BED = 5;    // → Descansar

const WALKABLE = new Set([FLOOR, PORTAL, SHELF, DESK, BED]);

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
  [1, 1, 3, 3, 3, 0, 0, 0, 0, 2, 2, 0, 0, 0, 1, 1, 1, 1, 1, 1], // 5  SHELF(3-4)
  [1, 1, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 1, 1, 1, 1, 1], // 7
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 8  DESK(13)
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1, 1, 1, 1, 1], // 10
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // 11
  [1, 1, 1, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 12  BED(2-8)
  [1, 1, 1, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 13  BED(2-8)
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
const SPR_H = TILE * 3.6; // 151 px — ajusta este único valor para cambiar el tamaño

// ─── Trigger zone overlays (for visual glow on the map) ───────────────────────
const TRIGGER_ZONES = [
  { key: 'portal', col: 8, row: 4, span: 4, color: '180, 18, 18', border: '248,113,113', label: 'PORTAL', tile: PORTAL },
  { key: 'shelf', col: 2, row: 5, span: 2, color: '146,64,14', border: '217,119,6', label: 'BESTIARIO', tile: SHELF },
  { key: 'desk', col: 12, row: 8, span: 2, color: '133, 133, 133', border: '133, 133, 133', label: 'DOMINIOS', tile: DESK },
  { key: 'bed', col: 2, row: 12, span: 7, color: '180, 100, 20', border: '240, 160, 60', label: 'DESCANSAR', tile: BED },
];

// ─── Trigger proximity info ────────────────────────────────────────────────────
const TRIGGER_INFO: Record<number, { label: string; hint: string; color: string }> = {
  [PORTAL]: { label: 'PORTAL', hint: 'Comenzar Ritual', color: '#ff362bff' },
  [SHELF]: { label: 'BIBLIOTECA', hint: 'Abrir Bestiario', color: '#f59e0b' },
  [DESK]: { label: 'ESCRITORIO', hint: 'Ver Dominios', color: '#22d3ee' },
  [BED]: { label: 'CAMA', hint: 'Descansar', color: '#f0a030' },
};

// ─── Ritual state machine ──────────────────────────────────────────────────────
type DialogPhase = 'rest';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Hub2DProps {
  onOpenBestiary: () => void;
  onOpenDomains: () => void;
  onOpenTrophies: () => void;
  onOpenTutorial: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function Hub2D({ onOpenBestiary, onOpenDomains, onOpenTrophies, onOpenTutorial }: Hub2DProps) {
  const { player, settings, setSettings, isDay, setIsDay, debugUnlockAll, setDebugUnlockAll, dailySession, startDailySession } = useStore();
  const rp = getRankProgress(player.totalAccumulatedMins);
  const eraIdx = Math.floor(player.rankIndex / 10);
  const era = ERAS[Math.min(eraIdx, ERAS.length - 1)];
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][player.rankIndex % 10];

  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState(settings);

  // Ritual state
  const [dialogPhase, setDialogPhase] = useState<DialogPhase | null>(null);
  const [showDailySetup, setShowDailySetup] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [inEncounter, setInEncounter] = useState(false);
  const [restTransition, setRestTransition] = useState<'fade-out' | 'fade-in' | null>(null);
  const [restMessage, setRestMessage] = useState('');

  const isBlocked = dialogPhase !== null || showDailySetup || fadeToBlack || inEncounter || restTransition !== null;

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
  const launchEncounter = useCallback(() => {
    setDialogPhase(null);
    setShowDailySetup(false);
    setFadeToBlack(true);
    setTimeout(() => setInEncounter(true), 900);
  }, []);

  // ── Dialogue props per phase ───────────────────────────────────────────────
  const getDialogueProps = () => {
    switch (dialogPhase) {
      case 'rest':
        return {
          speakerName: isDay ? '🌙 ANOCHECER' : '🌅 AMANECER',
          text: isDay
            ? 'La oscuridad se acerca. ¿Dejar caer el sol y descansar?'
            : 'La luz rompe el horizonte. ¿Despertar y enfrentar un nuevo día?',
          options: [
            { id: 'rest', label: isDay ? 'Dejar caer el sol' : 'Despertar al amanecer' },
          ],
          onSelect: () => {
            setDialogPhase(null);
            setRestMessage(isDay
              ? 'Cierra los ojos. La deuda puede esperar al amanecer.'
              : 'La luz regresa. Descansaste bien.');
            setRestTransition('fade-out');
            setTimeout(() => {
              setIsDay(!isDay);
              setRestTransition('fade-in');
              setTimeout(() => setRestTransition(null), 2000);
            }, 3500);
          },
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

      // Check proximity to triggers — specific zones evaluated FIRST so they
      // always win over the large portal zone when there is overlap.
      const isNearShelf  = currentTile === SHELF
        || (position.x >= 1 && position.x <= 5 && position.y >= 4 && position.y <= 7);
      const isNearDesk   = currentTile === DESK
        || (position.x >= 10 && position.x <= 14 && position.y >= 7 && position.y <= 10);
      const isNearBed    = currentTile === BED
        || (position.x >= 2 && position.x <= 9 && position.y >= 11 && position.y <= 14);
      // Portal only activates when none of the specific zones match
      const isNearPortal = !isNearShelf && !isNearDesk && !isNearBed
        && (currentTile === PORTAL || (position.x >= 6 && position.x <= 13 && position.y >= 3 && position.y <= 5));

      if (isNearShelf)       onOpenBestiary();
      else if (isNearDesk)   onOpenDomains();
      else if (isNearBed)    setDialogPhase('rest');
      else if (isNearPortal) {
        setShowDailySetup(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBlocked, currentTile, position, onOpenBestiary, onOpenDomains]);

  // ── Encounter full-screen ─────────────────────────────────────────────────
  if (inEncounter) {
    return (
      <Encounter
        onBack={() => { setInEncounter(false); setFadeToBlack(false); }}
      />
    );
  }

  // ── Hub render ────────────────────────────────────────────────────────────
  const scale = settings.hubScale;
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
      {/* ── Scaled game area ── */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        {/* ── Top HUD ── */}
        {!isBlocked && (
          <div className="mb-3 w-full flex items-center justify-between px-2" style={{ maxWidth: COLS * TILE }}>
            <div className="flex gap-6" style={{ color: '#3d2817', fontSize: '7px' }}>
              <span>WASD · FLECHAS → MOVER</span>
              <span>ENTER → INTERACTUAR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Tutorial button */}
              <button
                onClick={onOpenTutorial}
                title="Ayuda / Tutorial"
                style={{
                  border: `1px solid #3d2817`, background: '#0a0504',
                  color: '#5c4a3d', fontSize: '9px', width: 24, height: 24,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '2px 2px 0 #000', fontFamily: '"Press Start 2P", monospace',
                }}
              >?</button>
              {/* Settings button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setDraft(settings); setShowSettings(s => !s); }}
                  title="Configuración"
                  style={{
                    border: `1px solid ${showSettings ? '#d97706' : '#3d2817'}`,
                    background: showSettings ? '#1a0e02' : '#0a0504',
                    color: showSettings ? '#d97706' : '#5c4a3d', fontSize: '11px', width: 24, height: 24,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '2px 2px 0 #000', fontFamily: '"Press Start 2P", monospace',
                  }}
                >⚙</button>
                {showSettings && (
                  <div style={{
                    position: 'absolute', top: 30, right: 0, zIndex: 100,
                    background: '#0a0504', border: '2px solid #3d2817',
                    boxShadow: '4px 4px 0 #000', padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14, width: 220,
                  }}>
                    {([
                      { label: 'TAMAÑO', key: 'hubScale', min: 0.6, max: 1.5, step: 0.05 },
                      { label: 'MÚSICA', key: 'musicVol', min: 0, max: 1, step: 0.05 },
                      { label: 'EFECTOS', key: 'sfxVol', min: 0, max: 1, step: 0.05 },
                    ] as const).map(({ label, key, min, max, step }) => (
                      <div key={key}>
                        <div style={{ fontSize: '7px', color: '#8b7355', marginBottom: 6, letterSpacing: '0.1em' }}>
                          {label}
                          <span style={{ float: 'right', color: '#d97706' }}>
                            {Math.round(draft[key] * 100)}%
                          </span>
                        </div>
                        <div style={{ position: 'relative', height: 8, background: '#1a1008', border: '1px solid #2a1810' }}>
                          <div style={{
                            position: 'absolute', left: 0, top: 0, height: '100%',
                            width: `${((draft[key] - min) / (max - min)) * 100}%`,
                            background: '#92400e',
                          }} />
                          <input
                            type="range" min={min} max={max} step={step}
                            value={draft[key]}
                            onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))}
                            style={{
                              position: 'absolute', inset: 0, width: '100%', height: '100%',
                              opacity: 0, cursor: 'pointer', margin: 0,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { setSettings(draft); setShowSettings(false); }}
                      style={{
                        marginTop: 4, width: '100%', padding: '7px 0',
                        background: '#92400e', border: '2px solid #d97706',
                        color: '#fbbf24', fontSize: '7px', letterSpacing: '0.15em',
                        cursor: 'pointer', fontFamily: '"Press Start 2P", monospace',
                        boxShadow: '2px 2px 0 #000',
                      }}
                    >APLICAR</button>

                    {/* Debug unlock */}
                    <div style={{ marginTop: 10, borderTop: '1px solid #1a1a1a', paddingTop: 10 }}>
                      <div style={{ fontSize: '5px', color: '#2a2a2a', letterSpacing: '0.1em', marginBottom: 6 }}>DEV</div>
                      <button
                        onClick={() => setDebugUnlockAll(!debugUnlockAll)}
                        style={{
                          width: '100%', padding: '7px 0',
                          background: debugUnlockAll ? '#14532d' : '#0f0804',
                          border: `2px solid ${debugUnlockAll ? '#4ade80' : '#2a2a2a'}`,
                          color: debugUnlockAll ? '#4ade80' : '#3a3a3a',
                          fontSize: '6px', letterSpacing: '0.1em',
                          cursor: 'pointer', fontFamily: '"Press Start 2P", monospace',
                          boxShadow: '2px 2px 0 #000',
                          transition: 'all 0.15s',
                        }}
                      >
                        {debugUnlockAll ? '🔓 TODO DESBLOQUEADO' : '🔒 DESBLOQUEAR TODO'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Rank indicator */}
              <button
                onClick={onOpenTrophies}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: `2px solid ${era.border}`, background: era.bg,
                  padding: '5px 10px', cursor: 'pointer', boxShadow: '2px 2px 0 #000',
                }}
              >
                <span style={{ fontSize: 12 }}>{era.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '7px', color: era.color, fontFamily: '"Press Start 2P", monospace', marginBottom: 2 }}>
                    {era.name.toUpperCase()} {roman}
                  </div>
                  <div style={{ width: 80, height: 4, background: '#07000f', border: `1px solid ${era.border}`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${rp.progress}%`, background: era.color }} />
                  </div>
                </div>
              </button>
            </div>
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
            src={isDay ? "img/room-day.png" : "img/room.png"}
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

          {/* Layer 1 — Floor light puddles (no boxes, no borders) */}
          {TRIGGER_ZONES.map(({ key, col, row, span, tile }) => {
            const isActive = currentTile === tile && !isBlocked;

            const lightMap: Record<string, { r: string; g: string; b: string; anim: string }> = {
              portal: { r: '255', g: '60', b: '40', anim: 'portal-pulse 2.5s ease-in-out infinite' },
              shelf: { r: '217', g: '119', b: '6', anim: 'desk-pulse 3s ease-in-out infinite' },
              desk: { r: '170', g: '170', b: '170', anim: 'desk-pulse 2.5s ease-in-out infinite' },
              bed: { r: '230', g: '140', b: '30', anim: 'desk-pulse 3.2s ease-in-out infinite' },
            };
            const l = lightMap[key];
            if (!l) return null;

            const idleAlpha = key === 'portal' ? 0.28 : 0.16;
            const activeAlpha = key === 'portal' ? 0.65 : 0.45;
            const alpha = isActive ? activeAlpha : idleAlpha;
            const rows = key === 'bed' ? 2 : 1;

            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  // Centrado horizontalmente en la zona, pegado al borde inferior del tile
                  left: col * TILE + (span * TILE * 0.1),
                  bottom: (ROWS - row - rows) * TILE,
                  width: span * TILE * 0.8,
                  height: 14,
                  background: `radial-gradient(ellipse at 50% 100%, rgba(${l.r},${l.g},${l.b},${alpha}) 0%, transparent 100%)`,
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  transition: 'opacity 0.4s ease',
                  animation: l.anim,
                }}
              />
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
              filter: `drop-shadow(0 5px 4px rgba(0,0,0,0.7))${isDay ? '' : ' brightness(0.7)'}`,
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

          {/* Layer 5 — encounter fade (kept inside grid, z-index handled separately) */}

          {/* Layer 6 — Fade-to-black for encounter transition */}
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
      </div>{/* end scaled wrapper */}

      {/* ── Daily setup screen ── */}
      {showDailySetup && (
        <DailySetupScreen
          onStart={(totalMins, domainId, beastId) => {
            startDailySession(totalMins, domainId, beastId);
            launchEncounter();
          }}
          onClose={() => setShowDailySetup(false)}
        />
      )}

      {/* ── RPG Dialogue — outside scale so width matches scaled grid ── */}
      {dialogueProps && (
        <RPGDialogue
          {...dialogueProps}
          width={`${Math.round(COLS * TILE * scale)}px`}
        />
      )}

      {/* ── Rest overlay — full screen ── */}
      {restTransition && (
        <>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2, 1, 4, 0.96)',
            pointerEvents: restTransition === 'fade-out' ? 'all' : 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            fontFamily: '"Press Start 2P", monospace',
            animation: restTransition === 'fade-out'
              ? 'rest-overlay-in 1.8s ease-in-out forwards'
              : 'rest-overlay-out 1.8s ease-in-out forwards',
          }}>
            <div style={{
              fontSize: '11px', letterSpacing: '0.2em', lineHeight: 2,
              color: '#d97706', maxWidth: 480, textAlign: 'center',
              textShadow: '0 0 24px rgba(217,119,6,0.7)',
              animation: restTransition === 'fade-out'
                ? 'rest-text-in 2.4s ease-in-out forwards'
                : 'rest-overlay-out 0.8s ease-in-out forwards',
            }}>
              {restMessage}
            </div>
            <div style={{
              display: 'flex', gap: 10,
              animation: restTransition === 'fade-out'
                ? 'rest-text-in 2.6s ease-in-out forwards'
                : 'rest-overlay-out 0.8s ease-in-out forwards',
            }}>
              {['◆', '◇', '◆'].map((s, i) => (
                <span key={i} style={{ fontSize: 8, color: '#3d2817' }}>{s}</span>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes rest-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes rest-overlay-out { from { opacity: 1; } to { opacity: 0; } }
            @keyframes rest-text-in     { 0%, 35% { opacity: 0; } 100% { opacity: 1; } }
          `}</style>
        </>
      )}
    </div>
  );
}
