import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getRecentWeeklySummaries = createTool({
  id: "get-recent-weekly-summaries",
  description:
    "Fetch the most recent weekly summaries (newest first) to provide narrative context. Returns up to the last five chapters.",
  inputSchema: z.object({
    limit: z.number().min(1).max(10).default(5),
  }),
  outputSchema: z.object({
    summaries: z
      .array(
        z.object({
          id: z.string().nullable(),
          summary: z.string().nullable(),
          nextWeekPrompt: z.string().nullable(),
          agentNotes: z.string().nullable(),
          createdAt: z.string().nullable(),
        })
      )
      .describe("Weekly summaries ordered from newest to oldest"),
  }),
  execute: async ({ context, runtimeContext }) => {
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;

    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }

    const { limit = 5 } = context;

    const { data, error } = await supabase
      .from("To_do_Weekly_Summary")
      .select("id, summary, nextWeekPrompt, agentNotes, createdAt")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[getRecentWeeklySummaries] Error fetching summaries:", error);
      throw new Error(`Failed to fetch summaries: ${error.message}`);
    }

    return {
      summaries: data ?? [],
    };
  },
});

