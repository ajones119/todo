import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const inputSchema = z.object({
    characters: z.array(z.object({
        userId: z.string(),
        title: z.string(),
    })),
});

export const addCharacterTitles = createTool({
  id: "add-character-titles",
  description: "Add titles to characters after the weekly narrative is generated. This is the title for the next week's narrative and signifies the direction and past achievements of this character",
  inputSchema: inputSchema,
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { characters } = context;

    const supabase = runtimeContext.get("supabase") as SupabaseClient;

    if (!supabase) {
      return { success: false, error: "Supabase client not found in runtime context" };
    }
    
    // Batch size: process 250 updates at a time to avoid overwhelming the database
    // This scales well even with 10,000+ characters
    const BATCH_SIZE = 250;
    
    // Process updates in batches for optimal performance
    for (let i = 0; i < characters.length; i += BATCH_SIZE) {
      const batch = characters.slice(i, i + BATCH_SIZE);
      
      // Process each batch in parallel
      // Missing characters are silently skipped (update affects 0 rows, no error thrown)
      await Promise.all(
        batch.map((character) =>
          supabase
            .from('To_do_Character')
            .update({ title: character.title })
            .eq('userId', character.userId)
        )
      );
    }

    return { success: true };
  },
});