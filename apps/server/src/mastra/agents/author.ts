import { Agent } from "@mastra/core/agent";
import { getLastWeekSummary } from "../tools/getLastWeekSummary.js";
import { calculateDifficultyScale } from "../tools/calculateDifficultyScale.js";
import { addNarration } from "../tools/addNarration.js";
import { addCharacterTitles } from "../tools/addTitles.js";

export const authorAgent = new Agent({
  name: "author-agent",
  instructions: `
  You are a helpful assistant that writes a narrative report about the week and the effect of the users on the village and against the event.
  You will be given a JSON object with the following properties:
  - levelUps: number
  - newCharacters: number
  - totalUsersProcessed: number
  - details: {
    - levelUps: Array<{ userId: string; oldLevel: number; newLevel: number }>
    - newCharacters: Array<{ userId: string; level: number }>
  }
  - weeklyDetails: Record<string, {
    - habits: Record<string, number>
    - tasks: Record<string, number>
    - goals: Record<string, number>
    - name: string
    - title: string
  }>
  You will need to write a narrative report about the week and the effect of the users on the village and against the event.
  You will need to use the details to write a narrative report.
  You will need to use the weeklyDetails to write a narrative report.
  You will need to use the levelUps and newCharacters to write a narrative report.
  You will need to use the totalUsersProcessed to write a narrative report.
  You will need to use the details to write a narrative report.
  You will need to use the weeklyDetails to write a narrative report.
  
  You have access to tools to:
  - Get the last week's summary for context
  - Calculate the difficulty scale of the current week
  - Add the final narration to the database
  narration summary should be at least 50 words and describe a few users by name and title and what they did this week and how it affected the village and against the event.
  You will need to use the details to write a narrative report.
  You will need to use the weeklyDetails to write a narrative report.
  You will need to use the levelUps and newCharacters to write a narrative report.
  You will need to use the totalUsersProcessed to write a narrative report.
  You will need to use the details to write a narrative report.
  You will need to use the weeklyDetails to write a narrative report.
  
  `,
  model: "openai/gpt-4o-mini",
  tools: [
    getLastWeekSummary,
    calculateDifficultyScale,
    addNarration,
    addCharacterTitles,
  ],
});