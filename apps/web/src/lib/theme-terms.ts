/**
 * Theme-specific terminology for Pinegate Village
 * Provides class-appropriate terms based on the current theme
 */

import { User, Sun, Repeat, Target, Sword, Sparkles, Eye } from 'lucide-react';

type Theme = 'fighter' | 'wizard' | 'rogue' | 'light' | 'dark' | 'system';

export const getTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  
  const root = document.documentElement;
  if (root.classList.contains('fighter')) return 'fighter';
  if (root.classList.contains('wizard')) return 'wizard';
  if (root.classList.contains('rogue')) return 'rogue';
  if (root.classList.contains('dark')) return 'dark';
  return 'light';
};

export const themeTerms = {
  fighter: {
    character: 'Warrior',
    class: 'Fighter',
    village: 'Pinegate Village',
    residents: 'warriors',
    abilities: 'combat skills',
    bonuses: 'martial prowess',
    strength: 'physical might',
    growth: 'training',
    icons: {
      dashboard: Sword,
      quests: Sun,
      habits: Repeat,
      goals: Target,
    },
  },
  wizard: {
    character: 'Mage',
    class: 'Wizard',
    village: 'Pinegate Village',
    residents: 'mages',
    abilities: 'arcane powers',
    bonuses: 'magical enhancements',
    strength: 'arcane knowledge',
    growth: 'study',
    icons: {
      dashboard: Sparkles,
      quests: Sun,
      habits: Repeat,
      goals: Target,
    },
  },
  rogue: {
    character: 'Rogue',
    class: 'Rogue',
    village: 'Pinegate Village',
    residents: 'rogues',
    abilities: 'stealth skills',
    bonuses: 'shadow techniques',
    strength: 'cunning',
    growth: 'practice',
    icons: {
      dashboard: Eye,
      quests: Sun,
      habits: Repeat,
      goals: Target,
    },
  },
  default: {
    character: 'Character',
    class: 'Adventurer',
    village: 'Pinegate Village',
    residents: 'residents',
    abilities: 'abilities',
    bonuses: 'persistent bonuses',
    strength: 'strength',
    growth: 'growth',
    icons: {
      dashboard: User,
      quests: Sun,
      habits: Repeat,
      goals: Target,
    },
  },
} as const;

export const getThemeTerms = () => {
  const theme = getTheme();
  if (theme === 'fighter' || theme === 'wizard' || theme === 'rogue') {
    return themeTerms[theme];
  }
  return themeTerms.default;
};

