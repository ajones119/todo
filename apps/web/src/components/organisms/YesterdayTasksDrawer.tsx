import { useTasksForDate, useCompleteTask } from '@/api/tasks';
import { Card, CardContent } from '@/components/ui/8bit/card';
import { Checkbox } from '@/components/ui/8bit/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/8bit/drawer';
import { Button as BitButton } from '@/components/ui/8bit/button';
import { subDays } from 'date-fns';
import { format } from 'date-fns';
import { formatCategoryName } from '@/lib/category-stats';

type YesterdayTasksDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const YesterdayTasksDrawer = ({ open, onOpenChange }: YesterdayTasksDrawerProps) => {
  const yesterday = subDays(new Date(), 1);
  const { data: tasks, isLoading, error } = useTasksForDate(yesterday);
  const completeTaskMutation = useCompleteTask();
  const yesterdayDateStr = format(yesterday, 'EEEE, MMMM d, yyyy');

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    // Pass the start of yesterday (midnight UTC) as the completion date
    // Create a UTC date for yesterday at midnight
    const yesterdayUTC = new Date(Date.UTC(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      0, 0, 0, 0
    ));
    
    console.log('Completing task for yesterday:', yesterdayUTC.toISOString());
    
    await completeTaskMutation.mutateAsync({ 
      templateId: taskId, 
      completed,
      date: yesterdayUTC.toISOString(),
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="max-h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle>Complete Yesterday&apos;s Tasks</DrawerTitle>
          <DrawerDescription>
            You missed completing tasks for {yesterdayDateStr}. Complete them now to keep your streak going!
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
          {isLoading && (
            <div className="text-center py-8">
              <p>Loading yesterday&apos;s tasks...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading tasks: {error.message}</p>
            </div>
          )}
          
          {!isLoading && !error && (!tasks || tasks.length === 0) && (
            <div className="text-center py-8">
              <p>No tasks were scheduled for yesterday.</p>
            </div>
          )}
          
          {!isLoading && !error && tasks && tasks.length > 0 && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!task.completedAt}
                        onCheckedChange={(checked) => {
                          if (task.id) {
                            handleToggleComplete(task.id, checked === true);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{task.title}</h3>
                        {task.category && (
                          <p className="text-sm text-muted-foreground">
                            Category: {formatCategoryName(task.category)}
                          </p>
                        )}
                        {task.weight !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Weight: {task.weight}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <DrawerFooter>
          <BitButton onClick={() => onOpenChange(false)}>
            Done
          </BitButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

