import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiRequest } from './root';
import { supabase } from './root';
import type { TaskTemplate } from '@todo/types';
import type { Task } from '@/components/organisms/TaskForm';
import { toast } from 'sonner';
import { subDays, addDays } from 'date-fns';

// API response type - TaskTemplate with completion status
type TaskResponse = TaskTemplate & {
  completedAt?: string | null; // Completion status from task_complete table
};

// Helper function to fetch tasks for a specific date
const fetchTasksForDate = async (targetDate: Date): Promise<TaskResponse[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch templates (exclude soft-deleted tasks)
  const { data: templates, error: templatesError } = await supabase
    .from('Task_Template')
    .select('*')
    .is('deletedAt', null) // Only get tasks that haven't been deleted
    .order('createdAt', { ascending: false });

  if (templatesError) {
    console.error('Error fetching task templates:', templatesError);
    throw new Error(templatesError.message);
  }

  // Get start and end of target date in UTC
  // Create UTC dates for the target date at midnight
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth();
  const targetDay = targetDate.getUTCDate();
  
  const startOfTargetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
  const endOfTargetDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999));
  
  // Format as ISO strings for Supabase query
  const startOfTargetISO = startOfTargetDate.toISOString();
  const endOfTargetISO = endOfTargetDate.toISOString();
  
  console.log('Fetching completions for date range:', startOfTargetISO, 'to', endOfTargetISO);
  
  // Fetch completions for the target date
  // IMPORTANT: Filter by completedAt (the date it's completed for) and complete = true
  const { data: completions, error: completionsError } = await supabase
    .from('Task_Complete')
    .select('template, completedAt')
    .eq('userId', user.id)
    .eq('complete', true) // Only get records where complete is true
    .gte('completedAt', startOfTargetISO)
    .lte('completedAt', endOfTargetISO);
  
  console.log('Found completions:', completions);

  if (completionsError) {
    console.error('Error fetching completions:', completionsError);
    // Don't throw, just continue without completion data
  }

  // Map completions to templates
  const completionMap = new Map(
    (completions || []).map(c => [c.template, c.completedAt])
  );

  // Merge completion data into templates
  return (templates || []).map(template => ({
    ...template,
    completedAt: completionMap.get(template.id) || null,
  })) as TaskResponse[];
};

// Fetch task templates directly from Supabase with select *
export const useTaskTemplates = () => {
  return useQuery({
    queryKey: ['taskTemplates'],
    queryFn: async (): Promise<TaskResponse[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      return fetchTasksForDate(new Date());
    },
  });
};

export type NewTask = Omit<TaskTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>
// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: NewTask): Promise<TaskResponse> => {
      return apiRequest<TaskResponse>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    },
    onSuccess: () => {
      // Invalidate tasks query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
    },
  });
};

// Update task mutation
// For updates, rrule can be the full array (client handles appending)
type UpdateTaskData = Partial<Task>;

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, task }: { id: string; task: UpdateTaskData }): Promise<TaskResponse> => {
      return apiRequest<TaskResponse>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(task),
      });
    },
    onSuccess: () => {
      // Invalidate tasks query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
    },
  });
};

// Delete task mutation (soft delete - sets deletedAt)
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<TaskResponse> => {
      return apiRequest<TaskResponse>(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate tasks query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
    },
  });
};

// Fetch tasks for a specific date (e.g., yesterday)
export const useTasksForDate = (targetDate: Date) => {
  return useQuery({
    queryKey: ['taskTemplates', targetDate.toISOString().split('T')[0]],
    queryFn: () => fetchTasksForDate(targetDate),
  });
};

// Prefetch hook for tasks - prefetches day before and day after the given date
export const usePrefetchAdjacentDays = (currentDate: Date) => {
  const queryClient = useQueryClient();

  const prefetchAdjacentDays = useCallback(async () => {
    const previousDay = subDays(currentDate, 1);
    const nextDay = addDays(currentDate, 1);

    const previousDayKey = previousDay.toISOString().split('T')[0];
    const nextDayKey = nextDay.toISOString().split('T')[0];

    // Prefetch both days in parallel
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['taskTemplates', previousDayKey],
        queryFn: () => fetchTasksForDate(previousDay),
      }),
      queryClient.prefetchQuery({
        queryKey: ['taskTemplates', nextDayKey],
        queryFn: () => fetchTasksForDate(nextDay),
      }),
    ]);
  }, [currentDate, queryClient]);

  return { prefetchAdjacentDays };
};

// Complete task mutation (sets completion state)
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      completed, 
      date 
    }: { 
      templateId: string; 
      completed: boolean;
      date?: string; // Optional ISO date string for date override
    }): Promise<TaskResponse> => {
      return apiRequest<TaskResponse>(`/tasks/${templateId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completed, ...(date && { date }) }),
      });
    },
    //add optimistic updates
    onMutate: async ({ templateId, completed, date }: { templateId: string; completed: boolean; date?: string }): Promise<{ previousTasks?: TaskResponse[]; previousDateTasks?: TaskResponse[] }> => {
      const todayKey = new Date().toISOString().split('T')[0];
      const dateKey = date ? new Date(date).toISOString().split('T')[0] : todayKey;
      const isToday = !date || dateKey === todayKey;
      
      let previousTasks: TaskResponse[] | undefined;
      let previousDateTasks: TaskResponse[] | undefined;
      
      // Only update today's tasks if we're completing for today
      if (isToday) {
        await queryClient.cancelQueries({ queryKey: ['taskTemplates'] });
        previousTasks = queryClient.getQueryData<TaskResponse[]>(['taskTemplates']);
        
        if (previousTasks) {
          queryClient.setQueryData<TaskResponse[]>(['taskTemplates'], (old) => {
            if (!old) return old;
            return old.map(task => 
              task.id === templateId 
                ? { ...task, completedAt: completed ? new Date().toISOString() : null } 
                : task
            );
          });
        }
      } else {
        // Completing for a different date - only update that date's query
        await queryClient.cancelQueries({ queryKey: ['taskTemplates', dateKey] });
        previousDateTasks = queryClient.getQueryData<TaskResponse[]>(['taskTemplates', dateKey]);
        
        if (previousDateTasks) {
          queryClient.setQueryData<TaskResponse[]>(['taskTemplates', dateKey], (old) => {
            if (!old) return old;
            return old.map(task => 
              task.id === templateId 
                ? { ...task, completedAt: completed ? date : null } 
                : task
            );
          });
        }
      }
      
      return { previousTasks, previousDateTasks };
    },
    onSuccess: (_data, { templateId, completed, date }) => {
      const todayKey = new Date().toISOString().split('T')[0];
      const dateKey = date ? new Date(date).toISOString().split('T')[0] : todayKey;
      const isToday = !date || dateKey === todayKey;
      
      // Only update today's tasks if we completed for today
      if (isToday) {
        queryClient.setQueryData<TaskResponse[]>(['taskTemplates'], (old) => {
          if (!old) return old;
          return old.map(task => 
            task.id === templateId 
              ? { ...task, completedAt: completed ? new Date().toISOString() : null } 
              : task
          );
        });
      } else {
        // Only update the date-specific query for the target date
        queryClient.setQueryData<TaskResponse[]>(['taskTemplates', dateKey], (old) => {
          if (!old) return old;
          return old.map(task => 
            task.id === templateId 
              ? { ...task, completedAt: completed ? date : null } 
              : task
          );
        });
      }

      // Add toast notification with the task category and weighted value (2x multiplier)
      const taskFromCache = queryClient.getQueryData<TaskResponse[]>(['taskTemplates'])?.find(task => task.id === templateId) ||
                           queryClient.getQueryData<TaskResponse[]>(['taskTemplates', dateKey])?.find(task => task.id === templateId);
      if (taskFromCache && completed) {
        const weightedValue = 2 * (taskFromCache?.weight || 1);
        toast.success(` +${weightedValue} ${taskFromCache.category || ''}`);
      } else if (taskFromCache && !completed) {
        const weightedValue = 2 * (taskFromCache?.weight || 1);
        toast.success(` -${weightedValue} ${taskFromCache.category || ''}`);
      }
    },
    onError: (_error, variables, context) => {
      // Rollback to previous state on error
      toast.error('Failed to complete task');
      if (context?.previousTasks) {
        queryClient.setQueryData(['taskTemplates'], context.previousTasks);
      }
      // Also rollback date-specific query if it was updated
      if (variables.date && context?.previousDateTasks) {
        const dateKey = new Date(variables.date).toISOString().split('T')[0];
        queryClient.setQueryData(['taskTemplates', dateKey], context.previousDateTasks);
      }
    },
  });
};
