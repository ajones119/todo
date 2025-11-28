import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeekOfTasksAndAggregate } from "../tools/getWeekOfTasksAndAggregate.js";
import { getRecentWeeklySummaries } from "../tools/getRecentWeeklySummaries.js";
import { getLastWeekSummary } from "../tools/getLastWeekSummary.js";
import { getCurrentDayTemperature } from "../tools/getCurrentDayTemperature.js";
import { calculateDifficultyScale } from "../tools/calculateDifficultyScale.js";
import { addNarration } from "../tools/addNarration.js";
import { authorAgent } from "../agents/author.js";
import { titleAuthorAgent } from "../agents/titleAuthor.js";

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
        description: string;
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
    
    // Fetch recent chapters for context
    const { summaries: recentSummaries } = await getRecentWeeklySummaries.execute({
      context: { limit: 5 },
      runtimeContext,
    });

    // Determine next week number from agent notes (look for "Week #N")
    const weekNumberRegex = /Week\s*#(\d+)/i;
    const latestWeekNumber = recentSummaries.reduce((max, summary) => {
      const match = summary.agentNotes?.match(weekNumberRegex);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);
    const nextWeekNumber = (latestWeekNumber || 0) + 1;

    // Compute dynamic temperature
    const { temperature } = await getCurrentDayTemperature.execute({
      context: {},
      runtimeContext,
    });

    // Fetch last week's summary explicitly
    const lastWeekSummary = await getLastWeekSummary.execute({
      context: {},
      runtimeContext,
    });

    // Calculate difficulty scale based on weekly details
    const difficulty = await calculateDifficultyScale.execute({
      context: {
        userAggregates: workflowData.weeklyDetails || {},
      },
      runtimeContext,
    });

    const agentContext = {
      weekNumber: nextWeekNumber,
      temperature,
      difficulty,
      lastWeekSummary,
      recentSummaries,
      workflowData,
    };

    // Create a prompt for the agent with all the workflow data
    const prompt = `You are writing Week #${nextWeekNumber}. Use the JSON context below to craft this week's chapter and respond with the required JSON structure:

${JSON.stringify(agentContext, null, 2)}
`;

    // Invoke the author agent with the prompt and runtime context
    const response = await authorAgent.generate(prompt, {
      runtimeContext,
    });
    
    console.log('[writeNarrativeReport] Author agent raw response:', response);

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("Author agent did not return a narrative. Expected JSON output.");
    }

    let narrativeOutput: {
      summary: string;
      nextWeekPrompt: string;
      agentNotes: string;
      weekNumber?: number;
    };

    try {
      narrativeOutput = JSON.parse(rawText);
    } catch (error) {
      console.error("[writeNarrativeReport] Failed to parse agent JSON:", rawText);
      throw new Error("Author agent response was not valid JSON.");
    }

    if (!narrativeOutput.summary || !narrativeOutput.nextWeekPrompt || !narrativeOutput.agentNotes) {
      throw new Error("Author agent JSON missing required fields (summary, nextWeekPrompt, agentNotes).");
    }

    const normalizedWeekNumber =
      typeof narrativeOutput.weekNumber === "number" && Number.isFinite(narrativeOutput.weekNumber)
        ? narrativeOutput.weekNumber
        : nextWeekNumber;

    // Persist the narration via tool (workflow-controlled)
    const saveResult = await addNarration.execute(
      {
        context: {
          summary: narrativeOutput.summary,
          nextWeekPrompt: narrativeOutput.nextWeekPrompt,
          agentNotes: narrativeOutput.agentNotes,
        },
        runtimeContext,
      }
    );

    if (!saveResult.success) {
      throw new Error(`Failed to save narration: ${saveResult.error ?? "unknown error"}`);
    }

    const result = {
      output: JSON.stringify({
        success: true,
        summary: narrativeOutput.summary,
        nextWeekPrompt: narrativeOutput.nextWeekPrompt,
        agentNotes: narrativeOutput.agentNotes,
        weekNumber: normalizedWeekNumber,
        workflowData,
      }),
    };
    
    console.log('[writeNarrativeReport] Narrative saved successfully:', saveResult.record);
    return result;
  }
});

const updateCharacterTitles = createStep({
  id: "update-character-titles",
  description: "Generate flavorful character titles using the weekly details and save them via addCharacterTitles.",
  inputSchema: z.object({
    output: z.string(),
  }),
  outputSchema: z.object({
    output: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    let previousStep: {
      success: boolean;
      summary: string;
      nextWeekPrompt: string;
      agentNotes: string;
      workflowData: {
        weeklyDetails: Record<string, unknown>;
      };
      weekNumber?: number;
    };

    try {
      previousStep = JSON.parse(inputData.output);
    } catch (error) {
      console.error("[updateCharacterTitles] Error parsing previous step output:", error);
      throw new Error("Failed to parse previous step output");
    }

    const weeklyDetails = previousStep?.workflowData?.weeklyDetails;
    if (!weeklyDetails || Object.keys(weeklyDetails).length === 0) {
      console.log("[updateCharacterTitles] No weekly details found, skipping title updates.");
      return {
        output: JSON.stringify({
          success: true,
          summary: previousStep.summary,
          nextWeekPrompt: previousStep.nextWeekPrompt,
          agentNotes: previousStep.agentNotes,
          weekNumber: previousStep.weekNumber,
          workflowData: previousStep?.workflowData,
          titleUpdateResponse: "No characters to update.",
        }),
      };
    }

    const prompt = `You are updating character titles after the weekly narrative was written.

Here are the weekly details for each character:
${JSON.stringify(weeklyDetails, null, 2)}

TASK:
- For EACH userId, create a short, fantasy-styled title that reflects what they focused on THIS week.
- Call addCharacterTitles with an array of { userId, title }.

Respond with "Titles updated." when complete.`;

    const response = await titleAuthorAgent.generate(prompt, {
      runtimeContext,
    });

    return {
      output: JSON.stringify({
        success: true,
        summary: previousStep.summary,
        nextWeekPrompt: previousStep.nextWeekPrompt,
        agentNotes: previousStep.agentNotes,
        weekNumber: previousStep.weekNumber,
        workflowData: previousStep.workflowData,
        titleUpdateResponse: response.text,
      }),
    };
  },
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
  .then(updateCharacterTitles)
  .commit();

