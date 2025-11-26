import { 
  Heart, 
  Brain, 
  Coins, 
  Dumbbell, 
  BookOpen, 
  Users, 
  Sparkles,
  Target,
  Zap,
  Shield,
  type LucideProps
} from 'lucide-react';
import React from 'react';

// RPG-style stats that categories map to
export type StatType = 
  | 'health'      // Physical wellness, cardio, exercise
  | 'intelligence' // Learning, studying, reading
  | 'wealth'      // Work, income, financial
  | 'strength'    // Physical strength, weightlifting
  | 'wisdom'      // Knowledge, meditation, reflection
  | 'charisma'    // Social, relationships, networking
  | 'luck'        // Random positive events
  | 'focus'       // Concentration, productivity
  | 'stamina'     // Endurance, consistency
  | 'defense';    // Stress management, resilience

// Category to stat mapping - RPG stat categories map to their corresponding stats
export const categoryToStat: Record<string, StatType> = {
  // Core RPG Stats (categories themselves are stat names)
  'gold': 'wealth',          // Work, income, financial tasks
  'intelligence': 'intelligence', // Study, learning, new skills, education
  'health': 'health',        // Cardio, wellness, general fitness
  'strength': 'strength',    // Workouts, weightlifting, physical strength
  'wisdom': 'wisdom',        // Meditation, mindfulness, reflection
  'charisma': 'charisma',    // Social, relationships, networking
  'stamina': 'stamina',      // Endurance activities, long-term consistency
  'defense': 'defense',      // Stress management, resilience, self-care
  'focus': 'focus',          // Productivity, concentration, task completion
  'luck': 'luck',            // Random positive events, serendipity
  
  // Legacy/alternative category names (for backwards compatibility and flexibility)
  'work': 'wealth',
  'income': 'wealth',
  'finance': 'wealth',
  'money': 'wealth',
  'business': 'wealth',
  'study': 'intelligence',
  'studying': 'intelligence',
  'learning': 'intelligence',
  'education': 'intelligence',
  'reading': 'intelligence',
  'skill': 'intelligence',
  'cardio': 'health',
  'fitness': 'health',
  'exercise': 'health',
  'workout': 'strength', // Fixed: workout is strength
  'work out': 'strength',
  'wellness': 'health',
  'weightlifting': 'strength',
  'lifting': 'strength',
  'meditation': 'wisdom',
  'mindfulness': 'wisdom',
  'reflection': 'wisdom',
  'creativity': 'wisdom',
  'social': 'charisma',
  'relationships': 'charisma',
  'networking': 'charisma',
  'personal': 'focus',
  'other': 'luck',
};

// Stat to icon mapping
export const statToIcon: Record<StatType, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  health: Heart,
  intelligence: Brain,
  wealth: Coins,
  strength: Dumbbell,
  wisdom: BookOpen,
  charisma: Users,
  luck: Sparkles,
  focus: Target,
  stamina: Zap,
  defense: Shield,
};

// Stat display names (RPG-themed)
export const statDisplayName: Record<StatType, string> = {
  health: 'Health',
  intelligence: 'Intelligence',
  wealth: 'Gold',
  strength: 'Strength',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
  luck: 'Luck',
  focus: 'Focus',
  stamina: 'Stamina',
  defense: 'Defense',
};

// Get stat for a category
export const getStatForCategory = (category: string | undefined): StatType => {
  if (!category) return 'luck';
  const normalized = category.toLowerCase().trim();
  return categoryToStat[normalized] || 'luck';
};

// Get icon for a category
export const getIconForCategory = (category: string | undefined): React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> => {
  const stat = getStatForCategory(category);
  return statToIcon[stat];
};

// Get display name for a category's stat
export const getStatDisplayName = (category: string | undefined): string => {
  const stat = getStatForCategory(category);
  return statDisplayName[stat];
};

// Format category name for display (capitalizes first letter)
export const formatCategoryName = (category: string | undefined): string => {
  if (!category) return '';
  const normalized = category.toLowerCase().trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
