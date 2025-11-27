import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getRecentCompletedGoalsForSingleUser = createTool({
  id: "get-recent-completed-goals-for-single-user",
  description: "Get all goals, habits, and task templates for a single user with their names and categories",
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user to get the goals, habits, and tasks for"),
  }),
  outputSchema: z.array(z.object({
    name: z.string().describe("the name of the goal, habit, or task"),
    completedAt: z.string().optional().describe("the date and time the goal was completed (only for goals)"),
    category: z.string().describe("the category of the goal, habit, or task"),
  })),
  execute: async ({ context, runtimeContext }) => {
    const { userId } = context;

    const supabase = runtimeContext.get("supabase") as SupabaseClient;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }

    // Fetch recent completed goals
    const { data: goals, error: goalsError } = await supabase
      .from('Goal')
      .select('id, name, completedAt, category')
      .eq('userId', userId)
      .is('deletedAt', null)
      .lte('completedAt', new Date().toISOString())
      .gte('completedAt', new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString());

    if (goalsError) {
      console.error('Error fetching recent completed goals for user:', goalsError);
    }

    // Fetch all habits
    const { data: habits, error: habitsError } = await supabase
      .from('Habit_Template')
      .select('id, name, category')
      .eq('userId', userId)
      .is('deletedAt', null);

    if (habitsError) {
      console.error('Error fetching habits for user:', habitsError);
    }

    // Fetch all task templates
    const { data: tasks, error: tasksError } = await supabase
      .from('Task_Template')
      .select('id, title, category')
      .eq('userId', userId)
      .is('deletedAt', null);

    if (tasksError) {
      console.error('Error fetching tasks for user:', tasksError);
    }

    // Combine all into one list
    const allItems = [
      ...(goals || []).map((goal) => ({
        name: goal.name,
        completedAt: goal.completedAt ?? undefined,
        category: goal.category || 'luck',
      })),
      ...(habits || []).map((habit) => ({
        name: habit.name,
        completedAt: undefined,
        category: habit.category || 'luck',
      })),
      ...(tasks || []).map((task) => ({
        name: task.title, // Tasks use 'title' instead of 'name'
        completedAt: undefined,
        category: task.category || 'luck',
      })),
    ];

    console.log("\n\n\n\nALL ITEMS FOR USER:", userId, {
      goals: goals?.length || 0,
      habits: habits?.length || 0,
      tasks: tasks?.length || 0,
      total: allItems.length
    });

    return allItems;
  },
});