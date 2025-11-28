import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/root'
import { Card } from '@/components/ui/8bit/card'
import { formatUtcDate } from '@/lib/date-utils'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface DailyStory {
  id: string
  agentNotes: string | null
  createdAt: string
}

export function DailyStory() {
  const [offset, setOffset] = useState(0)

  const { data: dailyStory, isLoading, error } = useQuery<DailyStory | null>({
    queryKey: ['daily-story', offset],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('To_do_Character_Daily_Summary')
        .select('id, agentNotes, createdAt')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .range(offset, offset)
        .maybeSingle()

      if (error) {
        console.error('Error fetching daily story:', error)
        throw error
      }

      return data
    },
  })

  // Check if there are more stories (next)
  /*const { data: hasNext } = useQuery<boolean>({
    queryKey: ['daily-story-has-next', offset],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return false
      }

      const { data, error } = await supabase
        .from('To_do_Character_Daily_Summary')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .range(offset + 1, offset + 1)
        .maybeSingle()

      if (error) {
        return false
      }

      return !!data
    },
  })*/

  const handlePrevious = () => {
    if (offset > 0) {
      setOffset(offset - 1)
    }
  }

  const handleNext = () => {
    if (true) {
      setOffset(offset + 1)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Today's Adventure</h2>
        <p className="text-2xs text-muted-foreground">Loading...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Today's Adventure</h2>
        <p className="text-2xs text-red-500">Error loading daily story</p>
      </Card>
    )
  }

  if (!dailyStory || !dailyStory.agentNotes) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Today's Adventure</h2>
        <p className="text-2xs text-muted-foreground">No daily adventure available yet. Complete some tasks to generate your first adventure!</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 text-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg retro">Today's Adventure</h2>
        <div className="flex items-center gap-2 relative z-10">
          <BitButton
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="h-8 w-8 p-0 relative z-10"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </BitButton>
          {dailyStory.createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatUtcDate(dailyStory.createdAt)}
            </span>
          )}
          <BitButton
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="h-8 w-8 p-0 relative z-10"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </BitButton>
        </div>
      </div>
      <div className="text-2xs whitespace-pre-wrap leading-relaxed">
        {dailyStory.agentNotes}
      </div>
    </Card>
  )
}

