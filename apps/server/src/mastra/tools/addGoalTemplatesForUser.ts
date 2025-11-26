import { createTool } from "@mastra/core/tools";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const addGoalTemplatesForUser = createTool({
  id: "add-goal-templates-for-user",
  description: "Add goal templates for a user",
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user to add goal templates for"),
    goals: z.array(z.object({
      name: z.string().describe("The name of the goal"),
      category: z.enum(['gold', 'intelligence', 'health', 'strength', 'wisdom', 'charisma', 'stamina', 'luck']).describe("The category of the goal"),
      daysToComplete: z.number().min(1).max(15).describe("The number of days to complete the goal"),
      weight: z.number().min(1).max(5).describe("The weight of the goal"),
    })),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { userId, goals } = context;
    const supabase = runtimeContext.get("supabase") as SupabaseClient;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }

    //ensure user exists
    const { data: user, error: userError } = await supabase.from('To_do_Character').select('*').eq('userId', userId);
    if (userError) {
      console.error('Error checking if user exists:', userError);
      return { success: false };
    }
    if (user.length === 0) {
      console.error('User not found');
      return { success: false };
    }

    //set goals to have a due date of daysToComplete days from today, and userId to be the user's id
    const dueDates = goals.map((goal) => {
      return {
        ...goal,
        userId: userId,
      };
    });

    console.log("\n\n\n\nINSERTING GOALS FOR USER:", userId, goals.length);
    console.log("GOALS:", goals);

    //batch insert the goals
    const BATCH_SIZE = 100;
    for (let i = 0; i < dueDates.length; i += BATCH_SIZE) {
      const batch = dueDates.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from('Quest_Board_Templates').insert(batch);
      if (error) {
        console.error('Error adding goal templates for user:', error);
        return { success: false };
      }
    }
    return { success: true };
  },
});