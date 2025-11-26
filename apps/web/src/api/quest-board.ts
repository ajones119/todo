import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './root';

export interface QuestBoardTemplate {
  id: string;
  name: string;
  category: string;
  weight: number;
  daysToComplete?: number;
  userId?: string;
  createdAt: string;
}

export const useQuestBoard = () => {
  return useQuery({
    queryKey: ['quest-board'],
    queryFn: async (): Promise<QuestBoardTemplate[]> => {
      return apiRequest<QuestBoardTemplate[]>('/quest-board');
    },
  });
};

