export interface MascotPreset {
  id: string;
  name: string;
  style: 'bottts-neutral' | 'clay' | 'critters' | 'fun-emoji';
  seed: string;
  category: 'Robots' | 'Clay' | 'Critters' | 'Fun Emoji';
}

export const MASCOT_PRESETS: MascotPreset[] = [
  // 1. Bottts Neutral (https://api.dicebear.com/10.x/bottts-neutral/svg)
  { id: 'bot-spark', name: 'Spark', style: 'bottts-neutral', seed: 'Spark', category: 'Robots' },
  { id: 'bot-gizmo', name: 'Gizmo', style: 'bottts-neutral', seed: 'Gizmo', category: 'Robots' },
  { id: 'bot-byte', name: 'Byte', style: 'bottts-neutral', seed: 'Byte', category: 'Robots' },
  { id: 'bot-neo', name: 'Neo', style: 'bottts-neutral', seed: 'Neo', category: 'Robots' },
  { id: 'bot-astro', name: 'Astro', style: 'bottts-neutral', seed: 'Astro', category: 'Robots' },
  { id: 'bot-pixel', name: 'Pixel', style: 'bottts-neutral', seed: 'Pixel', category: 'Robots' },
  { id: 'bot-zen', name: 'Zen', style: 'bottts-neutral', seed: 'Zen', category: 'Robots' },
  { id: 'bot-nova', name: 'Nova', style: 'bottts-neutral', seed: 'Nova', category: 'Robots' },
  { id: 'bot-cosmo', name: 'Cosmo', style: 'bottts-neutral', seed: 'Cosmo', category: 'Robots' },
  { id: 'bot-titan', name: 'Titan', style: 'bottts-neutral', seed: 'Titan', category: 'Robots' },
  { id: 'bot-blip', name: 'Blip', style: 'bottts-neutral', seed: 'Blip', category: 'Robots' },
  { id: 'bot-circuit', name: 'Circuit', style: 'bottts-neutral', seed: 'Circuit', category: 'Robots' },

  // 2. Clay (https://api.dicebear.com/10.x/clay/svg)
  { id: 'clay-clayton', name: 'Clayton', style: 'clay', seed: 'Clayton', category: 'Clay' },
  { id: 'clay-mochi', name: 'Mochi', style: 'clay', seed: 'Mochi', category: 'Clay' },
  { id: 'clay-blob', name: 'Blob', style: 'clay', seed: 'Blob', category: 'Clay' },
  { id: 'clay-gummy', name: 'Gummy', style: 'clay', seed: 'Gummy', category: 'Clay' },
  { id: 'clay-pebble', name: 'Pebble', style: 'clay', seed: 'Pebble', category: 'Clay' },
  { id: 'clay-dough', name: 'Dough', style: 'clay', seed: 'Dough', category: 'Clay' },
  { id: 'clay-boba', name: 'Boba', style: 'clay', seed: 'Boba', category: 'Clay' },
  { id: 'clay-jelly', name: 'Jelly', style: 'clay', seed: 'Jelly', category: 'Clay' },
  { id: 'clay-sprout', name: 'Sprout', style: 'clay', seed: 'Sprout', category: 'Clay' },
  { id: 'clay-fluff', name: 'Fluff', style: 'clay', seed: 'Fluff', category: 'Clay' },

  // 3. Critters (https://api.dicebear.com/10.x/critters/svg)
  { id: 'crit-felix', name: 'Felix', style: 'critters', seed: 'Felix', category: 'Critters' },
  { id: 'crit-bandit', name: 'Bandit', style: 'critters', seed: 'Bandit', category: 'Critters' },
  { id: 'crit-otter', name: 'Otter', style: 'critters', seed: 'Otter', category: 'Critters' },
  { id: 'crit-panda', name: 'Panda', style: 'critters', seed: 'Panda', category: 'Critters' },
  { id: 'crit-bunny', name: 'Bunny', style: 'critters', seed: 'Bunny', category: 'Critters' },
  { id: 'crit-bear', name: 'Bear', style: 'critters', seed: 'Bear', category: 'Critters' },
  { id: 'crit-koala', name: 'Koala', style: 'critters', seed: 'Koala', category: 'Critters' },
  { id: 'crit-raccoon', name: 'Raccoon', style: 'critters', seed: 'Raccoon', category: 'Critters' },
  { id: 'crit-tiger', name: 'Tiger', style: 'critters', seed: 'Tiger', category: 'Critters' },
  { id: 'crit-cheetah', name: 'Cheetah', style: 'critters', seed: 'Cheetah', category: 'Critters' },
  { id: 'crit-spike', name: 'Spike', style: 'critters', seed: 'Spike', category: 'Critters' },
  { id: 'crit-pip', name: 'Pip', style: 'critters', seed: 'Pip', category: 'Critters' },

  // 4. Fun Emoji (https://api.dicebear.com/10.x/fun-emoji/svg)
  { id: 'emo-joy', name: 'Joy', style: 'fun-emoji', seed: 'Joy', category: 'Fun Emoji' },
  { id: 'emo-bliss', name: 'Bliss', style: 'fun-emoji', seed: 'Bliss', category: 'Fun Emoji' },
  { id: 'emo-cool', name: 'Cool', style: 'fun-emoji', seed: 'Cool', category: 'Fun Emoji' },
  { id: 'emo-star', name: 'Star', style: 'fun-emoji', seed: 'Star', category: 'Fun Emoji' },
  { id: 'emo-vibe', name: 'Vibe', style: 'fun-emoji', seed: 'Vibe', category: 'Fun Emoji' },
  { id: 'emo-cyber', name: 'Cyber', style: 'fun-emoji', seed: 'Cyber', category: 'Fun Emoji' },
  { id: 'emo-smiley', name: 'Smiley', style: 'fun-emoji', seed: 'Smiley', category: 'Fun Emoji' },
  { id: 'emo-sunny', name: 'Sunny', style: 'fun-emoji', seed: 'Sunny', category: 'Fun Emoji' },
  { id: 'emo-wink', name: 'Wink', style: 'fun-emoji', seed: 'Wink', category: 'Fun Emoji' },
  { id: 'emo-heart', name: 'Heart', style: 'fun-emoji', seed: 'Heart', category: 'Fun Emoji' },
];

export const getDiceBearSvgUrl = (style: string, seed: string): string => {
  // Use DiceBear 10.x API with full vibrant native backgrounds
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
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
      // If legacy 9.x URL, upgrade to 10.x
      if (avatarVal.includes('api.dicebear.com/9.x/')) {
        return avatarVal.replace('/9.x/', '/10.x/').replace('&backgroundColor=transparent', '');
      }
      return avatarVal;
    }
    // If it matches a mascot preset ID
    const preset = getMascotById(avatarVal);
    if (preset) {
      return getDiceBearSvgUrl(preset.style, preset.seed);
    }
    // If it's custom dicebear format e.g. "dicebear:bottts-neutral:Spark"
    if (avatarVal.startsWith('dicebear:')) {
      const parts = avatarVal.split(':');
      if (parts.length >= 3) {
        return getDiceBearSvgUrl(parts[1], parts[2]);
      }
    }
    if (avatarVal.startsWith('custom:')) {
      const seed = avatarVal.replace('custom:', '');
      return getDiceBearSvgUrl('bottts-neutral', seed);
    }
  }

  // Fallback: generate deterministic bottts-neutral mascot based on name/id
  const seed = (fallbackSeed || 'leeflet').trim() || 'leeflet';
  return getDiceBearSvgUrl('bottts-neutral', seed);
};

export const isMascotAvatar = (avatarVal?: string): boolean => {
  if (!avatarVal) return false;
  return (
    avatarVal.startsWith('http') ||
    avatarVal.startsWith('dicebear:') ||
    avatarVal.startsWith('custom:') ||
    MASCOT_PRESETS.some((m) => m.id === avatarVal)
  );
};
