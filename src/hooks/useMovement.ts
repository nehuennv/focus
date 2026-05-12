import { useState, useEffect, useCallback, useRef } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Position = { x: number; y: number };

interface UseMovementProps {
  initialPosition: Position;
  tileMap: number[][];
  walkableTiles: Set<number>;
  enabled?: boolean;
  stepMs?: number;
}

function bfs(
  start: Position,
  end: Position,
  isWalkable: (x: number, y: number) => boolean,
): Position[] {
  const key = (p: Position) => `${p.x},${p.y}`;
  const visited = new Set<string>([key(start)]);
  const parent = new Map<string, Position>();
  const queue: Position[] = [start];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === end.x && curr.y === end.y) {
      const path: Position[] = [];
      let node: Position | undefined = curr;
      while (node) { path.unshift(node); node = parent.get(key(node)); }
      return path;
    }
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = curr.x + dx, ny = curr.y + dy;
      const nk = `${nx},${ny}`;
      if (!visited.has(nk) && isWalkable(nx, ny)) {
        visited.add(nk);
        parent.set(nk, curr);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return [];
}

export function useMovement({
  initialPosition,
  tileMap,
  walkableTiles,
  enabled = true,
  stepMs = 150,
}: UseMovementProps) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [facing, setFacing] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);

  const posRef        = useRef(initialPosition);
  const cooldown      = useRef(false);
  const stopTimer     = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pathRef       = useRef<Position[]>([]);
  const pathIvRef     = useRef<ReturnType<typeof setInterval>>(undefined);
  const onArrivalRef  = useRef<(() => void) | null>(null);

  const isWalkable = useCallback((x: number, y: number): boolean => {
    if (y < 0 || y >= tileMap.length || x < 0 || x >= tileMap[0].length) return false;
    return walkableTiles.has(tileMap[y][x]);
  }, [tileMap, walkableTiles]);

  const applyStep = useCallback((nx: number, ny: number, dir: Direction) => {
    setFacing(dir);
    setIsMoving(true);
    setPosition(() => {
      const next = isWalkable(nx, ny) ? { x: nx, y: ny } : posRef.current;
      posRef.current = next;
      return next;
    });
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setIsMoving(false), 220);
  }, [isWalkable]);

  const clearPath = useCallback(() => {
    clearInterval(pathIvRef.current);
    pathRef.current = [];
    onArrivalRef.current = null;
  }, []);

  const moveTo = useCallback((target: Position, onArrival?: () => void) => {
    if (!enabled) return;
    clearPath();
    const path = bfs(posRef.current, target, isWalkable);
    if (path.length <= 1) {
      onArrival?.();
      return;
    }
    pathRef.current = path.slice(1);
    onArrivalRef.current = onArrival ?? null;

    pathIvRef.current = setInterval(() => {
      const next = pathRef.current.shift();
      if (!next) {
        clearInterval(pathIvRef.current);
        setIsMoving(false);
        onArrivalRef.current?.();
        onArrivalRef.current = null;
        return;
      }
      const dx = next.x - posRef.current.x;
      const dy = next.y - posRef.current.y;
      const dir: Direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      applyStep(next.x, next.y, dir);
    }, stepMs);
  }, [enabled, isWalkable, applyStep, clearPath, stepMs]);

  // Keyboard — cancels path and moves directly
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cooldown.current) return;

      let dx = 0, dy = 0;
      let dir: Direction = facing;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': dy = -1; dir = 'up';    break;
        case 'ArrowDown':  case 's': case 'S': dy =  1; dir = 'down';  break;
        case 'ArrowLeft':  case 'a': case 'A': dx = -1; dir = 'left';  break;
        case 'ArrowRight': case 'd': case 'D': dx =  1; dir = 'right'; break;
        default: return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();

      clearPath();
      applyStep(posRef.current.x + dx, posRef.current.y + dy, dir);

      cooldown.current = true;
      setTimeout(() => { cooldown.current = false; }, 140);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, facing, applyStep, clearPath]);

  useEffect(() => () => {
    clearTimeout(stopTimer.current);
    clearInterval(pathIvRef.current);
  }, []);

  return { position, facing, isMoving, moveTo };
}
