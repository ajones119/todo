import { createStep } from "@mastra/core";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// Step that uses RuntimeContext to access Supabase client
export const getWeekOfTasksAndAggregate = createStep({
  id: "get-week-of-tasks-and-aggregate",
  description: "Get the week of tasks, habits, and goals and aggregate the data into totals for each category",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    output: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    // Calculate week ago from current date
    const currentDate = new Date();
    const startDateObj = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDateObj = new Date(currentDate);
    
    // Get Supabase client from runtime context
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Query all task completions for the week
    const { data: taskCompletions, error: tasksError } = await supabase
      .from('Task_Complete')
      .select('*')
      .eq('complete', true)
      .gte('completedAt', startDateObj.toISOString())
      .lte('completedAt', endDateObj.toISOString());
    
    if (tasksError) {
      console.error('Error fetching task completions:', tasksError);
    }
    
    // Query all habit completions for the week
    const { data: habitCompletions, error: habitsError } = await supabase
      .from('Habit_Complete')
      .select('*')
      .gte('createdAt', startDateObj.toISOString())
      .lte('createdAt', endDateObj.toISOString());
    
    if (habitsError) {
      console.error('Error fetching habit completions:', habitsError);
    }
    
    // Query all goal completions for the week
    const { data: goalCompletions, error: goalsError } = await supabase
      .from('Goal')
      .select('*')
      .not('completedAt', 'is', null)
      .gte('completedAt', startDateObj.toISOString())
      .lte('completedAt', endDateObj.toISOString());
    
    if (goalsError) {
      console.error('Error fetching goal completions:', goalsError);
    }
    
    // Get all templates to get weights and categories
    const { data: taskTemplates, error: taskTemplatesError } = await supabase
      .from('Task_Template')
      .select('id, weight, category');
    
    if (taskTemplatesError) {
      console.error('Error fetching task templates:', taskTemplatesError);
    }
    
    const { data: habitTemplates, error: habitTemplatesError } = await supabase
      .from('Habit_Template')
      .select('id, weight, category');
    
    if (habitTemplatesError) {
      console.error('Error fetching habit templates:', habitTemplatesError);
    }
    
    // Create template maps for quick lookup
    const taskTemplateMap = new Map(
      (taskTemplates || []).map(t => [t.id, { weight: t.weight || 1, category: t.category || 'other' }])
    );
    
    const habitTemplateMap = new Map(
      (habitTemplates || []).map(h => [h.id, { weight: h.weight || 1, category: h.category || 'other' }])
    );
    
    // Type bonuses
    const TYPE_BONUS = {
      habits: 1,
      tasks: 2,
      goals: 3,
    };
    
    // Get all unique user IDs from completions
    const allUserIds = new Set<string>();
    (taskCompletions || []).forEach(task => allUserIds.add(task.userId));
    (habitCompletions || []).forEach(habit => allUserIds.add(habit.userId));
    (goalCompletions || []).forEach(goal => allUserIds.add(goal.userId));
    
    // Fetch character data for all users with completions
    const userIdsArray = Array.from(allUserIds);
    let characters: Array<{ userId: string; name: string | null; title: string | null; description: string | null }> = [];
    
    if (userIdsArray.length > 0) {
      const { data, error: charactersError } = await supabase
        .from('To_do_Character')
        .select('userId, name, title, description')
        .in('userId', userIdsArray);
      
      if (charactersError) {
        console.error('Error fetching characters:', charactersError);
      } else {
        characters = data || [];
      }
    }
    
    // Create a map of userId to character data
    const characterMap = new Map(
      characters.map(char => [char.userId, { 
        name: char.name || '', 
        title: char.title || '',
        description: char.description || ''
      }])
    );
    
    // Initialize the result map: { [userId]: { habits: { [category]: total }, tasks: { [category]: total }, goals: { [category]: total }, name: string, title: string, description: string } }
    const userAggregates: Record<string, {
      habits: Record<string, number>;
      tasks: Record<string, number>;
      goals: Record<string, number>;
      name: string;
      title: string;
      description: string;
    }> = {};
    
    // Helper to initialize user if not exists
    const initUser = (userId: string) => {
      if (!userAggregates[userId]) {
        const character = characterMap.get(userId);
        userAggregates[userId] = {
          habits: {},
          tasks: {},
          goals: {},
          name: character?.name || '',
          title: character?.title || '',
          description: character?.description || '',
        };
      }
    };
    
    // Helper to add points to a category
    const addPoints = (
      userId: string,
      type: 'habits' | 'tasks' | 'goals',
      category: string,
      points: number
    ) => {
      initUser(userId);
      const normalizedCategory = (category || 'other').toLowerCase().trim();
      userAggregates[userId][type][normalizedCategory] = 
        (userAggregates[userId][type][normalizedCategory] || 0) + points;
    };
    
    // Process task completions
    (taskCompletions || []).forEach(task => {
      const template = taskTemplateMap.get(task.template);
      if (template) {
        const weight = template.weight || 1;
        const points = 1 * weight * TYPE_BONUS.tasks; // 1 completion * weight * type bonus
        addPoints(task.userId, 'tasks', template.category, points);
      }
    });
    
    // Process habit completions
    (habitCompletions || []).forEach(habit => {
      const template = habitTemplateMap.get(habit.template);
      if (template) {
        const weight = template.weight || 1;
        const positiveCount = habit.positiveCount || 0;
        const negativeCount = habit.negativeCount || 0; 
        const points = (positiveCount * weight * TYPE_BONUS.habits) - (negativeCount * weight * TYPE_BONUS.habits); // count * weight * type bonus
        addPoints(habit.userId, 'habits', template.category, points);
      }
    });
    
    // Process goal completions
    (goalCompletions || []).forEach(goal => {
      const weight = goal.weight || 1;
      const category = goal.category || 'other';
      const points = 1 * weight * TYPE_BONUS.goals; // 1 completion * weight * type bonus
      addPoints(goal.userId, 'goals', category, points);
    });
    
    const result = { 
      output: JSON.stringify(userAggregates),
    };
    
    console.log('[getWeekOfTasksAndAggregate] Result:', JSON.stringify(userAggregates, null, 2));
    return result;
  },
});