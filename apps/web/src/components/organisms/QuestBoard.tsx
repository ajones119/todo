import { useQuestBoard } from '@/api/quest-board'
import { useCreateGoal } from '@/api/goals'
import { Card } from '@/components/ui/8bit/card'
import { formatCategoryName } from '@/lib/category-stats'
import { PlusIcon, Sparkles, User } from 'lucide-react'

const formatWeight = (weight: number | undefined): string => {
  if (!weight) return '';
  const weightMap: Record<number, string> = {
    1: 'Trivial',
    2: 'Easy',
    3: 'Moderate',
    4: 'Hard',
    5: 'Extreme',
  };
  return weightMap[weight] || weight.toString();
};

export const QuestBoard = () => {
  const { data: quests, isLoading, error } = useQuestBoard()
  const createGoalMutation = useCreateGoal()

  const handleAcceptQuest = async (questId: string, name: string, category?: string, weight?: number) => {
    try {
      await createGoalMutation.mutateAsync({
        name,
        category,
        weight,
        questBoardTemplateId: questId,
      } as any) // Type assertion needed since questBoardTemplateId isn't in the schema yet
    } catch (error) {
      console.error('Error accepting quest:', error)
    }
  }

  const cardHeight = 'h-[280px]'; // Fixed height for all states

  return (
    <Card className={`p-2 border-2 border-foreground dark:border-ring w-full max-w-full ${cardHeight} flex flex-col gap-0`}>
      <h3 className="text-sm font-bold retro flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4" />
        Quest Board
      </h3>
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Loading quests...</p>
        </div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-red-500">Error loading quests</p>
        </div>
      )}
      {!isLoading && !error && (!quests || quests.length === 0) && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No quests available</p>
        </div>
      )}
      {!isLoading && !error && quests && quests.length > 0 && (
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full w-full relative py-2 overflow-y-auto overflow-x-hidden">
            <div className="w-full min-w-0">
              {quests.map((quest, index) => (
                <div
                  key={quest.id}
                  className={`p-1 bg-muted/20 hover:bg-muted/40 transition-colors grid grid-cols-[1fr_24px] gap-2 min-w-0 ${
                    index < quests.length - 1 ? 'border-b-2 border-foreground dark:border-ring' : ''
                  }`}
                >
                  <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold retro">{quest.name}</p>
                      {quest.userId && (
                        <User className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 text-xs">
                      {quest.category && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatCategoryName(quest.category)}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        : {formatWeight(quest.weight)}
                      </span>
                      {quest.daysToComplete && (
                        <span className="text-[10px] text-muted-foreground">
                          {' '}({quest.daysToComplete} days)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptQuest(quest.id, quest.name, quest.category, quest.weight)}
                    disabled={createGoalMutation.isPending}
                    className="shrink-0 bg-transparent text-foreground rounded-full size-6 flex items-center justify-center cursor-pointer"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

