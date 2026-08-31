export interface MascotPreset {
  id: string;
  name: string;
  style: 'bottts' | 'shapes' | 'thumbs' | 'croodles';
  seed: string;
  category: 'Robots' | 'Shapes' | 'Clay' | 'Critters';
}

export const MASCOT_PRESETS: MascotPreset[] = [
  // 1. Robots (Bottts)
  { id: 'bot-spark', name: 'Spark', style: 'bottts', seed: 'Spark', category: 'Robots' },
  { id: 'bot-gizmo', name: 'Gizmo', style: 'bottts', seed: 'Gizmo', category: 'Robots' },
  { id: 'bot-byte', name: 'Byte', style: 'bottts', seed: 'Byte', category: 'Robots' },
  { id: 'bot-neo', name: 'Neo', style: 'bottts', seed: 'Neo', category: 'Robots' },
  { id: 'bot-astro', name: 'Astro', style: 'bottts', seed: 'Astro', category: 'Robots' },
  { id: 'bot-pixel', name: 'Pixel', style: 'bottts', seed: 'Pixel', category: 'Robots' },
  { id: 'bot-zen', name: 'Zen', style: 'bottts', seed: 'Zen', category: 'Robots' },
  { id: 'bot-nova', name: 'Nova', style: 'bottts', seed: 'Nova', category: 'Robots' },
  { id: 'bot-cosmo', name: 'Cosmo', style: 'bottts', seed: 'Cosmo', category: 'Robots' },
  { id: 'bot-titan', name: 'Titan', style: 'bottts', seed: 'Titan', category: 'Robots' },

  // 2. Shapes (Geometric & Abstract)
  { id: 'shp-prism', name: 'Prism', style: 'shapes', seed: 'Prism', category: 'Shapes' },
  { id: 'shp-orbit', name: 'Orbit', style: 'shapes', seed: 'Orbit', category: 'Shapes' },
  { id: 'shp-nexus', name: 'Nexus', style: 'shapes', seed: 'Nexus', category: 'Shapes' },
  { id: 'shp-vortex', name: 'Vortex', style: 'shapes', seed: 'Vortex', category: 'Shapes' },
  { id: 'shp-eclipse', name: 'Eclipse', style: 'shapes', seed: 'Eclipse', category: 'Shapes' },
  { id: 'shp-helix', name: 'Helix', style: 'shapes', seed: 'Helix', category: 'Shapes' },
  { id: 'shp-pulse', name: 'Pulse', style: 'shapes', seed: 'Pulse', category: 'Shapes' },
  { id: 'shp-matrix', name: 'Matrix', style: 'shapes', seed: 'Matrix', category: 'Shapes' },

  // 3. Clay (Playful 3D Thumbs)
  { id: 'clay-clayton', name: 'Clayton', style: 'thumbs', seed: 'Clayton', category: 'Clay' },
  { id: 'clay-mochi', name: 'Mochi', style: 'thumbs', seed: 'Mochi', category: 'Clay' },
  { id: 'clay-blob', name: 'Blob', style: 'thumbs', seed: 'Blob', category: 'Clay' },
  { id: 'clay-gummy', name: 'Gummy', style: 'thumbs', seed: 'Gummy', category: 'Clay' },
  { id: 'clay-pebble', name: 'Pebble', style: 'thumbs', seed: 'Pebble', category: 'Clay' },
  { id: 'clay-dough', name: 'Dough', style: 'thumbs', seed: 'Dough', category: 'Clay' },
  { id: 'clay-boba', name: 'Boba', style: 'thumbs', seed: 'Boba', category: 'Clay' },
  { id: 'clay-jelly', name: 'Jelly', style: 'thumbs', seed: 'Jelly', category: 'Clay' },

  // 4. Critters (Illustrated Animals & Creatures)
  { id: 'crit-fox', name: 'Fox', style: 'croodles', seed: 'Fox', category: 'Critters' },
  { id: 'crit-otter', name: 'Otter', style: 'croodles', seed: 'Otter', category: 'Critters' },
  { id: 'crit-panda', name: 'Panda', style: 'croodles', seed: 'Panda', category: 'Critters' },
  { id: 'crit-bunny', name: 'Bunny', style: 'croodles', seed: 'Bunny', category: 'Critters' },
  { id: 'crit-bear', name: 'Bear', style: 'croodles', seed: 'Bear', category: 'Critters' },
  { id: 'crit-koala', name: 'Koala', style: 'croodles', seed: 'Koala', category: 'Critters' },
  { id: 'crit-raccoon', name: 'Raccoon', style: 'croodles', seed: 'Raccoon', category: 'Critters' },
  { id: 'crit-tiger', name: 'Tiger', style: 'croodles', seed: 'Tiger', category: 'Critters' },
];

export const getDiceBearSvgUrl = (style: string, seed: string): string => {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
};

export const getMascotById = (id: string): MascotPreset | undefined => {
  return MASCOT_PRESETS.find((m) => m.id === id);
};

export const resolveAvatarUrl = (
  avatarVal?: string,
  fallbackSeed?: string
): string => {
  if (avatarVal) {
    // If it's a full http/https URL or data URL
    if (avatarVal.startsWith('http://') || avatarVal.startsWith('https://') || avatarVal.startsWith('data:')) {
      return avatarVal;
    }
    // If it matches a mascot preset ID
    const preset = getMascotById(avatarVal);
    if (preset) {
      return getDiceBearSvgUrl(preset.style, preset.seed);
    }
    // If it's custom dicebear format e.g. "dicebear:bottts:Spark"
    if (avatarVal.startsWith('dicebear:')) {
      const parts = avatarVal.split(':');
      if (parts.length >= 3) {
        return getDiceBearSvgUrl(parts[1], parts[2]);
      }
    }
  }

  // Fallback: generate deterministic bottts mascot based on name/id
  const seed = (fallbackSeed || 'leeflet').trim() || 'leeflet';
  return getDiceBearSvgUrl('bottts', seed);
};

export const isMascotAvatar = (avatarVal?: string): boolean => {
  if (!avatarVal) return false;
  return (
    avatarVal.startsWith('http') ||
    avatarVal.startsWith('dicebear:') ||
    MASCOT_PRESETS.some((m) => m.id === avatarVal)
  );
};
