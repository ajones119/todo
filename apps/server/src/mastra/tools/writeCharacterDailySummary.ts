import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const writeCharacterDailySummary = createTool({
  id: "write-character-daily-summary",
  description: "Write to the character daily summary. This document has a createdAt, userId, and agentNotes. The agent should write 2-3 sentences max of readable notes for AI agents to parse and use to write the next section of story.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to write the daily summary for"),
    agentNotes: z.string().max(500).describe("2-3 sentences max of readable notes for AI agents to parse and use to write the next section of story"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().nullable(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { userId, agentNotes } = context;
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Create the daily summary with current timestamp
    const { data, error } = await supabase
      .from('To_do_Character_Daily_Summary')
      .insert({
        userId,
        agentNotes,
        createdAt: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[writeCharacterDailySummary] Error writing daily summary:', error);
      throw new Error(`Failed to write daily summary: ${error.message}`);
    }
    
    const result = {
      success: true,
      id: data?.id || null,
    };
    
    console.log(`[writeCharacterDailySummary] Successfully wrote daily summary for user ${userId}`);
    return result;
  },
});

