import { useState, useEffect, useCallback, useRef } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Position = { x: number; y: number };

interface UseMovementProps {
  initialPosition: Position;
  tileMap: number[][];
  walkableTiles: Set<number>;
  enabled?: boolean;
}

export function useMovement({
  initialPosition,
  tileMap,
  walkableTiles,
  enabled = true,
}: UseMovementProps) {
  const [position, setPosition]   = useState<Position>(initialPosition);
  const [facing, setFacing]       = useState<Direction>('down');
  const [isMoving, setIsMoving]   = useState(false);
  const cooldown    = useRef(false);
  const stopTimer   = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isWalkable = useCallback((x: number, y: number): boolean => {
    if (y < 0 || y >= tileMap.length || x < 0 || x >= tileMap[0].length) return false;
    return walkableTiles.has(tileMap[y][x]);
  }, [tileMap, walkableTiles]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (cooldown.current) return;

      let dx = 0, dy = 0;
      let dir: Direction = facing;

      switch (e.key) {
        case 'ArrowUp':  case 'w': case 'W': dy = -1; dir = 'up';    break;
        case 'ArrowDown': case 's': case 'S': dy =  1; dir = 'down';  break;
        case 'ArrowLeft': case 'a': case 'A': dx = -1; dir = 'left';  break;
        case 'ArrowRight':case 'd': case 'D': dx =  1; dir = 'right'; break;
        default: return;
      }

      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      setFacing(dir);
      setIsMoving(true);

      setPosition(prev => {
        const nx = prev.x + dx;
        const ny = prev.y + dy;
        return isWalkable(nx, ny) ? { x: nx, y: ny } : prev;
      });

      // Clear any pending "stop" timer and restart it
      clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => setIsMoving(false), 220);

      cooldown.current = true;
      setTimeout(() => { cooldown.current = false; }, 140);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, facing, isWalkable]);

  // Cleanup stop timer on unmount
  useEffect(() => () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
  }, []);

  return { position, facing, isMoving };
}
