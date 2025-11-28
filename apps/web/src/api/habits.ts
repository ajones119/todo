import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './root';
import { supabase } from './root';
import type { HabitTemplate, HabitCompletion } from '@todo/types';
import { toast } from 'sonner';
import { useReaction } from '@/components/organisms/Reaction';

// API response type - HabitTemplate with completion status
type HabitResponse = HabitTemplate & {
  positiveCount?: number;
  negativeCount?: number;
};

// Helper function to fetch habits with today's completion data
const fetchHabitsForDate = async (targetDate: Date): Promise<HabitResponse[]> => {
  // Fetch templates (exclude soft-deleted habits)
  // RLS handles userId filtering
  const { data: templates, error: templatesError } = await supabase
    .from('Habit_Template')
    .select('*')
    .is('deletedAt', null)
    .order('createdAt', { ascending: false });

  if (templatesError) {
    console.error('Error fetching habit templates:', templatesError);
    throw new Error(templatesError.message);
  }

  // Get start and end of target date in UTC
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth();
  const targetDay = targetDate.getUTCDate();

  const startOfTargetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
  const endOfTargetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999));

  const startOfTargetISO = startOfTargetDate.toISOString();
  const endOfTargetISO = endOfTargetDate.toISOString();

  // Fetch completions for the target date
  // RLS handles userId filtering
  const { data: completions, error: completionsError } = await supabase
    .from('Habit_Complete')
    .select('template, positiveCount, negativeCount')
    .gte('createdAt', startOfTargetISO)
    .lte('createdAt', endOfTargetISO);

  if (completionsError) {
    console.error('Error fetching completions:', completionsError);
    // Don't throw, just continue without completion data
  }

  // Map completions to templates
  const completionMap = new Map(
    (completions || []).map(c => [c.template, { positiveCount: c.positiveCount || 0, negativeCount: c.negativeCount || 0 }])
  );

  // Merge completion data into templates
  return (templates || []).map(template => ({
    ...template,
    positiveCount: completionMap.get(template.id)?.positiveCount || 0,
    negativeCount: completionMap.get(template.id)?.negativeCount || 0,
  })) as HabitResponse[];
};

// Fetch habit templates directly from Supabase
export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async (): Promise<HabitResponse[]> => {
      return fetchHabitsForDate(new Date());
    },
  });
};

export type NewHabit = Omit<HabitTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

// Create habit mutation
export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: Omit<HabitTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<HabitResponse> => {
      return apiRequest<HabitResponse>('/habits', {
        method: 'POST',
        body: JSON.stringify(habit),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created');
    },
    onError: (error) => {
      toast.error('Failed to create habit');
      console.error('Create habit error:', error);
    },
  });
};

// Update habit mutation
type UpdateHabitData = Partial<Omit<HabitTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, habit }: { id: string; habit: UpdateHabitData }): Promise<HabitResponse> => {
      return apiRequest<HabitResponse>(`/habits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(habit),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated');
    },
    onError: (error) => {
      toast.error('Failed to update habit');
      console.error('Update habit error:', error);
    },
  });
};

// Delete habit mutation
export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<HabitResponse> => {
      return apiRequest<HabitResponse>(`/habits/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete habit');
      console.error('Delete habit error:', error);
    },
  });
};

// Increment/decrement habit mutation
export const useIncrementHabit = () => {
  const queryClient = useQueryClient();
  const { runNegativeReaction } = useReaction();

  return useMutation({
    mutationFn: async ({ id, type, date }: { id: string; type: 'positive' | 'negative'; date?: string }): Promise<HabitCompletion> => {
      return apiRequest<HabitCompletion>(`/habits/${id}/increment`, {
        method: 'PATCH',
        body: JSON.stringify({ type, date }),
      });
    },
    onMutate: async ({ id, type }: { id: string; type: 'positive' | 'negative'; date?: string }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitResponse[]>(['habits']);

      // Optimistically update the cache
      if (previousHabits) {
        queryClient.setQueryData<HabitResponse[]>(['habits'], (old) => {
          if (!old) return old;
          return old.map(habit => {
            if (habit.id === id) {
              const currentPositive = habit.positiveCount || 0;
              const currentNegative = habit.negativeCount || 0;
              
              if (type === 'positive') {
                return {
                  ...habit,
                  positiveCount: currentPositive + 1,
                };
              } else {
                return {
                  ...habit,
                  negativeCount: currentNegative + 1,
                };
              }
            }
            return habit;
          });
        });
      }

      if (type === 'negative') {
        runNegativeReaction();
      }

      return { previousHabits };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.error('Failed to update habit');
      console.error('Increment habit error:', error);
    },
    onSuccess: (_data, variables) => {
      // Refetch to ensure we have the latest data
      //queryClient.invalidateQueries({ queryKey: ['habits'] });
      // add toast notification with the habit category and weighted value
      const habitFromCache = queryClient.getQueryData<HabitResponse[]>(['habits'])?.find(habit => habit.id === variables.id);
      if (habitFromCache) {
        const weightedValue = 1 * (habitFromCache?.weight || 1) * (variables.type === 'positive' ? 1 : -1);
        toast.success(` ${weightedValue > 0 ? '+' : ''}${weightedValue} ${habitFromCache.category}`);
      } else {
        toast.success('Habit completed');
      }
    },
  });
};

