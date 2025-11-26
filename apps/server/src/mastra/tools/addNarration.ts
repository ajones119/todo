import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const inputSchema = z.object({
  summary: z.string(),
  nextWeekPrompt: z.string(),
  agentNotes: z.string(),
});

export const addNarration = createTool({
  id: "add-narration",
  description: "Add a narration to the week",
  inputSchema: inputSchema,
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { summary, nextWeekPrompt, agentNotes } = context;

    const supabase = runtimeContext.get("supabase") as SupabaseClient;

    if (!supabase) {
      return { success: false, error: "Supabase client not found in runtime context" };
    }
    
    const { data, error } = await supabase
      .from('To_do_Weekly_Summary')
      .insert({
        summary,
        nextWeekPrompt,
        agentNotes,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
});