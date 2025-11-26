import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const calculateDifficultyScale = createTool({
  id: "calculate-difficulty-scale",
  description: "Calculate a difficulty scale based on user activity data. Takes aggregated user data and calculates an overall difficulty rating.",
  inputSchema: z.object({
    userAggregates: z.record(z.object({
      habits: z.record(z.number()),
      tasks: z.record(z.number()),
      goals: z.record(z.number()),
      name: z.string(),
      title: z.string(),
    })),
  }),
  outputSchema: z.object({
    difficultyScale: z.number().min(1).max(10),
    totalPoints: z.number(),
    averagePointsPerUser: z.number(),
    userCount: z.number(),
    breakdown: z.object({
      habitsPoints: z.number(),
      tasksPoints: z.number(),
      goalsPoints: z.number(),
    }),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { userAggregates } = context;
    
    let totalPoints = 0;
    let habitsPoints = 0;
    let tasksPoints = 0;
    let goalsPoints = 0;
    const userCount = Object.keys(userAggregates).length;
    
    // Calculate total points across all users
    Object.values(userAggregates).forEach(userData => {
      // Sum habits points
      const userHabitsPoints = Object.values(userData.habits).reduce((sum, points) => sum + points, 0);
      habitsPoints += userHabitsPoints;
      
      // Sum tasks points
      const userTasksPoints = Object.values(userData.tasks).reduce((sum, points) => sum + points, 0);
      tasksPoints += userTasksPoints;
      
      // Sum goals points
      const userGoalsPoints = Object.values(userData.goals).reduce((sum, points) => sum + points, 0);
      goalsPoints += userGoalsPoints;
      
      totalPoints += userHabitsPoints + userTasksPoints + userGoalsPoints;
    });
    
    const averagePointsPerUser = userCount > 0 ? totalPoints / userCount : 0;
    
    // Calculate difficulty scale (1-10)
    // Higher total points = higher difficulty (more activity = harder week)
    // Scale based on total points with some normalization
    // Rough scale: 0-100 = 1, 100-200 = 2, etc., capped at 10
    // But we'll use a more nuanced calculation
    let difficultyScale = 1;
    if (totalPoints > 0) {
      // Base difficulty on total points with logarithmic scaling
      // 0-50: 1-2, 50-150: 2-4, 150-300: 4-6, 300-500: 6-8, 500+: 8-10
      if (totalPoints < 50) {
        difficultyScale = 1 + (totalPoints / 50);
      } else if (totalPoints < 150) {
        difficultyScale = 2 + ((totalPoints - 50) / 50);
      } else if (totalPoints < 300) {
        difficultyScale = 4 + ((totalPoints - 150) / 75);
      } else if (totalPoints < 500) {
        difficultyScale = 6 + ((totalPoints - 300) / 100);
      } else {
        difficultyScale = 8 + Math.min(2, (totalPoints - 500) / 250);
      }
      difficultyScale = Math.min(10, Math.max(1, Math.round(difficultyScale * 10) / 10));
    }
    
    const result = {
      difficultyScale,
      totalPoints,
      averagePointsPerUser: Math.round(averagePointsPerUser * 100) / 100,
      userCount,
      breakdown: {
        habitsPoints,
        tasksPoints,
        goalsPoints,
      },
    };
    
    console.log('[calculateDifficultyScale] Result:', result);
    return result;
  },
});

