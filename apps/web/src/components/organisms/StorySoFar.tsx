import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/root'
import { Card } from '@/components/ui/8bit/card'
import { formatUtcDate } from '@/lib/date-utils'

interface WeeklySummary {
  id: string
  summary: string | null
  nextWeekPrompt: string | null
  agentNotes: string | null
  createdAt: string
}

export function StorySoFar() {
  const { data: summary, isLoading, error } = useQuery<WeeklySummary | null>({
    queryKey: ['weekly-summary-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('To_do_Weekly_Summary')
        .select('id, summary, nextWeekPrompt, agentNotes, createdAt')
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching weekly summary:', error)
        throw error
      }

      return data
    },
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-sm text-red-500">Error loading story</p>
      </Card>
    )
  }

  if (!summary || !summary.summary) {
    return (
      <Card className="p-4">
        <h2 className="text-lg retro mb-2">Story So Far</h2>
        <p className="text-sm text-muted-foreground">No story available yet. Complete some tasks to generate the first chapter!</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg retro">Story So Far</h2>
        {summary.createdAt && (
          <span className="text-xs text-muted-foreground">
            {formatUtcDate(summary.createdAt)}
          </span>
        )}
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {summary.summary}
      </div>
      {summary.nextWeekPrompt && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-semibold mb-1">Next Week:</p>
          <p className="text-xs text-muted-foreground">{summary.nextWeekPrompt}</p>
        </div>
      )}
    </Card>
  )
}

