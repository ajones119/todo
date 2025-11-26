import { createFileRoute } from '@tanstack/react-router'
import { WeeklyStats } from '@/components/organisms/WeeklyStats'
import { StorySoFar } from '@/components/organisms/StorySoFar'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="space-y-6 h-full">
      <h1 className="sr-only">Dashboard</h1>
      <WeeklyStats />
      <StorySoFar />
      
    </div>
  )
}
