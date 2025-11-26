import { Mastra } from "@mastra/core/mastra";
import { weeklyWorkflow } from "./workflows/weekly.js";
import { dailyWorkflow } from "./workflows/daily.js";

// Simple Mastra instance - no factory function needed!
// Dependencies are injected via RuntimeContext at runtime
export const mastra = new Mastra({
  workflows: {
    weekly: weeklyWorkflow,
    daily: dailyWorkflow,
  },
});