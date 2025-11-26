import { createFileRoute } from '@tanstack/react-router'
import { TaskList } from '@/components/organisms/TaskList'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
})

function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">Tasks</h1>
      <TaskList />
    </div>
  )
}
