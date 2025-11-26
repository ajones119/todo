import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/8bit/drawer';
import { Button as BitButton } from '@/components/ui/8bit/button';
import { User, Sun, Repeat, Target } from 'lucide-react';

type IntroDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const IntroDrawer = ({ open, onOpenChange }: IntroDrawerProps) => {

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('pinegate-village-intro-seen', 'true');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Welcome to Pinegate Village!</DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6">
          {/* Introduction */}
          <div className="space-y-2 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">A fantasy village where your productivity shapes an ongoing narrative. Track your tasks, build your character, and watch your story unfold.</p>
            <h3 className="text-base font-bold retro">About Pinegate Village</h3>
            <p className="text-sm text-muted-foreground">
              Pinegate Village is a living, breathing fantasy world made up of all its residents—that&apos;s you and other users! 
              Every task you complete, every habit you maintain, and every quest you finish contributes to your character&apos;s 
              journey and helps build a continuous narrative that evolves week by week.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your weekly activity is calculated into totals that shape your character&apos;s story. As you progress, 
              your character can gain <strong className="text-foreground">persistent bonuses</strong> that carry forward, 
              making you stronger and unlocking new possibilities in the village.
            </p>
          </div>

          {/* Dashboard Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border-2 border-primary rounded-md">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold retro">Dashboard</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              Your character&apos;s home base! View your weekly stats, level progress, and watch your story unfold. 
              See how your completed tasks translate into XP and attribute growth. Track your weekly completions, 
              maintain your streak, and discover the persistent bonuses your character has earned.
            </p>
          </div>

          {/* Tasks Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border-2 border-primary rounded-md">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold retro">Tasks</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              Your daily tasks and one-time quests. These are the actionable items you need to complete in your real life. 
              Check them off as you finish them to earn XP and progress your character. Each completed task contributes 
              to your weekly totals, which build into your character&apos;s ongoing narrative and can unlock persistent bonuses.
            </p>
          </div>

          {/* Habits Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border-2 border-primary rounded-md">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold retro">Habits</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              Build consistency with recurring habits. These repeat on a schedule you set (daily, weekly, etc.). 
              Track your progress over time and build streaks. Consistent habits contribute significantly to your weekly 
              totals and help your character develop long-term abilities that can become persistent bonuses.
            </p>
          </div>

          {/* Quests Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border-2 border-primary rounded-md">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold retro">Quests</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              Your long-term goals and objectives. Quests are bigger projects or milestones you&apos;re working toward. 
              Break them down into smaller tasks, track your progress, and celebrate when you complete them. 
              Completing major quests often leads to significant narrative developments and powerful persistent bonuses.
            </p>
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How It Works:</strong> Every task, habit, and quest you complete 
              is tracked and calculated into weekly totals. These totals shape your character&apos;s story and can 
              unlock persistent bonuses that make your character stronger over time.
            </p>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Navigate between sections using the bottom navigation bar. 
              The more consistently you complete tasks and habits, the more your character grows and the richer your 
              narrative becomes in Pinegate Village!
            </p>
          </div>
        </div>
        
        <DrawerFooter>
          <BitButton onClick={handleClose}>
            Begin Your Journey
          </BitButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

