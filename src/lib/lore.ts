// Datos compartidos de clase (tipo de estudiante) y reliquia (item de ayuda).
// Usados en el onboarding y en las fichas de perfil.

export interface ClassDef { id: string; name: string; icon: string; aptitude: string; lore: string }
export interface ItemDef { id: string; name: string; icon: string; effect: string; lore: string }

export const CLASSES: ClassDef[] = [
  { id: 'madrugador', name: 'El Madrugador', icon: '🌅', aptitude: 'ALBA', lore: 'Domás la mañana cuando el mundo aún duerme. Tu hoja está más filosa al amanecer.' },
  { id: 'nocturno', name: 'El Nocturno', icon: '🌙', aptitude: 'VIGILIA', lore: 'La noche es tu dominio. Mientras otros descansan, vos forjás saber en la penumbra.' },
  { id: 'maratonista', name: 'El Maratonista', icon: '🏃', aptitude: 'TEMPLE', lore: 'No corrés rápido: corrés lejos. Las sesiones largas no te quiebran, te templan.' },
  { id: 'tactico', name: 'El Táctico', icon: '🧭', aptitude: 'ASTUCIA', lore: 'Planificás cada asalto. Sabés a qué bestia enfrentar y cuándo retirarte.' },
  { id: 'obsesivo', name: 'El Obsesivo', icon: '🔥', aptitude: 'FERVOR', lore: 'Cuando entrás en foco, el mundo se apaga. Profundidad por encima de amplitud.' },
];

export const ITEMS: ItemDef[] = [
  { id: 'reloj', name: 'Reloj de Arena Agrietado', icon: '⏳', effect: 'Hogueras más largas', lore: 'La arena cae lenta. Tus descansos arden un instante más.' },
  { id: 'vela', name: 'Vela de Sebo Eterno', icon: '🕯️', effect: 'Llama que no muere', lore: 'Una luz constante. Marca el inicio de cada ritual sin apagarse.' },
  { id: 'amuleto', name: 'Amuleto de Hueso', icon: '🦴', effect: 'Resistir la distracción', lore: 'Tallado de una bestia caída. Susurra "seguí" cuando flaqueás.' },
  { id: 'pacto', name: 'Pacto de Tinta Negra', icon: '📜', effect: 'Memoria de deudas', lore: 'Cada hora que debés queda escrita. La tinta jamás olvida.' },
];

export const classById = (id: string | null | undefined) => CLASSES.find(c => c.id === id);
export const itemById = (id: string | null | undefined) => ITEMS.find(i => i.id === id);
