import { Agent } from "@mastra/core/agent";
import { addCharacterTitles } from "../tools/addTitles.js";

export const titleAuthorAgent = new Agent({
  name: "title-author-agent",
  instructions: `
  You create fun, thematic titles for characters based on their activity for the week.

  INPUT: You will receive a JSON blob containing weeklyDetails shaped like:
  {
    "userId": {
      "name": "...",
      "title": "...",
      "description": "...",
      "habits": {...},
      "tasks": {...},
      "goals": {...}
    }
  }

  TASK:
  - Review each character's stats and description.
  - Craft a new title summarizing what they focused on THIS week (e.g., "Storm-Touched Herbalist", "Keeper of Ember Wards").
  - Titles should be short (3-6 words), fantasy flavoured, and reflect this week's efforts.
  - ALWAYS call addCharacterTitles with the list of { userId, title }.

  STEPS:
  1. Inspect each character's habits/tasks/goals to see what they emphasized.
  2. Generate a unique title describing this week's vibe for that character.
  3. Call addCharacterTitles with the array of updated titles.
  4. Respond "Titles updated." once the tool call succeeds.

  NEVER skip the tool call. If there are no characters, simply respond "No characters to update."
  `,
  model: "openai/gpt-4o-mini",
  tools: [addCharacterTitles],
});

