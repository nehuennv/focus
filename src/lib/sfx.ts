import { zzfx, ZZFX } from 'zzfx';
import { useStore } from '../store/useStore';

// Sonidos chiptune procedurales (ZzFX) para la UI online. Cero archivos de audio.
// Respeta settings.sfxVol del store; si es 0, silencio.

function vol(): number {
  try {
    return useStore.getState().settings.sfxVol ?? 0.6;
  } catch {
    return 0.6;
  }
}

// Reproduce un sonido ZzFX escalando por el volumen del usuario.
function play(params: number[], scale = 1) {
  const v = vol();
  if (v <= 0) return;
  try {
    ZZFX.volume = 0.35 * v * scale;
    zzfx(...params);
  } catch {
    // AudioContext suspendido (sin gesto previo) o no soportado — ignorar.
  }
}

export const sfx = {
  // Blip corto y agudo al pasar el mouse.
  hover: () => play([1, 0.05, 480, 0, 0.01, 0.05, 1, 1.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.01], 0.5),
  // Click / selección.
  click: () => play([1.1, 0.05, 300, 0, 0.02, 0.07, 1, 1.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.02]),
  // Avanzar de paso (swoosh ascendente).
  step: () => play([1.2, 0.05, 220, 0.01, 0.08, 0.1, 0, 1.4, 0, 8, 120, 0.05, 0, 0, 0, 0, 0, 0.7, 0.05]),
  // Volver (descendente).
  back: () => play([1, 0.05, 330, 0.01, 0.05, 0.08, 0, 1.3, 0, -6, -80, 0.04, 0, 0, 0, 0, 0, 0.6, 0.03], 0.8),
  // Éxito (dos notas ascendentes).
  success: () => {
    play([1.4, 0.05, 523, 0, 0.06, 0.12, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.04]);
    setTimeout(() => play([1.4, 0.05, 784, 0, 0.08, 0.15, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.04]), 110);
  },
  // Error (buzz grave).
  error: () => play([1.5, 0.05, 120, 0.02, 0.1, 0.2, 2, 0.8, 0, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6, 0.05]),
};
