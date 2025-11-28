import { createTool } from "@mastra/core/tools";
import { z } from "zod";

function computeTemperature(): number {
  const randomInt = Math.floor(Math.random() * 31) + 1; // 1-31 inclusive
  return randomInt;
}

export const getCurrentDayTemperature = createTool({
  id: "get-current-day-temperature",
  description:
    "Returns a random number between 1 and 31 to use as a narrative temperature knob. Re-run each week to vary tone/energy.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    temperature: z.number().int().min(1).max(31).describe("Suggested temperature for the author agent (1-31)"),
  }),
  execute: async () => {
    return { temperature: computeTemperature() };
  },
});

export { computeTemperature };

