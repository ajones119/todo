import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QUEST_TEMPLATES } from "../../constants/Quest_Board.js";
import { dailyAuthorAgent } from "../agents/dailyAuthor.js";

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
  description: "Add user cultivated goals to the Goal Board",
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
    
    // get all users who have characters by getting all characters and creating a list of unique users
    const { data: characters, error: charactersError } = await supabase.from('To_do_Character').select('userId');
    if (charactersError) {
      console.error('[addUserCultivatedGoalsToBoard] Error fetching characters:', charactersError);
      throw new Error(`Failed to fetch characters: ${charactersError.message}`);
    }
    const uniqueUsers = [...new Set(characters.map(character => character.userId))];

    console.log("\n\n\n\nADDING USER CULTIVATED GOALS TO BOARD FOR USERS:", uniqueUsers.length);

    // pass each userId to the ai agent to run daily author agent
    const results = await Promise.all(uniqueUsers.map(userId => dailyAuthorAgent.generate(`Create 1-3 goal templates for the user with id ${userId}. First get their recent completed goals, then create new goals based on their activity patterns and insert them using the addGoalTemplatesForUser tool.`, {
      runtimeContext,
    })));

    return {
      message: JSON.stringify({
        success: true,
        results,
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

