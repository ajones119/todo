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
import { useCreateHabit, useUpdateHabit, type NewHabit } from '@/api/habits'
import { toast } from 'sonner'
import type { HabitTemplate } from '@todo/types'

export type Habit = Omit<HabitTemplate, 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  id?: string
}

const createEmptyHabit = (): NewHabit => {
  return {
    name: '',
    category: '',
    weight: 3,
  }
}

type HabitFormProps = {
  initialData?: Habit
  onSubmit?: (habit: NewHabit) => void
}

export const HabitForm = (props: HabitFormProps = {}) => {
  const { initialData, onSubmit } = props
  const [habit, setHabit] = useState<NewHabit>(() => initialData || createEmptyHabit())

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()

  const isEditMode = !!initialData?.id

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setHabit({
        name: initialData.name || '',
        category: initialData.category || '',
        weight: initialData.weight || 3,
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!habit.name || habit.name.trim() === '') {
      toast.error('Habit name is required')
      return
    }

    try {
      if (isEditMode && initialData?.id) {
        await updateHabitMutation.mutateAsync({
          id: initialData.id,
          habit: {
            name: habit.name,
            category: habit.category,
            weight: habit.weight,
          },
        })
      } else {
        await createHabitMutation.mutateAsync(habit)
      }

      onSubmit?.(habit)
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <BitLabel htmlFor="name">Habit Name</BitLabel>
        <BitInput
          id="name"
          value={habit.name}
          onChange={(e) => setHabit({ ...habit, name: e.target.value })}
          placeholder="e.g., Exercise, Read, Meditate"
          required
        />
      </div>

      <CategorySelect
        id="category"
        value={habit.category || ''}
        onChange={(value) => setHabit({ ...habit, category: value })}
      />

      <div className="space-y-2">
        <BitLabel htmlFor="weight">Weight</BitLabel>
        <BitSelect
          value={habit.weight?.toString() || '3'}
          onValueChange={(value) => setHabit({ ...habit, weight: parseInt(value) })}
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
        <BitButton type="submit" disabled={createHabitMutation.isPending || updateHabitMutation.isPending}>
          {isEditMode ? 'Update Habit' : 'Create Habit'}
        </BitButton>
      </div>
    </form>
  )
}

