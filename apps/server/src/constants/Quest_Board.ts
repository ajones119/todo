// Quest Board Templates - Pool of quest templates to randomly select from
export interface QuestTemplate {
  name: string;
  category: string;
  weight: number; // Always 1-5
  daysToComplete: number; // Days to complete the goal (1-15)
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // Gold/Wealth Quests
  { name: 'Complete a work project', category: 'gold', weight: 3, daysToComplete: 14 },
  { name: 'Update resume', category: 'gold', weight: 2, daysToComplete: 3 },
  { name: 'Negotiate salary increase', category: 'gold', weight: 5, daysToComplete: 15 },
  { name: 'Finish quarterly review', category: 'gold', weight: 4, daysToComplete: 7 },
  { name: 'Organize finances', category: 'gold', weight: 2, daysToComplete: 5 },
  { name: 'Create budget plan', category: 'gold', weight: 3, daysToComplete: 7 },
  
  // Intelligence/Learning Quests
  { name: 'Read a chapter of a book', category: 'intelligence', weight: 1, daysToComplete: 1 },
  { name: 'Complete an online course module', category: 'intelligence', weight: 3, daysToComplete: 7 },
  { name: 'Learn a new programming concept', category: 'intelligence', weight: 4, daysToComplete: 10 },
  { name: 'Study for certification exam', category: 'intelligence', weight: 5, daysToComplete: 15 },
  { name: 'Practice a new language for 30 min', category: 'intelligence', weight: 2, daysToComplete: 5 },
  { name: 'Watch educational video', category: 'intelligence', weight: 1, daysToComplete: 1 },
  { name: 'Write a technical blog post', category: 'intelligence', weight: 4, daysToComplete: 7 },
  
  // Health/Self-Care Quests
  { name: 'Go for a morning walk', category: 'health', weight: 1, daysToComplete: 1 },
  { name: 'Prepare healthy meal', category: 'health', weight: 2, daysToComplete: 1 },
  { name: 'Do 10 minutes of stretching', category: 'health', weight: 1, daysToComplete: 1 },
  { name: 'Get 8 hours of sleep', category: 'health', weight: 2, daysToComplete: 1 },
  { name: 'Drink 8 glasses of water', category: 'health', weight: 1, daysToComplete: 1 },
  { name: 'Take vitamins', category: 'health', weight: 1, daysToComplete: 1 },
  
  // Strength/Workout Quests
  { name: 'Complete strength training session', category: 'strength', weight: 3, daysToComplete: 3 },
  { name: 'Do 50 push-ups', category: 'strength', weight: 2, daysToComplete: 5 },
  { name: 'Squat challenge - 100 reps', category: 'strength', weight: 4, daysToComplete: 7 },
  { name: 'Lift weights at gym', category: 'strength', weight: 3, daysToComplete: 3 },
  { name: 'Bodyweight workout routine', category: 'strength', weight: 2, daysToComplete: 5 },
  
  // Wisdom/Creativity Quests
  { name: 'Write in journal', category: 'wisdom', weight: 1, daysToComplete: 1 },
  { name: 'Create art piece', category: 'wisdom', weight: 3, daysToComplete: 7 },
  { name: 'Practice meditation', category: 'wisdom', weight: 2, daysToComplete: 5 },
  { name: 'Write a poem or story', category: 'wisdom', weight: 3, daysToComplete: 7 },
  { name: 'Reflect on week\'s accomplishments', category: 'wisdom', weight: 2, daysToComplete: 1 },
  { name: 'Practice mindfulness', category: 'wisdom', weight: 1, daysToComplete: 1 },
  
  // Charisma/Socializing Quests
  { name: 'Call a friend', category: 'charisma', weight: 1, daysToComplete: 1 },
  { name: 'Attend networking event', category: 'charisma', weight: 4, daysToComplete: 10 },
  { name: 'Meet someone new', category: 'charisma', weight: 3, daysToComplete: 7 },
  { name: 'Plan social gathering', category: 'charisma', weight: 2, daysToComplete: 5 },
  { name: 'Reach out to old friend', category: 'charisma', weight: 2, daysToComplete: 3 },
  
  // Stamina/Cardio Quests
  { name: 'Run 5k', category: 'stamina', weight: 4, daysToComplete: 7 },
  { name: 'Go for a bike ride', category: 'stamina', weight: 3, daysToComplete: 3 },
  { name: 'Swim 20 laps', category: 'stamina', weight: 4, daysToComplete: 7 },
  { name: 'Complete HIIT workout', category: 'stamina', weight: 3, daysToComplete: 3 },
  { name: 'Long distance walk', category: 'stamina', weight: 2, daysToComplete: 5 },
  
  // Defense/Resilience Quests
  { name: 'Set boundaries at work', category: 'defense', weight: 4, daysToComplete: 7 },
  { name: 'Practice saying no', category: 'defense', weight: 2, daysToComplete: 5 },
  { name: 'Take a mental health day', category: 'defense', weight: 3, daysToComplete: 1 },
  { name: 'Decline unnecessary commitments', category: 'defense', weight: 2, daysToComplete: 3 },
  
  // Focus/Productivity Quests
  { name: 'Complete deep work session', category: 'focus', weight: 3, daysToComplete: 3 },
  { name: 'Clear inbox to zero', category: 'focus', weight: 2, daysToComplete: 5 },
  { name: 'Organize workspace', category: 'focus', weight: 2, daysToComplete: 3 },
  { name: 'Finish pending tasks', category: 'focus', weight: 3, daysToComplete: 7 },
  { name: 'Plan tomorrow\'s priorities', category: 'focus', weight: 1, daysToComplete: 1 },
];

