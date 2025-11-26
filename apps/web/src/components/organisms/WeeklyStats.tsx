import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/root'
import { startOfWeek, startOfDay } from 'date-fns'
import { useWeeklyStats, useUserCharacter } from '@/api/stats'
import { getStatForCategory, statToIcon, statDisplayName, type StatType } from '@/lib/category-stats'
import { useMemo } from 'react'

// Fetch weekly completed tasks count
const fetchWeeklyCompletedCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  // Get the start of the week (previous Sunday at midnight)
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // 0 = Sunday
  const weekStartUTC = new Date(Date.UTC(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth(),
    weekStart.getUTCDate(),
    0, 0, 0, 0
  ))

  // Get today at end of day UTC
  const todayEnd = startOfDay(today)
  todayEnd.setUTCHours(23, 59, 59, 999)
  const todayEndUTC = new Date(Date.UTC(
    todayEnd.getUTCFullYear(),
    todayEnd.getUTCMonth(),
    todayEnd.getUTCDate(),
    23, 59, 59, 999
  ))

  // Fetch completions for the week
  const { data: completions, error } = await supabase
    .from('Task_Complete')
    .select('id', { count: 'exact' })
    .eq('userId', user.id)
    .eq('complete', true)
    .gte('completedAt', weekStartUTC.toISOString())
    .lte('completedAt', todayEndUTC.toISOString())

  if (error) {
    console.error('Error fetching weekly completions:', error)
    return 0
  }

  return completions?.length || 0
}

export const WeeklyStats = () => {
  // Fetch weekly completed count
  const { data: weeklyCompleted = 0 } = useQuery({
    queryKey: ['weeklyCompletedCount'],
    queryFn: fetchWeeklyCompletedCount,
  })

  // Fetch user character data (for level)
  const { data: userCharacter } = useUserCharacter()

  // Fetch weekly stats
  const { data: stats } = useWeeklyStats()

  // Aggregate stats by RPG attribute
  const aggregatedStats = useMemo(() => {
    if (!stats) return {} as Record<StatType, number>
    
    const agg = {} as Record<StatType, number>
    
    Object.entries(stats).forEach(([category, points]) => {
      const statType = getStatForCategory(category)
      agg[statType] = (agg[statType] || 0) + points
    })
    
    return agg
  }, [stats])

  // Get sorted stats (highest first)
  const sortedStats = useMemo(() => {
    return (Object.entries(aggregatedStats) as [StatType, number][])
      .sort(([, a], [, b]) => b - a)
  }, [aggregatedStats])

  return (
    <div className="space-y-4">
      {/* Stats section */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="border-2 border-foreground dark:border-ring p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold retro">{weeklyCompleted}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">This Week</div>
        </div>
        <div className="border-2 border-foreground dark:border-ring p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold retro">{userCharacter?.level || 1}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Level</div>
        </div>
        <div className="border-2 border-foreground dark:border-ring p-2 sm:p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold retro">0</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Streak</div>
        </div>
      </div>

      {/* RPG Stats Grid */}
      {sortedStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold retro border-b border-border pb-1">Weekly Attributes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sortedStats.map(([stat, points], index) => {
              const Icon = statToIcon[stat]
              const label = statDisplayName[stat]
              return (
                <div 
                  key={stat} 
                  style={{ 
                    '--delay': `${index * 0.1}s`,
                  } as React.CSSProperties}
                  className="border border-solid border-foreground p-2 flex items-center gap-2 bg-muted/20 animate-[fadeInUp_0.5s_ease-out_var(--delay)_both]"
                >
                  <div className="p-1.5 bg-background border border-border rounded-md shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold retro truncate">
                      {points} XP
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

