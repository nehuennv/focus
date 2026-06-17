// ZzFX no incluye tipos. Declaración mínima para lo que usamos.
declare module 'zzfx' {
  export function zzfx(...params: number[]): AudioBufferSourceNode;
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play: (...params: number[]) => AudioBufferSourceNode;
  };
}
