# ⚔️ Focus Souls

> **Un ritual de enfoque gamificado** — Transforma tu tiempo de estudio en una épica batalla contra bestias mitológicas.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38bdf8?logo=tailwindcss)

## 🎮 ¿Qué es Focus Souls?

Focus Souls es una aplicación de productividad gamificada con estética **pixel art** que convierte tus sesiones de estudio en rituales épicos. Selecciona un dominio (materia), elige una bestia del bestiario y enfréntate en una batalla contra el tiempo.

### Características principales

- **🔥 Ritual de Enfoque**: Sesiones de estudio de 1h a 8h con countdown en tiempo real
- **📜 Sistema de Dominios**: Crea materias con metas semanales y tracking de progreso
- **💀 Bestiario**: 12 bestias únicas con lore y arte pixelado
- **🏆 Trofeos**: Logros desbloqueables por hitos de estudio
- **🎨 Estética Retro**: Pixel art, fuente "Press Start 2P", animaciones step-based
- **🔔 Sonidos Inmersivos**: Campanas, hogueras y efectos de batalla

## 🏛️ El Ritual (Game Flow)

```
┌─────────────────────────────────────────────────────────┐
│  1. MAIN MENU                                           │
│     [Comenzar Ritual] [Dominios] [Bestiario] [Trofeos]  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. SETUP RITUAL                                        │
│     - Ofrenda (Tiempo: 1h - 8h)                         │
│     - Dominio (Materia a estudiar)                      │
│     - Bestia (El boss a enfrentar)                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. LA BATALLA                                          │
│     Countdown timer • HP = Tiempo restante              │
│     Enfrentamiento visual con la bestia                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. LA HOGUERA (Rest)                                   │
│     5 min de descanso • GIF de hoguera                  │
│     [+5 min] [Saltar]                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. VICTORIA                                            │
│     + XP al jugador                                     │
│     - Deuda semanal del dominio                         │
│     + Kill al bestiario                                 │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/focus-souls.git
cd focus-souls

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📜 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo Vite |
| `npm run build` | Compila para producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Ejecuta ESLint |

## 🎨 Estética y Diseño

### Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Void Dark | `#0a0504` | Fondo principal |
| Rust Brown | `#3d2817` | Bordes, UI |
| Amber Gold | `#c9b896` | Texto, acentos |
| Blood Red | `#dc2626` | Batallas, peligro |
| Bone White | `#ede6ff` | Hueso, calaveras |

### Tipografía

- **Principal**: "Press Start 2P" (Google Fonts)
- **Fallback**: monospace

### Assets

Todos los assets están en `/public`:
- `/img/pixeladas/` - Sprites de bestias
- `/img/personaje/` - Sprites del jugador
- `/sounds/` - Efectos de sonido (bell, bonefire, battle)

## 🏛️ Sistema de Dominios

Cada dominio representa una materia o habilidad a dominar:

```typescript
interface Domain {
  id: string;
  name: string;
  weeklyTargetMins: number;    // Meta semanal en minutos
  currentDebtMins: number;     // Deuda actual
  totalMins: number;           // Minutos acumulados históricos
  beastId: string;             // Bestia asociada
}
```

### Cálculo de Deuda Semanal

Si al final de la semana:
```
minutos_estudiados < weekly_target_mins
→ debt = weekly_target_mins - minutos_estudiados
```

## 👾 Bestiario

| Bestia | Título | Dificultad |
|--------|--------|------------|
| Alberic | El Primer Deudor | ★☆☆ |
| Aurelian | El Dorado | ★☆☆ |
| Kaelen | El Sombrío | ★★☆ |
| Lysandra | La Hechicera | ★★☆ |
| Maro | El Antiguo | ★★★ |
| Morwenna | La Sirena | ★★☆ |
| Nyr | El Glacial | ★★★ |
| Vesper | La Nocturna | ★★★ |
| Horrax | El Devorador | ★★★★ |
| Thereon | El Guardián | ★★★★ |
| Albedo | El Alquimista | ★★★★★ |

## 🏆 Sistema de Trofeos

Los trofeos se desbloquean al completar hitos:

- **Primeros Pasos**: Primera sesión completada
- **Cazador Novato**: 10 kills totales
- **Maestro del Enfoque**: 100h acumuladas
- **Legendario**: 1000h acumuladas
- **Best Slayer**: Matar a cada bestia 3 veces

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Estado**: Zustand (state management minimalista)
- **Estilos**: Tailwind CSS 4
- **Build**: Vite 5
- **Iconos**: Lucide React

## 📁 Estructura del Proyecto

```
focus-souls/
├── public/
│   ├── img/
│   │   ├── pixeladas/    # Sprites de bestias
│   │   ├── personaje/    # Sprites del jugador
│   │   └── background-room.png
│   ├── sounds/           # Efectos de audio
│   └── favicon.svg
├── src/
│   ├── components/       # Componentes React
│   │   ├── Hub2D.tsx     # Hub central caminable
│   │   ├── Encounter.tsx # Pantalla de batalla
│   │   ├── BestiaryScreen.tsx
│   │   ├── DomainsScreen.tsx
│   │   └── ...
│   ├── hooks/            # Custom hooks
│   │   └── useMovement.ts
│   ├── store/            # Zustand store
│   │   └── useStore.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── tsconfig.json
```

## 🎯 Roadmap

- [ ] Modo online (leaderboards)
- [ ] Más bestias y dominios
- [ ] Sistema de rachas diarias
- [ ] Export/import de datos
- [ ] PWA installable

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

---

<div align="center">

**⚔️ Que tu enfoque sea tan afilado como tu espada ⚔️**

*Hecho con 💜 y mucha cafeína*

</div>
