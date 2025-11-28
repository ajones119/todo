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
  description: "Save a NEW weekly narrative summary to the database. This creates a NEW entry for THIS week. The summary should describe NEW events happening THIS week, not repeat last week's events. You MUST call this tool to save your narrative.",
  inputSchema: inputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    record: z
      .object({
        id: z.number(),
        summary: z.string(),
        createdAt: z.string(),
      })
      .nullable(),
    error: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { summary, nextWeekPrompt, agentNotes } = context;

    const supabase = runtimeContext.get("supabase") as SupabaseClient;

    if (!supabase) {
      return { success: false, record: null, error: "Supabase client not found in runtime context" };
    }
    
    const { data, error } = await supabase
      .from('To_do_Weekly_Summary')
      .insert({
        summary,
        nextWeekPrompt,
        agentNotes,
      })
      .select('id, summary, createdAt')
      .single();

    if (error) {
      return { success: false, record: null, error: error.message };
    }

    return { success: true, record: data ?? null };
  },
});