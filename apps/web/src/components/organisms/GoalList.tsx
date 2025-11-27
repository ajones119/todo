import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'motion/react';
import { useGoals, useCompleteGoal, useDeleteGoal } from '@/api/goals';
import { Checkbox } from '@/components/ui/8bit/checkbox';
import { Button as BitButton } from '@/components/ui/8bit/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/8bit/drawer';
import { ScrollArea } from '@/components/ui/8bit/scroll-area';
import { HouseLoader } from '@/components/ui/8bit/house-loader';
import { GoalForm, type GoalType } from './GoalForm';
import { QuestBoard } from './QuestBoard';
import { Plus, Trash2, Edit, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useThemeLabels } from '@/hooks/useThemeLabels';
import { getSingularLabel } from '@/lib/theme-labels';
import { getIconForCategory } from '@/lib/category-stats';

type GoalResponse = GoalType & {
  id: string;
};

type GoalListProps = {};

const SwipeableGoalItem = ({ 
  goal, 
  onToggleComplete, 
  onTaskClick, 
  onDelete 
}: {
  goal: GoalResponse;
  onToggleComplete: (id: string, completed: boolean) => void;
  onTaskClick?: (goal: GoalType) => void;
  onDelete: (id: string) => void;
}) => {
  const x = useMotionValue(0);
  // iOS-like thresholds: use percentage of action width (140px) for better touch feel
  const ACTION_WIDTH = 140;
  const EDIT_THRESHOLD = ACTION_WIDTH * 0.3; // 30% of action width
  const DELETE_THRESHOLD = -ACTION_WIDTH * 0.3;
  const EDIT_CONFIRM_THRESHOLD = ACTION_WIDTH * 0.6; // 60% for immediate action
  const DELETE_CONFIRM_THRESHOLD = -ACTION_WIDTH * 0.6;
  const VELOCITY_THRESHOLD = 500; // Minimum velocity (px/s) to trigger action even if threshold not met
  
  const editOpacity = useTransform(x, [0, EDIT_THRESHOLD], [0, 1]);
  const deleteOpacity = useTransform(x, [EDIT_THRESHOLD, 0, DELETE_THRESHOLD], [0, 0, 1]);
  const isCompleted = !!goal.completedAt;

  return (
    <motion.li 
      className="relative"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
    >
      {/* Background action buttons - absolutely positioned */}
      <div className="absolute inset-0 flex">
        <motion.div style={{ opacity: editOpacity }} className="w-dvw flex items-center justify-start text-primary-foreground bg-primary pl-4">
          <BitButton variant="ghost" size="sm" onClick={() => onTaskClick?.(goal as GoalType)}>
            <Edit className="h-4 w-4" />
          </BitButton>
        </motion.div>
        <div className="flex-1" />
        <motion.div style={{ opacity: deleteOpacity }} className="w-dvw flex items-center justify-end text-destructive-foreground bg-destructive pr-4">
          <BitButton variant="ghost" size="sm" onClick={() => onDelete(goal.id)}>
            <Trash2 className="h-4 w-4" />
          </BitButton>
        </motion.div>
      </div>

      {/* Swipeable content - absolutely positioned and offset */}
      <motion.div
        className="absolute inset-0 touch-none"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
        dragElastic={0.05} // Much tighter elastic for better control on touch
        dragTransition={{ 
          bounceStiffness: 300, 
          bounceDamping: 30,
          power: 0.3 // Lower power for smoother deceleration
        }}
        onDragEnd={(_e, info) => {
          const currentX = info.offset.x;
          const velocity = info.velocity.x;
          
          // Velocity-based decision: fast swipe can trigger action even if threshold not fully met
          const fastSwipeRight = velocity > VELOCITY_THRESHOLD;
          const fastSwipeLeft = velocity < -VELOCITY_THRESHOLD;
          
          // Determine target position based on position and velocity
          if (currentX >= EDIT_CONFIRM_THRESHOLD || (currentX >= EDIT_THRESHOLD && fastSwipeRight)) {
            // Trigger edit action
            onTaskClick?.(goal as GoalType);
            animate(x, 0, { 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            });
          } else if (currentX <= DELETE_CONFIRM_THRESHOLD || (currentX <= DELETE_THRESHOLD && fastSwipeLeft)) {
            // Trigger delete action
            onDelete(goal.id);
            animate(x, 0, { 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            });
          } else if (currentX >= EDIT_THRESHOLD) {
            // Snap to edit position
            animate(x, ACTION_WIDTH, { 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            });
          } else if (currentX <= DELETE_THRESHOLD) {
            // Snap to delete position
            animate(x, -ACTION_WIDTH, { 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            });
          } else {
            // Snap back to center with smooth spring animation
            animate(x, 0, { 
              type: "spring", 
              stiffness: 400, 
              damping: 35 
            });
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
              checked={!!goal.completedAt}
              onCheckedChange={(checked) => {
                onToggleComplete(goal.id, checked === true);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5">
              {goal.category && (() => {
                const Icon = getIconForCategory(goal.category);
                return <Icon className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />;
              })()}
              <span className="font-regular text-xs flex-1 wrap-break-word min-w-0 line-clamp-2">{goal.name}</span>
            </div>
            {goal.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          </motion.div>
        </motion.div>

      {/* Spacer to maintain height in document flow */}
      <div className="flex items-start gap-4 p-2 pointer-events-none invisible">
        <Checkbox checked={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <span className="font-regular text-xs flex-1 wrap-break-word">{goal.name}</span>
          </div>
          {goal.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
};

export const GoalList = ({}: GoalListProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const { data: goals, isLoading, error } = useGoals();
  const completeGoalMutation = useCompleteGoal();
  const deleteGoalMutation = useDeleteGoal();
  const labels = useThemeLabels();

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 640px)').matches);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleTaskClick = (goal: GoalType) => {
    setEditingGoal(goal);
    setDrawerOpen(true);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await completeGoalMutation.mutateAsync({ id, completed });
  };

  // Sort goals by createdAt (newest first), then alphabetically
  const sortedGoals = goals
    ? [...goals].sort((a, b) => {
        // First sort by createdAt (newest first)
        // Items without createdAt go to the bottom
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
        if (bDate !== aDate) {
          return bDate - aDate; // Descending (newest first)
        }
        // If createdAt is the same, sort alphabetically
        return (a.name || '').localeCompare(b.name || '');
      })
    : [];

  if (error) {
    return (
      <>
        <QuestBoard />
        <div>
          <div className="flex justify-between items-center flex-wrap gap-2 mb-4 mt-6">
            <h2 className="text-xl retro inline-flex items-center gap-2">
              <Target className="h-5 w-5" />
              <span>{labels.goals}</span>
            </h2>
            <Drawer 
              open={drawerOpen} 
              onOpenChange={(open) => {
                setDrawerOpen(open);
                if (!open) {
                  setEditingGoal(null);
                }
              }}
            >
              <DrawerTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <BitButton onClick={() => setEditingGoal(null)}><Plus className="h-4 w-4" /></BitButton>
                </motion.div>
              </DrawerTrigger>
              <DrawerContent 
                side={isDesktop ? "right" : "bottom"}
                className={isDesktop ? "w-full sm:max-w-lg" : "w-full"}
              >
                <DrawerHeader className="shrink-0">
                  <DrawerTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="pl-6 pr-4 pb-4">
                    <GoalForm
                      initialData={editingGoal || undefined}
                      onSubmit={() => {
                        setDrawerOpen(false);
                        setEditingGoal(null);
                      }}
                    />
                  </div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          </div>
          <p className="text-red-500">Error loading goals: {error.message}</p>
        </div>
      </>
    );
  }


  return (
    <>
      <QuestBoard />
      <div>
        <div className="flex justify-between items-center flex-wrap gap-2 mb-4 mt-6">
          <h2 className="text-xl retro inline-flex items-center gap-2">
            <Target className="h-5 w-5" />
            <span>{labels.goals}</span>
          </h2>
          <Drawer 
            open={drawerOpen} 
            onOpenChange={(open) => {
              setDrawerOpen(open);
              if (!open) {
                setEditingGoal(null);
              }
            }}
          >
            <DrawerTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <BitButton onClick={() => setEditingGoal(null)}><Plus className="h-4 w-4" /></BitButton>
              </motion.div>
            </DrawerTrigger>
            <DrawerContent 
              side={isDesktop ? "right" : "bottom"}
              className={isDesktop ? "w-full sm:max-w-lg" : "w-full"}
            >
              <DrawerHeader className="shrink-0">
                <DrawerTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DrawerTitle>
              </DrawerHeader>
              <ScrollArea className="flex-1 min-h-0">
                <div className="pl-6 pr-4 pb-4">
                  <GoalForm
                    initialData={editingGoal || undefined}
                    onSubmit={() => {
                      setDrawerOpen(false);
                      setEditingGoal(null);
                    }}
                  />
                </div>
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </div>
        {isLoading && <div className="flex justify-center items-center h-full mt-20"><HouseLoader size="lg" /></div>}
        {!isLoading && sortedGoals.length > 0 && (
        <motion.ul 
          className="space-y-2 relative p-4"
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
            {sortedGoals.map((goal) => (
            <SwipeableGoalItem
              key={goal.id}
              goal={goal}
              onToggleComplete={handleToggleComplete}
              onTaskClick={handleTaskClick}
              onDelete={(id) => {
                if (confirm('Are you sure you want to delete this goal?')) {
                  deleteGoalMutation.mutate(id, {
                    onSuccess: () => {
                      toast.success('Goal deleted');
                    },
                    onError: () => {
                      toast.error('Failed to delete goal');
                    },
                  });
                }
              }}
            />
            ))}
          </AnimatePresence>
        </motion.ul>
        )}
        {!isLoading && sortedGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border rounded-lg bg-muted/10">
            <Target className="h-12 w-12 text-muted-foreground opacity-50" />
            <h2 className="text-lg retro">No {labels.goals} Yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {labels.goals} are one-time objectives or major milestones. Set a {labels.goals.slice(0, -1).toLowerCase()} to track your progress!
            </p>
            <Drawer 
              open={drawerOpen} 
              onOpenChange={(open) => {
                setDrawerOpen(open);
                if (!open) {
                  setEditingGoal(null);
                }
              }}
            >
              <DrawerTrigger asChild>
                <BitButton onClick={() => setEditingGoal(null)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create {getSingularLabel(labels.goals)}
                </BitButton>
              </DrawerTrigger>
              <DrawerContent 
                side={isDesktop ? "right" : "bottom"}
                className={isDesktop ? "w-full sm:max-w-lg" : "w-full"}
              >
                <DrawerHeader className="shrink-0">
                  <DrawerTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="pl-6 pr-4 pb-4">
                    <GoalForm
                      initialData={editingGoal || undefined}
                      onSubmit={() => {
                        setDrawerOpen(false);
                        setEditingGoal(null);
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

