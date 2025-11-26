import { useAuthStore } from '@/store/auth'
import { User } from 'lucide-react'
import { UserInfo } from './UserInfo'
import { WeeklyStats } from './WeeklyStats'

export const HeroData = () => {
  return (
    <div className="border-4 border-foreground dark:border-ring p-4 space-y-4">
      <UserInfo />
      <WeeklyStats />
    </div>
  )
}

