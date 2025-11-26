import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeekOfTasksAndAggregate } from "../tools/getWeekOfTasksAndAggregate.js";
import { authorAgent } from "../agents/author.js";

// Step to level up users - uses RuntimeContext to access Supabase
const levelUpInvolvedUsers = createStep({
  id: "level-up-involved-users",
  description: "Level up the involved users for the week of tasks, habits, and goals. They gain a level if they completed at least 1 task, habit, or goal.",
  inputSchema: z.object({
    output: z.string(),
  }),
  outputSchema: z.object({
    output: z.string()
  }),
  execute: async ({ inputData, runtimeContext }) => {
    // Get Supabase client from runtime context
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Parse the aggregated data from the previous step
    let userAggregates: Record<string, {
      habits: Record<string, number>;
      tasks: Record<string, number>;
      goals: Record<string, number>;
      name: string;
      title: string;
    }>;
    
    try {
      userAggregates = JSON.parse(inputData.output);
    } catch (error) {
      console.error('[levelUpInvolvedUsers] Error parsing aggregated data:', error);
      throw new Error('Failed to parse aggregated user data');
    }
    
    // Get all user IDs who have completions (they appear in the aggregates)
    const userIdsWithCompletions = Object.keys(userAggregates);
    
    if (userIdsWithCompletions.length === 0) {
      console.log('[levelUpInvolvedUsers] No users with completions found');
      return { output: "No users to level up" };
    }
    
    console.log(`[levelUpInvolvedUsers] Found ${userIdsWithCompletions.length} users with completions`);
    
    // We still need to fetch characters to get their ID and current level for updates
    // (name and title are already in userAggregates, but we need level and id)
    const { data: characters, error: fetchError } = await supabase
      .from('To_do_Character')
      .select('id, userId, level')
      .in('userId', userIdsWithCompletions);
    
    if (fetchError) {
      console.error('[levelUpInvolvedUsers] Error fetching characters:', fetchError);
      throw new Error(`Failed to fetch characters: ${fetchError.message}`);
    }
    
    // Create a map of userId to character for quick lookup
    const characterMap = new Map(
      (characters || []).map(char => [char.userId, char])
    );
    
    // Track level ups
    const levelUps: Array<{ userId: string; oldLevel: number; newLevel: number }> = [];
    const newCharacters: Array<{ userId: string; level: number }> = [];
    
    // Process each user with completions
    for (const userId of userIdsWithCompletions) {
      const userData = userAggregates[userId];
      
      // Check if user has any completions (at least one category with points > 0)
      const hasCompletions = 
        Object.values(userData.habits).some(v => v > 0) ||
        Object.values(userData.tasks).some(v => v > 0) ||
        Object.values(userData.goals).some(v => v > 0);
      
      if (!hasCompletions) {
        console.log(`[levelUpInvolvedUsers] User ${userId} has no actual completions, skipping`);
        continue;
      }
      
      const existingCharacter = characterMap.get(userId);
      
      if (existingCharacter) {
        // User has a character, increment level
        const newLevel = (existingCharacter.level || 1) + 1;
        levelUps.push({
          userId,
          oldLevel: existingCharacter.level || 1,
          newLevel,
        });
        
        const { error: updateError } = await supabase
          .from('To_do_Character')
          .update({ level: newLevel })
          .eq('id', existingCharacter.id);
        
        if (updateError) {
          console.error(`[levelUpInvolvedUsers] Error updating character for user ${userId}:`, updateError);
        } else {
          console.log(`[levelUpInvolvedUsers] Leveled up user ${userId} from ${existingCharacter.level || 1} to ${newLevel}`);
        }
      } else {
        // User doesn't have a character, create one at level 2 (since they completed something)
        newCharacters.push({ userId, level: 2 });
        
        const { error: insertError } = await supabase
          .from('To_do_Character')
          .insert({
            userId: userId,
            level: 2,
          });
        
        if (insertError) {
          console.error(`[levelUpInvolvedUsers] Error creating character for user ${userId}:`, insertError);
        } else {
          console.log(`[levelUpInvolvedUsers] Created new character for user ${userId} at level 2`);
        }
      }
    }
    
    const result = { 
      output: JSON.stringify({
        levelUps: levelUps.length,
        newCharacters: newCharacters.length,
        totalUsersProcessed: userIdsWithCompletions.length,
        details: {
            levelUps,
            newCharacters,
        },
        weeklyDetails: userAggregates,
      }),
    };
    
    console.log('[levelUpInvolvedUsers] Result:', result);
    return result;
  }
});

const writeNarrativeReport = createStep({
  id: "write-narrative-report",
  description: "Write a narrative report about the week and the effect of the users on the village and against the event using the author agent",
  inputSchema: z.object({
    output: z.string(),
  }),
  outputSchema: z.object({
    output: z.string()
  }),
  execute: async ({ inputData, runtimeContext }) => {
    // Parse the data from the previous step
    let workflowData: {
      levelUps: number;
      newCharacters: number;
      totalUsersProcessed: number;
      details: {
        levelUps: Array<{ userId: string; oldLevel: number; newLevel: number }>;
        newCharacters: Array<{ userId: string; level: number }>;
      };
      weeklyDetails: Record<string, {
        habits: Record<string, number>;
        tasks: Record<string, number>;
        goals: Record<string, number>;
        name: string;
        title: string;
      }>;
    };
    
    try {
      workflowData = JSON.parse(inputData.output);
    } catch (error) {
      console.error('[writeNarrativeReport] Error parsing workflow data:', error);
      throw new Error('Failed to parse workflow data');
    }
    
    console.log('='.repeat(80));
    console.log('[writeNarrativeReport] Invoking author agent with workflow data');
    console.log('='.repeat(80));
    
    // Create a prompt for the agent with all the workflow data
    const prompt = `Write a narrative report about this week's activities. Here is the data:

${JSON.stringify(workflowData, null, 2)}

Please:
1. Get the last week's summary for context
2. Calculate the difficulty scale for this week
3. Write a compelling narrative report about the week
4. Save the narration to the database using the addNarration tool

The narrative should describe the effect of the users on the village and against the event, incorporating the level ups, new characters, and weekly activity details.`;

    // Invoke the author agent with the prompt and runtime context
    const response = await authorAgent.generate(prompt, {
      runtimeContext,
    });
    
    console.log('[writeNarrativeReport] Author agent response:', response);
    
    const result = { 
      output: JSON.stringify({
        success: true,
        agentResponse: response.text,
        workflowData,
      }),
    };
    
    console.log('[writeNarrativeReport] Result:', result);
    return result;
  }
});

// Export workflow - no factory function needed!
export const weeklyWorkflow = createWorkflow({
  id: "weekly-workflow",
  description: "Get the week of tasks, habits, and goals and aggregate the data into totals for each category, then write a narrative report about the week and the effect of the users on the village and against the event",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    output: z.string()
  })
})
  .then(getWeekOfTasksAndAggregate)
  .then(levelUpInvolvedUsers)
  .then(writeNarrativeReport)
  .commit();

