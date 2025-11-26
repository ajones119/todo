import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getRecentCompletedGoalsForSingleUser = createTool({
  id: "get-recent-completed-goals-for-single-user",
  description: "Get the recent completed goals for a single user",
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user to get the recent completed goals for"),
  }),
  outputSchema: z.array(z.object({
    id: z.string().describe("the ID of the goal"),
    name: z.string().describe("the name of the goal"),
    completedAt: z.string().describe("the date and time the goal was completed"),
  })),
  execute: async ({ context, runtimeContext }) => {
    const { userId } = context;


    const supabase = runtimeContext.get("supabase") as SupabaseClient;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    const { data, error } = await supabase.from('Goal')
        .select('id, name, completedAt, category')
        .eq('userId', userId)
        .is('deletedAt', null)
        .lte('completedAt', new Date().toISOString())
        .gte('completedAt', new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString());
    if (error) {
      console.error('Error fetching recent completed goals for user:', error);
      return [];
    }

    console.log("\n\n\n\nRECENT COMPLETED GOALS FOR USER:", userId, data.length);
    return data.map((goal) => ({
      id: goal.id,
      name: goal.name,
      completedAt: goal.completedAt,
      category: goal.category,
    }));
  },
});