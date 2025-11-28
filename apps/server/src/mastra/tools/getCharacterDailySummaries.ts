import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getCharacterDailySummaries = createTool({
  id: "get-character-daily-summaries",
  description: "Get each To_do_Character_Daily_Summary for the userId for the current user for the last week (last 7 days)",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to get daily summaries for"),
  }),
  outputSchema: z.object({
    summaries: z.array(z.object({
      id: z.string().nullable(),
      userId: z.string(),
      agentNotes: z.string().nullable(),
      createdAt: z.string(),
    })),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { userId } = context;
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Calculate 7 days ago from current date
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get daily summaries for the user from the last 7 days
    const { data, error } = await supabase
      .from('To_do_Character_Daily_Summary')
      .select('id, userId, agentNotes, createdAt')
      .eq('userId', userId)
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', currentDate.toISOString())
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('[getCharacterDailySummaries] Error fetching daily summaries:', error);
      throw new Error(`Failed to fetch daily summaries: ${error.message}`);
    }
    
    const result = {
      summaries: (data || []).map(summary => ({
        id: summary.id || null,
        userId: summary.userId,
        agentNotes: summary.agentNotes || null,
        createdAt: summary.createdAt,
      })),
    };
    
    console.log(`[getCharacterDailySummaries] Found ${result.summaries.length} daily summaries for user ${userId}`);
    return result;
  },
});

