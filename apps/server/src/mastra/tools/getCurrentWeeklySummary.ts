import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getCurrentWeeklySummary = createTool({
  id: "get-current-weekly-summary",
  description: "Get the current weekly summary (the last one in the database) and return it",
  inputSchema: z.object({}),
  outputSchema: z.object({
    summary: z.string().nullable(),
    nextWeekPrompt: z.string().nullable(),
    agentNotes: z.string().nullable(),
    createdAt: z.string().nullable(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Get the newest summary (ordered by createdAt descending, limit 1)
    const { data, error } = await supabase
      .from('To_do_Weekly_Summary')
      .select('summary, nextWeekPrompt, agentNotes, createdAt')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('[getCurrentWeeklySummary] Error fetching summary:', error);
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }
    
    const result = {
      summary: data?.summary || null,
      nextWeekPrompt: data?.nextWeekPrompt || null,
      agentNotes: data?.agentNotes || null,
      createdAt: data?.createdAt || null,
    };
    
    console.log('[getCurrentWeeklySummary] Result:', result);
    return result;
  },
});

