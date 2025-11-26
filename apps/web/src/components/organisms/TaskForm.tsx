import React, { useEffect, useState } from 'react'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { Input as BitInput } from '@/components/ui/8bit/input'
import { Label as BitLabel } from '@/components/ui/8bit/label'
import { CategorySelect } from '@/components/ui/8bit/category-select'
import { RRuleInput } from './RRuleInput'
import { useCreateTask, useUpdateTask, type NewTask } from '@/api/tasks'
import { toast } from 'sonner'

import type { TaskTemplate } from '@todo/types'

// Re-export for backward compatibility
export type Task = Omit<TaskTemplate, 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
    id?: string
    category?: string
}
const createEmptyTask = (): NewTask => {
    // Create default rrule with dtstart
    const defaultDate = new Date()
    const dtstart = defaultDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    return {
        title: '',
        category: '',
        rrule: [`FREQ=DAILY;INTERVAL=1;DTSTART=${dtstart}`],
        weight: 3,

    }
}

type TaskFormProps = {
    initialData?: Task
    onSubmit?: (task: NewTask) => void
}

export const TaskForm = (props: TaskFormProps = {}) => {
    const { initialData, onSubmit } = props
    // Use lazy initialization to set initial state from initialData if provided
    const [task, setTask] = useState<NewTask>(() => initialData || createEmptyTask())
    
    // TanStack Query mutations
    const createTaskMutation = useCreateTask()
    const updateTaskMutation = useUpdateTask()
    
    const isEditMode = !!initialData?.id

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            setTask(initialData)
        } else {
            // Reset to empty task if initialData becomes undefined
            setTask(createEmptyTask())
        }
    }, [initialData])

    const updateTask = <K extends keyof NewTask>(field: K, value: NewTask[K]) => {
        setTask(prev => ({ ...prev, [field]: value }))
    }

    const getDefaultRRule = (): string => {
        const defaultDate = new Date()
        const dtstart = defaultDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        return `FREQ=DAILY;INTERVAL=1;COUNT=1;DTSTART=${dtstart}`
    }
    
    const currentRRule = task.rrule.length > 0 
        ? task.rrule[task.rrule.length - 1] 
        : getDefaultRRule()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('Submitting task:', task)
        
        try {
            if (isEditMode && initialData?.id) {
                // Update existing task
                // For edit mode, spread the initial rrule array and append the new one from current state
                // Only append if it's different from the last one in initialData
                const currentRRule = task.rrule.length > 0 ? task.rrule[task.rrule.length - 1] : ''
                const initialRRules = initialData.rrule || []
                const lastInitialRRule = initialRRules.length > 0 ? initialRRules[initialRRules.length - 1] : ''
                
                // Only append if the current rrule is different from the last one in initial data
                let updatedRRules: string[]
                if (currentRRule && currentRRule !== lastInitialRRule) {
                    updatedRRules = [...initialRRules, currentRRule]
                } else {
                    // No change to rrule, keep the initial array
                    updatedRRules = initialRRules
                }

                console.log('Updated rrules:', updatedRRules)
                
                const result = await updateTaskMutation.mutateAsync({
                    id: initialData.id,
                    task: {
                        title: task.title,
                        category: task.category,
                        rrule: updatedRRules, // Send complete array with appended new rrule (only if changed)
                        weight: task.weight,
                    },
                })
                console.log('Task updated successfully:', result)
                toast.success('Task updated successfully!')
            } else {
                // Create new task
                const result = await createTaskMutation.mutateAsync(task)
                console.log('Task created successfully:', result)
                toast.success('Task created successfully!')
                // Reset form for new tasks
                setTask(createEmptyTask())
            }
            
            // Call the onSubmit callback if provided
            onSubmit?.(task)
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error)
            const errorMessage = error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} task`
            toast.error(errorMessage)
        }
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="space-y-2">
                <div className="w-full">
                    <BitLabel htmlFor="title">Title</BitLabel>
                    <BitInput 
                        id="title" 
                        name="title" 
                        type="text" 
                        minLength={3} 
                        maxLength={100} 
                        required 
                        value={task.title}
                        onChange={(e) => updateTask('title', e.target.value)}
                    />
                </div>
                <CategorySelect
                    id="category"
                    value={task.category || ''}
                    onChange={(value) => updateTask('category', value)}
                    required
                />
                <RRuleInput 
                    value={currentRRule || getDefaultRRule()} 
                    onChange={(value) => {
                        const newRRules = task.rrule.length > 0
                            ? [...task.rrule.slice(0, -1), value]
                            : [value]
                        updateTask('rrule', newRRules)
                    }} 
                    name="rrule" 
                    id="rrule" 
                />
            </div>
            <div className="pt-4">
                <BitButton 
                    type="submit" 
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                >
                    {(createTaskMutation.isPending || updateTaskMutation.isPending) 
                        ? (isEditMode ? 'Updating...' : 'Creating...') 
                        : (isEditMode ? 'Update Task' : 'Create Task')}
                </BitButton>
            </div>
        </form>
    )
}