import { createFileRoute } from '@tanstack/react-router'
import { HabitList } from '@/components/organisms/HabitList'

export const Route = createFileRoute('/_authenticated/habits')({
  component: HabitsPage,
})

function HabitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Habits</h1>
      <HabitList />
    </div>
  )
}
