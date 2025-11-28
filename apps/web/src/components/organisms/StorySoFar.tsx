import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/root'
import { Card } from '@/components/ui/8bit/card'
import { formatUtcDate } from '@/lib/date-utils'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface WeeklySummary {
  id: string
  summary: string | null
  nextWeekPrompt: string | null
  agentNotes: string | null
  createdAt: string
}

export function StorySoFar() {
  const [offset, setOffset] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: summary, isLoading, error } = useQuery<WeeklySummary | null>({
    queryKey: ['weekly-summary', offset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('To_do_Weekly_Summary')
        .select('id, summary, nextWeekPrompt, agentNotes, createdAt')
        .order('createdAt', { ascending: false })
        .range(offset, offset)
        .maybeSingle()

      if (error) {
        console.error('Error fetching weekly summary:', error)
        throw error
      }

      return data
    },
  })

  // Check if there are more summaries (next)
  const { data: hasNext } = useQuery<boolean>({
    queryKey: ['weekly-summary-has-next', offset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('To_do_Weekly_Summary')
        .select('id', { count: 'exact', head: true })
        .order('createdAt', { ascending: false })
        .range(offset + 1, offset + 1)
        .maybeSingle()

      if (error) {
        return false
      }

      return !!data
    },
  })

  const handlePrevious = () => {
    if (offset > 0) {
      setOffset(offset - 1)
      setIsExpanded(false) // Reset expansion when changing stories
    }
  }

  const handleNext = () => {
    if (hasNext) {
      setOffset(offset + 1)
      setIsExpanded(false) // Reset expansion when changing stories
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-2xs text-muted-foreground">Loading...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-2xs text-red-500">Error loading story</p>
      </Card>
    )
  }

  if (!summary || !summary.summary) {
    return (
      <Card className="p-4 text-2xs">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-2xs text-muted-foreground">No story available yet. Complete some tasks to generate the first chapter!</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 text-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg retro">Story So Far</h2>
        <div className="flex items-center gap-2 relative z-10">
          <BitButton
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={offset === 0}
            className="h-8 w-8 p-0 relative z-10 pointer-events-auto"
            type="button"
          >
            <ChevronLeft className="h-4 w-4 pointer-events-none" />
          </BitButton>
          {summary.createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatUtcDate(summary.createdAt)}
            </span>
          )}
          <BitButton
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext}
            className="h-8 w-8 p-0 relative z-10 pointer-events-auto"
            type="button"
          >
            <ChevronRight className="h-4 w-4 pointer-events-none" />
          </BitButton>
        </div>
      </div>
      <div className="space-y-2">
        <div className={`text-2xs whitespace-pre-wrap leading-relaxed ${!isExpanded ? 'line-clamp-5' : ''}`}>
          {summary.summary}
        </div>
        <BitButton
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-2xs h-auto p-0"
          type="button"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </BitButton>
      </div>
      {summary.nextWeekPrompt && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-semibold mb-1">Next Week:</p>
          <p className="text-2xs text-muted-foreground">{summary.nextWeekPrompt}</p>
        </div>
      )}
    </Card>
  )
}

