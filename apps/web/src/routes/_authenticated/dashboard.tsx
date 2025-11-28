import { createFileRoute } from '@tanstack/react-router'
import { WeeklyStats } from '@/components/organisms/WeeklyStats'
import { StorySoFar } from '@/components/organisms/StorySoFar'
import { DailyStory } from '@/components/organisms/DailyStory'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="space-y-6 h-full">
      <h1 className="sr-only">Dashboard</h1>
      <WeeklyStats />
      <DailyStory />
      <StorySoFar />
      
    </div>
  )
}
