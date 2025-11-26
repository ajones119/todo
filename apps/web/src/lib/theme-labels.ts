type Theme = "light" | "dark" | "fighter" | "wizard" | "rogue" | "system";

export interface ThemeLabels {
  habits: string;
  goals: string;
  tasks: string;
}

const THEME_LABELS: Record<Exclude<Theme, "system">, ThemeLabels> = {
  light: {
    habits: "Habits",
    goals: "Goals",
    tasks: "Quests",
  },
  dark: {
    habits: "Habits",
    goals: "Goals",
    tasks: "Quests",
  },
  fighter: {
    habits: "Training",
    goals: "Missions",
    tasks: "Chores",
  },
  wizard: {
    habits: "Cantrips",
    goals: "Rituals",
    tasks: "Spells",
  },
  rogue: {
    habits: "Practice",
    goals: "Heists",
    tasks: "Jobs",
  },
};

export function getThemeLabels(theme: Theme | null = null): ThemeLabels {
  if (!theme || theme === "system") {
    // Default to light for system
    return THEME_LABELS.light;
  }
  return THEME_LABELS[theme] || THEME_LABELS.light;
}

export function getCurrentTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('initiative-tracker-theme') as Theme;
  if (stored) return stored;
  
  // Check if any theme class is on the document
  const root = document.documentElement;
  if (root.classList.contains('fighter')) return 'fighter';
  if (root.classList.contains('wizard')) return 'wizard';
  if (root.classList.contains('rogue')) return 'rogue';
  if (root.classList.contains('dark')) return 'dark';
  
  return 'system';
}

// Helper to get singular form for button text
export function getSingularLabel(pluralLabel: string): string {
  // Handle special cases
  if (pluralLabel === 'Training' || pluralLabel === 'Practice') {
    return pluralLabel; // Already singular
  }
  
  // Remove trailing 's' for plural forms
  if (pluralLabel.endsWith('s')) {
    return pluralLabel.slice(0, -1);
  }
  
  return pluralLabel;
}

