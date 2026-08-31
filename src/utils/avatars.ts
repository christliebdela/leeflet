export interface MascotPreset {
  id: string;
  name: string;
  style: 'bottts' | 'bottts-neutral' | 'thumbs' | 'fun-emoji' | 'shapes';
  seed: string;
  category: 'Robots' | 'Characters' | 'Emoji' | 'Shapes';
}

export const MASCOT_PRESETS: MascotPreset[] = [
  // Robots (Bottts)
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

  // Characters (Thumbs)
  { id: 'char-felix', name: 'Felix', style: 'thumbs', seed: 'Felix', category: 'Characters' },
  { id: 'char-buddy', name: 'Buddy', style: 'thumbs', seed: 'Buddy', category: 'Characters' },
  { id: 'char-casper', name: 'Casper', style: 'thumbs', seed: 'Casper', category: 'Characters' },
  { id: 'char-mochi', name: 'Mochi', style: 'thumbs', seed: 'Mochi', category: 'Characters' },
  { id: 'char-pepper', name: 'Pepper', style: 'thumbs', seed: 'Pepper', category: 'Characters' },
  { id: 'char-pip', name: 'Pip', style: 'thumbs', seed: 'Pip', category: 'Characters' },

  // Emoji (Fun Emoji)
  { id: 'emo-joy', name: 'Joy', style: 'fun-emoji', seed: 'Joy', category: 'Emoji' },
  { id: 'emo-bliss', name: 'Bliss', style: 'fun-emoji', seed: 'Bliss', category: 'Emoji' },
  { id: 'emo-cool', name: 'Cool', style: 'fun-emoji', seed: 'Cool', category: 'Emoji' },
  { id: 'emo-star', name: 'Star', style: 'fun-emoji', seed: 'Star', category: 'Emoji' },
  { id: 'emo-vibe', name: 'Vibe', style: 'fun-emoji', seed: 'Vibe', category: 'Emoji' },
  { id: 'emo-cyber', name: 'Cyber', style: 'fun-emoji', seed: 'Cyber', category: 'Emoji' },

  // Shapes (Geometric/Abstract)
  { id: 'shp-prism', name: 'Prism', style: 'shapes', seed: 'Prism', category: 'Shapes' },
  { id: 'shp-orbit', name: 'Orbit', style: 'shapes', seed: 'Orbit', category: 'Shapes' },
  { id: 'shp-nexus', name: 'Nexus', style: 'shapes', seed: 'Nexus', category: 'Shapes' },
  { id: 'shp-vortex', name: 'Vortex', style: 'shapes', seed: 'Vortex', category: 'Shapes' },
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
