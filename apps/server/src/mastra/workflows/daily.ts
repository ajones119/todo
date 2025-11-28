import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QUEST_TEMPLATES } from "../../constants/Quest_Board.js";
import { dailyAuthorAgent } from "../agents/dailyAuthor.js";
import { getRecentCompletedGoalsForSingleUser } from "../tools/getRecentCompletedGoalsForSingleUser.js";
import { getCurrentWeeklySummary } from "../tools/getCurrentWeeklySummary.js";
import { getCharacterDailySummaries } from "../tools/getCharacterDailySummaries.js";
import { addGoalTemplatesForUser } from "../tools/addGoalTemplatesForUser.js";
import { writeCharacterDailySummary } from "../tools/writeCharacterDailySummary.js";

// Helper to get user count
const getUserCount = async (supabase: SupabaseClient): Promise<number> => {
  try {
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('[addQuestsToBoard] Error listing users for quest board:', listError);
      return 0;
    }

    return allUsers?.users?.length || 0;
  } catch (error) {
    console.error('[addQuestsToBoard] Error fetching user count:', error);
    return 0;
  }
};

// Helper to calculate quest count based on user count
const calculateQuestCount = (userCount: number): number => {
  const min = 5;
  const max = 25;
  
  if (userCount === 0) {
    return min;
  }
  
  const lowerBound = userCount;
  const upperBound = Math.floor(userCount * 1.5);
  
  // Generate random number between lowerBound and upperBound
  const randomCount = Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
  
  // Clamp between min and max
  return Math.max(min, Math.min(max, randomCount));
};

// Step to add quests to the board
const addGenericQuestsToBoard = createStep({
  id: "add-quests-to-board",
  description: "Add random quest templates to the Quest Board based on the current user count",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    message: z.string()
  }),
  execute: async ({ runtimeContext }) => {
    // Get Supabase client from runtime context
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }

    try {
      // Get user count
      const userCount = await getUserCount(supabase);
      
      // Calculate how many quests to add
      const questCount = calculateQuestCount(userCount);
      
      // Get random quests from templates
      const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
      const randomQuests = shuffled.slice(0, questCount);
      
      // Insert into Quest_Board_Templates table
      const questsToInsert = randomQuests.map(quest => ({
        name: quest.name,
        category: quest.category,
        weight: quest.weight,
        daysToComplete: quest.daysToComplete,
      }));

      const { data, error } = await supabase
        .from('Quest_Board_Templates')
        .insert(questsToInsert)
        .select();

      if (error) {
        console.error('[addQuestsToBoard] Error adding quests to board:', error);
        throw new Error(`Failed to add quests to board: ${error.message}`);
      }

      const result = {
        message: JSON.stringify({
          success: true,
          questsAdded: data?.length || 0,
          userCount,
          questCount,
        }),
      };

      console.log(`[addQuestsToBoard] Added ${data?.length || 0} quests to Quest Board (based on ${userCount} users)`);
      return result;
    } catch (error) {
      console.error('[addQuestsToBoard] Error in quest board step:', error);
      throw error;
    }
  }
});

const addUserCultivatedGoalsToBoard = createStep({
  id: "add-user-cultivated-goals-to-board",
  description: "Add user cultivated goals to the Goal Board and write daily narratives",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    message: z.string()
  }),
  execute: async ({ runtimeContext }) => {
    const supabase = runtimeContext?.get("supabase") as SupabaseClient | undefined;
    if (!supabase) {
      throw new Error("Supabase client not found in runtime context");
    }
    
    // Get all users who have characters
    const { data: characters, error: charactersError } = await supabase
      .from('To_do_Character')
      .select('userId, name, description, level, title');
    
    if (charactersError) {
      console.error('[addUserCultivatedGoalsToBoard] Error fetching characters:', charactersError);
      throw new Error(`Failed to fetch characters: ${charactersError.message}`);
    }
    
    const uniqueUsers = [...new Set(characters?.map(character => character.userId) || [])];
    console.log(`[addUserCultivatedGoalsToBoard] Processing ${uniqueUsers.length} users`);

    // Get current weekly summary once (shared across all users)
    const weeklySummary = await getCurrentWeeklySummary.execute({
      context: {},
      runtimeContext,
    });

    // Process each user
    const results = await Promise.all(uniqueUsers.map(async (userId) => {
      try {
        // Get character info for this user
        const character = characters?.find(c => c.userId === userId);
        if (!character) {
          console.error(`[addUserCultivatedGoalsToBoard] No character found for user ${userId}`);
          return { userId, success: false, error: "Character not found" };
        }

        // Fetch all data for this user in parallel
        const [recentGoals, dailySummaries] = await Promise.all([
          getRecentCompletedGoalsForSingleUser.execute({
            context: { userId },
            runtimeContext,
          }),
          getCharacterDailySummaries.execute({
            context: { userId },
            runtimeContext,
          }),
        ]);

        // Build agent context
        const agentContext = {
          userId,
          character: {
            name: character.name,
            description: character.description,
            level: character.level,
            title: character.title,
          },
          recentGoals,
          weeklySummary,
          dailySummaries: dailySummaries.summaries,
        };

        // Create prompt for the agent
        const prompt = `You are writing today's daily adventure for ${character.name || 'the character'}. Use the JSON context below to craft a short narrative and respond with the required JSON structure:

${JSON.stringify(agentContext, null, 2)}`;

        // Invoke the daily author agent
        const response = await dailyAuthorAgent.generate(prompt, {
          runtimeContext,
        });

        const rawText = response.text?.trim();
        if (!rawText) {
          throw new Error("Daily author agent did not return a response. Expected JSON output.");
        }

        let dailyOutput: {
          agentNotes: string;
          goals: Array<{
            name: string;
            category: 'gold' | 'intelligence' | 'health' | 'strength' | 'wisdom' | 'charisma' | 'stamina' | 'luck';
            daysToComplete: number;
            weight: number;
          }>;
        };

        try {
          dailyOutput = JSON.parse(rawText);
        } catch (error) {
          console.error(`[addUserCultivatedGoalsToBoard] Failed to parse agent JSON for user ${userId}:`, rawText);
          throw new Error("Daily author agent response was not valid JSON.");
        }

        if (!dailyOutput.agentNotes || !Array.isArray(dailyOutput.goals)) {
          throw new Error("Daily author agent JSON missing required fields (agentNotes, goals).");
        }

        // Save goals
        if (dailyOutput.goals.length > 0) {
          const goalsResult = await addGoalTemplatesForUser.execute({
            context: {
              userId,
              goals: dailyOutput.goals,
            },
            runtimeContext,
          });

          if (!goalsResult.success) {
            console.error(`[addUserCultivatedGoalsToBoard] Failed to save goals for user ${userId}`);
          }
        }

        // Save daily summary
        const summaryResult = await writeCharacterDailySummary.execute({
          context: {
            userId,
            agentNotes: dailyOutput.agentNotes,
          },
          runtimeContext,
        });

        if (!summaryResult.success) {
          throw new Error(`Failed to save daily summary for user ${userId}`);
        }

        return {
          userId,
          success: true,
          goalsAdded: dailyOutput.goals.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[addUserCultivatedGoalsToBoard] Error processing user ${userId}:`, errorMessage);
        return {
          userId,
          success: false,
          error: errorMessage,
        };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    const totalGoals = results.reduce((sum, r) => sum + (r.success ? (r.goalsAdded || 0) : 0), 0);

    console.log(`[addUserCultivatedGoalsToBoard] Completed: ${successCount}/${uniqueUsers.length} users, ${totalGoals} goals added`);

    return {
      message: JSON.stringify({
        success: true,
        results,
        summary: {
          usersProcessed: uniqueUsers.length,
          usersSucceeded: successCount,
          totalGoalsAdded: totalGoals,
        },
      }),
    };
  },
});

// Export daily workflow
export const dailyWorkflow = createWorkflow({
  id: "daily-workflow",
  description: "Daily tasks including adding quest templates to the Quest Board",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    message: z.string()
  })
})
  .then(addGenericQuestsToBoard)
  .then(addUserCultivatedGoalsToBoard)
  .commit();

