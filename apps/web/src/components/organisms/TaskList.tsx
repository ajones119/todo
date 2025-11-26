import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { useTaskTemplates, useTasksForDate, useCompleteTask, useDeleteTask, usePrefetchAdjacentDays } from '@/api/tasks';
import { Checkbox } from '@/components/ui/8bit/checkbox';
import { Button as BitButton } from '@/components/ui/8bit/button';
import { Calendar } from '@/components/ui/8bit/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/8bit/drawer';
import { ScrollArea } from '@/components/ui/8bit/scroll-area';
import { Spinner } from '@/components/ui/8bit/spinner';
import { TaskForm, type Task } from './TaskForm';
import { RRule } from 'rrule';
import { CalendarIcon, Edit, Trash2, SunIcon, PlusIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useThemeLabels } from '@/hooks/useThemeLabels';
import { getSingularLabel } from '@/lib/theme-labels';
import { Card, CardContent } from '../ui/8bit/card';
import { getIconForCategory } from '@/lib/category-stats';

// Task response type matching the API
type TaskResponse = Task & {
  id: string;
  userId?: string;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
};

// Check if a specific date is in the recurrence pattern
const isDateInPattern = (rruleString: string, targetDate: Date): boolean => {
  try {
    if (!rruleString || rruleString.trim() === '') return false;
    
    // Clean the rrule string (remove trailing semicolons)
    const cleanRRule = rruleString.replace(/;+$/, '');
    
    // Parse the RRule
    const rrule = RRule.fromString(cleanRRule);
    
    // Get target date at midnight UTC
    const target = new Date(targetDate);
    target.setUTCHours(0, 0, 0, 0);
    
    // Check if target date is in the recurrence pattern
    const dtstart = rrule.options.dtstart || new Date();
    dtstart.setUTCHours(0, 0, 0, 0);
    
    // If target date is before the start date, it's not in the pattern
    if (target < dtstart) return false;
    
    // Check if target date matches the pattern by getting occurrences around it
    const occurrences = rrule.between(
      new Date(target.getTime() - 24 * 60 * 60 * 1000), // Day before
      new Date(target.getTime() + 24 * 60 * 60 * 1000), // Day after
      true // inclusive
    );
    
    // Check if any occurrence matches the target date
    return occurrences.some(occurrence => {
      const occDate = new Date(occurrence);
      occDate.setUTCHours(0, 0, 0, 0);
      return occDate.getTime() === target.getTime();
    });
  } catch (error) {
    console.error('Error checking if date is in pattern:', error);
    return false;
  }
};

type TaskListProps = {};

type SwipeableTaskItemProps = {
  task: TaskResponse;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

const SwipeableTaskItem = ({ task, onToggleComplete, onTaskClick, onDelete }: SwipeableTaskItemProps) => {
  const x = useMotionValue(0);
  const EDIT_THRESHOLD = 40;
  const DELETE_THRESHOLD = -40;
  const EDIT_CONFIRM_THRESHOLD = 80;
  const DELETE_CONFIRM_THRESHOLD = -80;
  const editOpacity = useTransform(x, [0, EDIT_THRESHOLD], [0, 1]);
  const deleteOpacity = useTransform(x, [EDIT_THRESHOLD, 0, DELETE_THRESHOLD], [0, 0, 1]);
  const isCompleted = !!task.completedAt;
  
  return (
    <motion.li 
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
    >
      {/* Background action buttons - absolutely positioned */}
      <div className="absolute inset-0 flex">
        <motion.div style={{ opacity: editOpacity }} className="w-dvw flex items-center justify-start text-primary-foreground bg-primary pl-4">
          <BitButton variant="ghost" size="sm" onClick={() => onTaskClick?.(task as Task)}>
            <Edit className="h-4 w-4" />
          </BitButton>
        </motion.div>
        <div className="flex-1" />
        <motion.div style={{ opacity: deleteOpacity }} className="w-dvw flex items-center justify-end text-destructive-foreground bg-destructive pr-4">
          <BitButton variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4" />
          </BitButton>
        </motion.div>
      </div>

      {/* Swipeable content - absolutely positioned and offset */}
      <motion.div
        className="absolute inset-0"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.2}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
        onDragEnd={(_e, info) => {
          const currentX = info.offset.x;
          if (currentX >= EDIT_CONFIRM_THRESHOLD) {
            onTaskClick?.(task as Task);
            x.set(0);
          } else if (currentX <= DELETE_CONFIRM_THRESHOLD) {
            onDelete(task.id);
            x.set(0);
          } else if (currentX >= EDIT_THRESHOLD) {
            x.set(140);
          } else if (currentX <= DELETE_THRESHOLD) {
            x.set(-140);
          } else {
            x.set(0);
          }
        }}
        whileDrag={{ cursor: "grabbing" }}
        style={{ x }}
      >
        <motion.div 
          className="flex items-center gap-4 p-2 bg-background hover:bg-muted/50 transition-colors relative z-10"
          animate={isCompleted ? {
            opacity: 0.7,
          } : {}}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={isCompleted ? {
              scale: [1, 1.2, 1],
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <Checkbox
              checked={!!task.completedAt}
              onCheckedChange={(checked) => {
                if (task.id) {
                  onToggleComplete(task.id, checked === true);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {task.category && (() => {
                const Icon = getIconForCategory(task.category);
                return <Icon className="h-3 w-3 text-muted-foreground shrink-0" />;
              })()}
              <span className="font-regular text-xs block">{task.title}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Spacer to maintain height in document flow */}
      <div className="flex items-center gap-4 p-2 pointer-events-none invisible">
        <Checkbox checked={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-regular text-xs block">{task.title}</span>
          </div>
        </div>
      </div>
    </motion.li>
  );
};

export const TaskList = ({}: TaskListProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const labels = useThemeLabels();
  
  // Use date-specific query if date is not today, otherwise use today's query
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const todayQuery = useTaskTemplates();
  const dateQuery = useTasksForDate(selectedDate);
  
  const { data: tasks, isLoading, error } = isToday ? todayQuery : dateQuery;
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();
  const { prefetchAdjacentDays } = usePrefetchAdjacentDays(selectedDate);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 640px)').matches);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Prefetch adjacent days when selectedDate changes
  useEffect(() => {
    prefetchAdjacentDays();
  }, [selectedDate, prefetchAdjacentDays]);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDrawerOpen(true);
  };

  // Get the date string for completion (midnight UTC of the target date)
  const getCompletionDate = () => {
    const targetDate = new Date(selectedDate);
    return new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      0, 0, 0, 0
    )).toISOString();
  };

  const handleToggleComplete = async (taskId: string, completed: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the task click
    }
    const completionDate = isToday ? undefined : getCompletionDate();
    await completeTaskMutation.mutateAsync({ 
      templateId: taskId, 
      completed,
      date: completionDate,
    });
  };


  // Always show all tasks (no filtering)
  const allTasks = tasks || [];

  const { todaysTasks, otherTasks } = allTasks.reduce(
    (acc, task) => {
      // Check if task occurs today
      let occursToday = false;
      if (!task.rrule || task.rrule.length === 0) {
        // Tasks without rrule always occur
        occursToday = true;
      } else {
        const lastRrule = task.rrule[task.rrule.length - 1];
        occursToday = isDateInPattern(lastRrule, selectedDate);
      }

      if (occursToday) {
        acc.todaysTasks.push(task);
      } else {
        acc.otherTasks.push(task);
      }
      return acc;
    },
    { todaysTasks: [] as typeof allTasks, otherTasks: [] as typeof allTasks }
  );

  // Sort both groups alphabetically by title
  const sortedTodaysTasks = [...todaysTasks].sort((a, b) => 
    (a.title || '').localeCompare(b.title || '')
  );
  const sortedOtherTasks = [...otherTasks].sort((a, b) => 
    (a.title || '').localeCompare(b.title || '')
  );

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
          <h2 className="text-xl retro inline-flex items-center gap-2">
            <SunIcon className="h-5 w-5" />
            <span>{labels.tasks}</span>
          </h2>
          <Drawer 
            open={drawerOpen} 
            onOpenChange={(open) => {
              setDrawerOpen(open);
              if (!open) {
                setEditingTask(null);
              }
            }}
          >
            <DrawerTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <BitButton onClick={() => setEditingTask(null)}><PlusIcon className="h-4 w-4" /></BitButton>
              </motion.div>
            </DrawerTrigger>
            <DrawerContent 
              side={isDesktop ? "right" : "bottom"}
              className={isDesktop ? "w-full sm:max-w-lg" : "w-full"}
            >
                <DrawerHeader className="shrink-0">
                  <DrawerTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="pl-6 pr-4 pb-4">
                    <TaskForm
                      initialData={editingTask || undefined}
                      onSubmit={() => {
                        setDrawerOpen(false);
                        setEditingTask(null);
                      }}
                    />
                  </div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
        </div>
        <Card className=" ">
          <CardContent className="flex items-center justify-between ">
          <BitButton
            variant="outline"
            size="sm"
            onClick={handlePreviousDay}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </BitButton>
          <Popover>
            <PopoverTrigger asChild>
              <BitButton variant="outline" size="sm" className="gap-2 text-xs">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'MMM d, yyyy')}
              </BitButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <BitButton
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </BitButton>
          </CardContent>
        </Card>
        {isLoading && <Spinner />}
        {error && <p className="text-red-500">Error loading tasks</p>}
        {!isLoading && (sortedTodaysTasks.length > 0 || sortedOtherTasks.length > 0) && (
        <motion.ul 
          className="space-y-2 relative"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          <AnimatePresence mode="popLayout">
            {/* Today's tasks */}
            {sortedTodaysTasks.map((task) => (
              <SwipeableTaskItem
                key={task.id}
                task={task}
                onToggleComplete={(taskId, completed) => {
                  handleToggleComplete(taskId, completed);
                }}
                onTaskClick={handleTaskClick}
                onDelete={(taskId) => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    deleteTaskMutation.mutate(taskId, {
                      onSuccess: () => {
                        toast.success('Task deleted');
                      },
                      onError: () => {
                        toast.error('Failed to delete task');
                      },
                    });
                  }
                }}
              />
            ))}
          </AnimatePresence>
          
          {/* Divider and other tasks */}
          {sortedOtherTasks.length > 0 && sortedTodaysTasks.length > 0 && (
            <motion.li 
              className="border-t-2 border-foreground dark:border-ring my-2"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          <AnimatePresence mode="popLayout">
            {sortedOtherTasks.map((task) => (
            <SwipeableTaskItem
              key={task.id}
              task={task}
              onToggleComplete={(taskId, completed) => {
                handleToggleComplete(taskId, completed);
              }}
              onTaskClick={handleTaskClick}
              onDelete={(taskId) => {
                if (confirm('Are you sure you want to delete this task?')) {
                  deleteTaskMutation.mutate(taskId, {
                    onSuccess: () => {
                      toast.success('Task deleted');
                    },
                    onError: () => {
                      toast.error('Failed to delete task');
                    },
                  });
                }
              }}
            />
            ))}
          </AnimatePresence>
        </motion.ul>
        )}
        {!isLoading && sortedTodaysTasks.length === 0 && sortedOtherTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border rounded-lg bg-muted/10">
            <SunIcon className="h-12 w-12 text-muted-foreground opacity-50" />
            <h2 className="text-lg retro">No {labels.tasks}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {labels.tasks} are repeating tasks. Create one to get started!
            </p>
            <Drawer 
              open={drawerOpen} 
              onOpenChange={(open) => {
                setDrawerOpen(open);
                if (!open) {
                  setEditingTask(null);
                }
              }}
            >
              <DrawerTrigger asChild>
                <BitButton onClick={() => setEditingTask(null)} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create {getSingularLabel(labels.tasks)}
                </BitButton>
              </DrawerTrigger>
              <DrawerContent 
                side={isDesktop ? "right" : "bottom"}
                className={isDesktop ? "w-full sm:max-w-lg" : "w-full"}
              >
                <DrawerHeader className="shrink-0">
                  <DrawerTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="pl-6 pr-4 pb-4">
                    <TaskForm
                      initialData={editingTask || undefined}
                      onSubmit={() => {
                        setDrawerOpen(false);
                        setEditingTask(null);
                      }}
                    />
                  </div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </div>
    </>
  );
};

