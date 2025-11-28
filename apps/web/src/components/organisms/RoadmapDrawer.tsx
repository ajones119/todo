import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/8bit/drawer';
import { ScrollArea } from '@/components/ui/8bit/scroll-area';
import { Map, Package, Sparkles, BookOpen } from 'lucide-react';

type RoadmapDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  icon: React.ReactNode;
};

const roadmapItems: RoadmapItem[] = [
  {
    id: 'inventory',
    title: 'Inventory System',
    description: 'A comprehensive inventory system where players can collect and manage items earned through completing tasks, habits, and goals. Items can provide temporary or permanent bonuses to stats.',
    status: 'planned',
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: 'permanent-bonuses',
    title: 'Permanent Bonuses',
    description: 'Permanent stat bonuses that persist across weeks. These can be earned through achievements, level milestones, or special events. Bonuses will enhance your character\'s effectiveness in the village.',
    status: 'planned',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'daily-stories',
    title: 'Daily Stories',
    description: 'Personalized daily narrative stories that reflect your character\'s progress, choices, and the impact of your completed tasks. Each day brings new adventures and challenges in Pinegate Village.',
    status: 'planned',
    icon: <BookOpen className="h-5 w-5" />,
  },
];

const statusColors = {
  planned: 'text-muted-foreground border-muted',
  'in-progress': 'text-blue-500 border-blue-500',
  completed: 'text-green-500 border-green-500',
};

const statusLabels = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

export const RoadmapDrawer = ({ open, onOpenChange }: RoadmapDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="bottom" className="max-h-[90dvh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            App Roadmap
          </DrawerTitle>
          <DrawerDescription>
            Upcoming features and improvements coming to Pinegate Village.
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-6">
            {roadmapItems.map((item) => (
              <div
                key={item.id}
                className={`border-2 rounded-none p-4 space-y-2 ${statusColors[item.status]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold retro">{item.title}</h3>
                      <span className={`text-xs px-2 py-1 border ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

