import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './root';
import { supabase } from './root';
import type { Goal } from '@todo/types';
import { toast } from 'sonner';
import type { QuestBoardTemplate } from './quest-board';

// API response type
type GoalResponse = Goal;

// Fetch goals directly from Supabase
export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async (): Promise<GoalResponse[]> => {
      // RLS handles userId filtering
      const { data, error } = await supabase
        .from('Goal')
        .select('*')
        .is('deletedAt', null)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        throw new Error(error.message);
      }

      return (data || []) as GoalResponse[];
    },
  });
};

export type NewGoal = Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

// Create goal mutation
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: NewGoal & { questBoardTemplateId?: string }): Promise<GoalResponse> => {
      return apiRequest<GoalResponse>('/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
      });
    },
    onMutate: async (variables) => {
      // Optimistically remove quest from quest board if it's from a template
      if (variables.questBoardTemplateId) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['quest-board'] });

        // Snapshot the previous value
        const previousQuests = queryClient.getQueryData<QuestBoardTemplate[]>(['quest-board']);

        // Optimistically remove the quest
        if (previousQuests) {
          queryClient.setQueryData<QuestBoardTemplate[]>(['quest-board'], (old) => {
            if (!old) return old;
            return old.filter(quest => quest.id !== variables.questBoardTemplateId);
          });
        }

        return { previousQuests };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // If this was from a quest board, invalidate that query too (to ensure consistency)
      if (variables.questBoardTemplateId) {
        queryClient.invalidateQueries({ queryKey: ['quest-board'] });
        

        toast.success('Goal created');
      
    }},
    onError: (error, variables, context) => {
      // Rollback optimistic update if it was from quest board
      if (variables.questBoardTemplateId && context?.previousQuests) {
        queryClient.setQueryData(['quest-board'], context.previousQuests);
      }
      toast.error('Failed to create goal');
      console.error('Create goal error:', error);
    },
  });
};

// Update goal mutation
type UpdateGoalData = Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, goal }: { id: string; goal: UpdateGoalData }): Promise<GoalResponse> => {
      return apiRequest<GoalResponse>(`/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(goal),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated');
    },
    onError: (error) => {
      toast.error('Failed to update goal');
      console.error('Update goal error:', error);
    },
  });
};

// Delete goal mutation
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<GoalResponse> => {
      return apiRequest<GoalResponse>(`/goals/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete goal');
      console.error('Delete goal error:', error);
    },
  });
};

// Complete/uncomplete goal mutation
export const useCompleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }): Promise<GoalResponse> => {
      return apiRequest<GoalResponse>(`/goals/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
    },
    onMutate: async ({ id, completed }: { id: string; completed: boolean }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] });

      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData<GoalResponse[]>(['goals']);

      // Optimistically update the cache
      if (previousGoals) {
        queryClient.setQueryData<GoalResponse[]>(['goals'], (old) => {
          if (!old) return old;
          return old.map(goal =>
            goal.id === id
              ? { ...goal, completedAt: completed ? new Date().toISOString() : null }
              : goal
          );
        });
      }

      return { previousGoals };
    },
    onError: (error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      toast.error('Failed to update goal');
      console.error('Complete goal error:', error);
    },
    onSuccess: (_data, variables) => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Add toast notification with the goal category and weighted value (3x multiplier)
      const goalFromCache = queryClient.getQueryData<GoalResponse[]>(['goals'])?.find(goal => goal.id === variables.id);
      if (goalFromCache) {
        const weightedValue = (goalFromCache?.fromTemplate ? 4 : 3) * (goalFromCache?.weight || 1);
        if (variables.completed) {
          toast.success(` +${weightedValue} ${goalFromCache.category || ''}`);
        } else {
          toast.success(` -${weightedValue} ${goalFromCache.category || ''}`);
        }
      }
    },
  });
};

