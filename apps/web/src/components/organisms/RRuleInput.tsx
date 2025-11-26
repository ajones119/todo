import { Activity, useEffect, useState } from 'react'
import { RRule, Weekday, type Options } from 'rrule'
import { format } from 'date-fns'
import { Label as BitLabel } from '@/components/ui/8bit/label'
import { Select as BitSelect } from '@/components/ui/8bit/select'
import { SelectTrigger as BitSelectTrigger } from '@/components/ui/8bit/select'
import { SelectValue as BitSelectValue } from '@/components/ui/8bit/select'
import { SelectContent as BitSelectContent } from '@/components/ui/8bit/select'
import { SelectItem as BitSelectItem } from '@/components/ui/8bit/select'
import { Button as BitButton } from '@/components/ui/8bit/button'
import { Calendar } from '@/components/ui/8bit/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/8bit/popover'

type RRuleInputProps = {
    value: string
    onChange: (value: string) => void
    name?: string
    id?: string
}

type REPEAT_PATTERN = 'DAILY' | 'WEEKLY' | 'MONTHLY'


const freqMap: Record<REPEAT_PATTERN, number> = {
    'DAILY': RRule.DAILY,
    'WEEKLY': RRule.WEEKLY,
    'MONTHLY': RRule.MONTHLY,
}

// Create default RRule with dtstart always set
const createDefaultRRule = (): RRule => {
    return new RRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: new Date(),
        tzid: 'UTC',
        count: 1, // Default to single task
    })
}

const defaultRRule: RRule = createDefaultRRule()

export const RRuleInput = ({ value = defaultRRule.toString(), onChange = () => {}, name, id }: RRuleInputProps) => {
    // Helper to get safe value - strips trailing semicolons which cause parsing errors
    const getSafeValue = (val: string | undefined): string => {
        if (val && typeof val === 'string' && val.trim()) {
            // Remove trailing semicolons and whitespace
            const cleaned = val.trim().replace(/;+$/, '')
            // If the cleaned value doesn't have DTSTART, add it
            if (!cleaned.includes('DTSTART')) {
                const defaultDate = new Date()
                const dtstart = defaultDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                return cleaned ? `${cleaned};DTSTART=${dtstart}` : createDefaultRRule().toString()
            }
            return cleaned
        }
        return createDefaultRRule().toString()
    }

    const [rrule, setRrule] = useState<RRule>(() => {
        const safeValue = getSafeValue(value)
        try {
            return RRule.fromString(safeValue)
        } catch {
            return defaultRRule
        }
    })

    useEffect(() => {
        const safeValue = getSafeValue(value)
        try {
            const newRRule = RRule.fromString(safeValue)
            setRrule(newRRule)
        } catch (error) {
            console.warn('Failed to parse RRule:', safeValue, error)
            setRrule(defaultRRule)
        }
    }, [value])

    // Calculate rrule string on render - always in sync with rrule state
    const rruleString = rrule.toString()
    
    // Determine if recurring (no COUNT=1 means recurring)
    const isRecurring = !rruleString.includes('COUNT=1')
    
    // Get the start date from rrule options
    const startDate = rrule.options.dtstart || new Date()
    
    // State to control calendar popover open/close
    const [calendarOpen, setCalendarOpen] = useState(false)
    
    // Toggle between single and recurring
    const handleToggleRecurring = () => {
        setRrule((prev) => {
            const currentString = prev.toString()
            const isCurrentlyRecurring = !currentString.includes('COUNT=1')
            
            let newRRule: RRule
            if (isCurrentlyRecurring) {
                // Switch to single: reset to default single task (DAILY, INTERVAL=1, COUNT=1)
                // Keep the dtstart date
                newRRule = new RRule({
                    freq: RRule.DAILY,
                    interval: 1,
                    dtstart: prev.options.dtstart || new Date(),
                    tzid: prev.options.tzid || 'UTC',
                    count: 1,
                })
            } else {
                // Switch to recurring: reset to default recurring (DAILY, INTERVAL=1, no COUNT)
                // Keep the dtstart date
                newRRule = new RRule({
                    freq: RRule.DAILY,
                    interval: 1,
                    dtstart: prev.options.dtstart || new Date(),
                    tzid: prev.options.tzid || 'UTC',
                })
            }
            const newString = newRRule.toString()
            onChange(newString)
            return newRRule
        })
    }
    
    // Handle date change
    const handleDateChange = (date: Date | undefined) => {
        if (!date) return
        setRrule((prev) => {
            const prevOptions = prev.origOptions || {
                freq: prev.options.freq,
                interval: prev.options.interval,
                dtstart: prev.options.dtstart,
                tzid: prev.options.tzid,
                count: prev.options.count,
            }
            const newRRule = new RRule({
                ...prevOptions,
                dtstart: date,
            })
            const newString = newRRule.toString()
            onChange(newString)
            return newRRule
        })
        // Close the calendar popover after selecting a date
        setCalendarOpen(false)
    }

    const handleChange = (value: Partial<Options>) => {
        setRrule((prev) => {
            const prevOptions = prev.origOptions || {
                freq: prev.options.freq,
                interval: prev.options.interval,
                dtstart: prev.options.dtstart,
                tzid: prev.options.tzid,
            }
            const newRRule = new RRule({
                ...prevOptions,
                ...value,
            })
            const newString = newRRule.toString()
            onChange(newString)
            console.log(newString)
            return newRRule
        })
    }

    const isWeekdaySelected = (weekday: Weekday): boolean => {
        const currentByweekday = rrule.options.byweekday || []
        return currentByweekday.some((w) => {
            const wd = typeof w === 'number' ? new Weekday(w) : w
            return wd.equals(weekday)
        })
    }

    const handleByweekday = (weekday: Weekday) => {
        setRrule((prev) => {
            const currentByweekday = prev.options.byweekday || []
            // Convert to Weekday array if needed (byweekday can be number[] or Weekday[])
            const weekdayArray: Weekday[] = currentByweekday.map((w) => 
                typeof w === 'number' ? new Weekday(w) : w
            )
            const isSelected = weekdayArray.some((w) => w.equals(weekday))
            
            let newByweekday: Weekday[]
            if (isSelected) {
                newByweekday = weekdayArray.filter((w) => !w.equals(weekday))
            } else {
                newByweekday = [...weekdayArray, weekday]
            }
            
            const prevOptions = prev.origOptions || {
                freq: prev.options.freq,
                interval: prev.options.interval,
                dtstart: prev.options.dtstart,
                tzid: prev.options.tzid,
            }
            const newRRule = new RRule({
                ...prevOptions,
                byweekday: newByweekday.length > 0 ? newByweekday : undefined,
            })
            const newString = newRRule.toString()
            onChange(newString)
            console.log(newString)
            return newRRule
        })
    }


    const isMonthdaySelected = (monthday: number): boolean => {
        const currentBymonthday = rrule.options.bymonthday || []
        return currentBymonthday.includes(monthday)
    }

    const handleBymonthday = (monthday: number) => {
        setRrule((prev) => {
            const currentBymonthday = prev.options.bymonthday || []
            const newBymonthday = currentBymonthday.includes(monthday) ? currentBymonthday.filter((m) => m !== monthday) : [...currentBymonthday, monthday]
            const newRRule = new RRule({
                ...prev.origOptions || {
                    freq: prev.options.freq,
                    interval: prev.options.interval,
                    dtstart: prev.options.dtstart,
                    tzid: prev.options.tzid,
                },
                bymonthday: newBymonthday,
            })
            const newString = newRRule.toString()
            onChange(newString)
            console.log(newString)
            return newRRule
        })
    }

    /**
     * sanitize the current rrule when we change the repeate pattern
     * set interval to 1, byweekday to undefined, bymonthday to undefined
     * and set the new repeat pattern
     */
    const handleSanitizeRRule = (repeatPattern: REPEAT_PATTERN) => {
        setRrule((prev) => {
            
            const newRRule = new RRule({
                freq: freqMap[repeatPattern] || RRule.DAILY,
                interval: 1,
                dtstart: prev.options.dtstart,
                tzid: prev.options.tzid,
            });
            const newString = newRRule.toString()
            onChange(newString)
            console.log(newString)
            return newRRule
        })
    }

    return (
        <>
            {name && (
                <input
                    type="hidden"
                    name={name}
                    id={id}
                    value={rruleString}
                />
            )}
            <div>
                <BitLabel htmlFor="task-type">Type</BitLabel>
                <BitSelect 
                    name="task-type" 
                    value={isRecurring ? 'recurring' : 'single'}
                    onValueChange={(value) => {
                        // Only toggle if the value actually changed
                        if ((value === 'single' && isRecurring) || (value === 'recurring' && !isRecurring)) {
                            handleToggleRecurring()
                        }
                    }}
                >
                    <BitSelectTrigger id="task-type">
                        <BitSelectValue placeholder="Select task type" />
                    </BitSelectTrigger>
                    <BitSelectContent>
                        <BitSelectItem value="single">Single</BitSelectItem>
                        <BitSelectItem value="recurring">Recurring</BitSelectItem>
                    </BitSelectContent>
                </BitSelect>
            </div>
            <Activity mode={isRecurring ? 'visible' : 'hidden'}>
                <div>
                    <BitLabel htmlFor="repeat-pattern">Repeat Pattern</BitLabel>
                    <BitSelect name="repeat-pattern" value={Object.keys(freqMap).find(key => freqMap[key as REPEAT_PATTERN] === rrule.options.freq) as REPEAT_PATTERN} onValueChange={(value) => {
                        handleSanitizeRRule(value as REPEAT_PATTERN)
                    }}>
                        <BitSelectTrigger id="repeat-pattern">
                            <BitSelectValue placeholder="Select a repeat pattern" />
                        </BitSelectTrigger>
                        <BitSelectContent>
                            <BitSelectItem value="DAILY">Daily</BitSelectItem>
                            <BitSelectItem value="WEEKLY">Weekly</BitSelectItem>
                            <BitSelectItem value="MONTHLY">Monthly</BitSelectItem>
                        </BitSelectContent>
                    </BitSelect>
                </div>
            </Activity>

            {/* Daily */}
            <Activity mode={isRecurring && rrule.options.freq === RRule.DAILY ? 'visible' : 'hidden'}>
                <div>
                    <BitLabel htmlFor="daily-interval">Interval</BitLabel>
                    <div className="flex gap-2 justify-evenly" id="daily-interval" >
                        <button type="button" data-selected={rrule.options.interval === 1} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 1 })}>1</button>
                        <button type="button" data-selected={rrule.options.interval === 2} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 2 })}>2</button>
                        <button type="button" data-selected={rrule.options.interval === 3} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 3 })}>3</button>
                        <button type="button" data-selected={rrule.options.interval === 4} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 4 })}>4</button>
                        <button type="button" data-selected={rrule.options.interval === 5} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 5 })}>5</button>
                        <button type="button" data-selected={rrule.options.interval === 6} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 6 })}>6</button>
                        <button type="button" data-selected={rrule.options.interval === 7} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 7 })}>7</button>
                    </div>
                </div>
            </Activity>

             {/* Weekly */}
            <Activity mode={isRecurring && rrule.options.freq === RRule.WEEKLY ? 'visible' : 'hidden'}>
                <div>
                    <BitLabel htmlFor="weekly-interval">Interval</BitLabel>
                    <button type="button" data-selected={rrule.options.interval === 1} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 1 })}>1</button>
                    <button type="button" data-selected={rrule.options.interval === 2} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 2 })}>2</button>
                    <button type="button" data-selected={rrule.options.interval === 3} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 3 })}>3</button>
                    <button type="button" data-selected={rrule.options.interval === 4} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleChange({ interval: 4 })}>4</button>
                </div>
                <div>
                    <BitLabel htmlFor="weekly-interval">Days of Week</BitLabel>
                    <div className="grid grid-cols-2  gap-2" id="weekly-interval" >
                        <button type="button" data-selected={isWeekdaySelected(RRule.SU)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.SU)}>Sun</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.MO)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.MO)}>Mon</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.TU)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.TU)}>Tue</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.WE)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.WE)}>Wed</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.TH)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.TH)}>Thu</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.FR)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.FR)}>Fri</button>
                        <button type="button" data-selected={isWeekdaySelected(RRule.SA)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleByweekday(RRule.SA)}>Sat</button>
                    </div>
                </div>
            </Activity>

            {/* Monthly */}
            <Activity mode={isRecurring && rrule.options.freq === RRule.MONTHLY ? 'visible' : 'hidden'}>
                <div>
                    <BitLabel htmlFor="monthly-interval">Days of Month</BitLabel>
                    <div className="grid grid-cols-4" id="monthly-interval" >
                        <button type="button" data-selected={isMonthdaySelected(1)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(1)}>1</button>
                        <button type="button" data-selected={isMonthdaySelected(2)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(2)}>2</button>
                        <button type="button" data-selected={isMonthdaySelected(3)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(3)}>3</button>
                        <button type="button" data-selected={isMonthdaySelected(4)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(4)}>4</button>
                        <button type="button" data-selected={isMonthdaySelected(5)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(5)}>5</button>
                        <button type="button" data-selected={isMonthdaySelected(6)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(6)}>6</button>
                        <button type="button" data-selected={isMonthdaySelected(7)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(7)}>7</button>
                        <button type="button" data-selected={isMonthdaySelected(8)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(8)}>8</button>
                        <button type="button" data-selected={isMonthdaySelected(9)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(9)}>9</button>
                        <button type="button" data-selected={isMonthdaySelected(10)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(10)}>10</button>
                        <button type="button" data-selected={isMonthdaySelected(11)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(11)}>11</button>
                        <button type="button" data-selected={isMonthdaySelected(12)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(12)}>12</button>
                        <button type="button" data-selected={isMonthdaySelected(13)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(13)}>13</button>
                        <button type="button" data-selected={isMonthdaySelected(14)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(14)}>14</button>
                        <button type="button" data-selected={isMonthdaySelected(15)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(15)}>15</button>
                        <button type="button" data-selected={isMonthdaySelected(16)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(16)}>16</button>
                        <button type="button" data-selected={isMonthdaySelected(17)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(17)}>17</button>
                        <button type="button" data-selected={isMonthdaySelected(18)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(18)}>18</button>
                        <button type="button" data-selected={isMonthdaySelected(19)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(19)}>19</button>
                        <button type="button" data-selected={isMonthdaySelected(20)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(20)}>20</button>
                        <button type="button" data-selected={isMonthdaySelected(21)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(21)}>21</button>
                        <button type="button" data-selected={isMonthdaySelected(22)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(22)}>22</button>
                        <button type="button" data-selected={isMonthdaySelected(23)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(23)}>23</button>
                        <button type="button" data-selected={isMonthdaySelected(24)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(24)}>24</button>
                        <button type="button" data-selected={isMonthdaySelected(25)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(25)}>25</button>
                        <button type="button" data-selected={isMonthdaySelected(26)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(26)}>26</button>
                        <button type="button" data-selected={isMonthdaySelected(27)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(27)}>27</button>
                        <button type="button" data-selected={isMonthdaySelected(28)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(28)}>28</button>
                        <button type="button" data-selected={isMonthdaySelected(29)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(29)}>29</button>
                        <button type="button" data-selected={isMonthdaySelected(30)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(30)}>30</button>
                        <button type="button" data-selected={isMonthdaySelected(31)} className="w-10 h-10 bg-transparent border-none p-0 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" onClick={() => handleBymonthday(31)}>31</button>
                    </div>
                </div>
            </Activity>
            
            {/* Date Picker */}
            <div>
                <BitLabel htmlFor="date-picker" className="w-full pb-1">
                    {isRecurring ? 'Start Date' : 'Due Date'}
                </BitLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <BitButton
                            type="button"
                            variant="outline"
                            id="date-picker"
                            className="w-full justify-start text-left font-normal"
                        >
                            {format(startDate, 'PPP')}
                        </BitButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </>
    )
}