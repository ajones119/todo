import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './root';

export interface WeeklyStats {
  [category: string]: number;
}

export interface UserCharacter {
  userId: string;
  level: number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export const useWeeklyStats = () => {
  return useQuery({
    queryKey: ['stats', 'weekly'],
    queryFn: async (): Promise<WeeklyStats> => {
      return apiRequest<WeeklyStats>('/stats/weekly');
    },
  });
};

export const useUserCharacter = () => {
  return useQuery({
    queryKey: ['stats', 'user'],
    queryFn: async (): Promise<UserCharacter> => {
      return apiRequest<UserCharacter>('/stats/user');
    },
  });
};

export interface UpdateCharacterRequest {
  name: string;
  description?: string;
}

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateCharacterRequest): Promise<UserCharacter> => {
      return apiRequest<UserCharacter>('/stats/user', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch character data
      queryClient.invalidateQueries({ queryKey: ['stats', 'user'] });
    },
  });
};

