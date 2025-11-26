import { createFileRoute } from '@tanstack/react-router'
import { GoalList } from '@/components/organisms/GoalList'

export const Route = createFileRoute('/_authenticated/quests')({
  component: QuestsPage,
})

function QuestsPage() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Quests</h1>
      <GoalList />
    </div>
  )
}
