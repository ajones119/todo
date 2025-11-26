import React, { useEffect, useState } from 'react'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { Input as BitInput } from '@/components/ui/8bit/input'
import { Label as BitLabel } from '@/components/ui/8bit/label'
import { Select as BitSelect } from '@/components/ui/8bit/select'
import { SelectTrigger as BitSelectTrigger } from '@/components/ui/8bit/select'
import { SelectValue as BitSelectValue } from '@/components/ui/8bit/select'
import { SelectContent as BitSelectContent } from '@/components/ui/8bit/select'
import { SelectItem as BitSelectItem } from '@/components/ui/8bit/select'
import { CategorySelect } from '@/components/ui/8bit/category-select'
import { Calendar } from '@/components/ui/8bit/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useCreateGoal, useUpdateGoal, type NewGoal } from '@/api/goals'
import { toast } from 'sonner'
import type { Goal } from '@todo/types'

export type GoalType = Omit<Goal, 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  id?: string
}

const createEmptyGoal = (): NewGoal => {
  return {
    name: '',
    category: '',
    dueDate: null,
    rewarded: false,
    weight: 3,
    completedAt: null,
    fromTemplate: false,
  }
}

type GoalFormProps = {
  initialData?: GoalType
  onSubmit?: (goal: NewGoal) => void
}

export const GoalForm = (props: GoalFormProps = {}) => {
  const { initialData, onSubmit } = props
  const [goal, setGoal] = useState<NewGoal>(() => initialData || createEmptyGoal())

  const createGoalMutation = useCreateGoal()
  const updateGoalMutation = useUpdateGoal()

  const isEditMode = !!initialData?.id

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setGoal({
        fromTemplate: initialData.fromTemplate || false,
        name: initialData.name || '',
        category: initialData.category || '',
        dueDate: initialData.dueDate || null,
        rewarded: initialData.rewarded || false,
        weight: initialData.weight || 3,
        completedAt: initialData.completedAt || null,
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!goal.name || goal.name.trim() === '') {
      toast.error('Goal name is required')
      return
    }

    try {
      if (isEditMode && initialData?.id) {
        await updateGoalMutation.mutateAsync({
          id: initialData.id,
          goal: {
            name: goal.name,
            category: goal.category,
            dueDate: goal.dueDate,
            rewarded: goal.rewarded,
            weight: goal.weight,
          },
        })
      } else {
        await createGoalMutation.mutateAsync(goal)
      }

      onSubmit?.(goal)
    } catch (error) {
      console.error('Error saving goal:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <BitLabel htmlFor="name">Goal Name</BitLabel>
        <BitInput
          id="name"
          value={goal.name}
          onChange={(e) => setGoal({ ...goal, name: e.target.value })}
          placeholder="e.g., Learn Spanish, Run Marathon, Write Book"
          required
        />
      </div>

      <CategorySelect
        id="category"
        value={goal.category || ''}
        onChange={(value) => setGoal({ ...goal, category: value })}
      />

      <div className="space-y-2">
        <BitLabel htmlFor="dueDate">Due Date (Optional)</BitLabel>
        <Popover>
          <PopoverTrigger asChild>
            <BitButton
              variant="outline"
              className="w-full justify-start text-left font-normal"
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {goal.dueDate ? format(new Date(goal.dueDate), 'PPP') : 'Pick a date'}
            </BitButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={goal.dueDate ? (() => {
                // Parse the UTC date and convert to local date for display
                const utcDate = new Date(goal.dueDate);
                // Create a local date with the same year, month, day
                return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
              })() : undefined}
              onSelect={(date) => {
                if (date) {
                  // Use local date components to create UTC date at midnight
                  // This preserves the calendar date the user selected
                  const selectedDate = new Date(Date.UTC(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    0, 0, 0, 0
                  ));
                  setGoal({ ...goal, dueDate: selectedDate.toISOString() });
                } else {
                  setGoal({ ...goal, dueDate: null });
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <BitLabel htmlFor="weight">Weight</BitLabel>
        <BitSelect
          value={goal.weight?.toString() || '3'}
          onValueChange={(value) => setGoal({ ...goal, weight: parseInt(value) })}
        >
          <BitSelectTrigger id="weight">
            <BitSelectValue />
          </BitSelectTrigger>
          <BitSelectContent>
            <BitSelectItem value="1">1 - Low</BitSelectItem>
            <BitSelectItem value="2">2 - Medium-Low</BitSelectItem>
            <BitSelectItem value="3">3 - Medium</BitSelectItem>
            <BitSelectItem value="4">4 - Medium-High</BitSelectItem>
            <BitSelectItem value="5">5 - High</BitSelectItem>
          </BitSelectContent>
        </BitSelect>
      </div>

      <div className="flex gap-2 pt-4">
        <BitButton type="submit" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
          {isEditMode ? 'Update Goal' : 'Create Goal'}
        </BitButton>
      </div>
    </form>
  )
}

