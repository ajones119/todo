import { Select as BitSelect } from '@/components/ui/8bit/select'
import { SelectTrigger as BitSelectTrigger } from '@/components/ui/8bit/select'
import { SelectValue as BitSelectValue } from '@/components/ui/8bit/select'
import { SelectContent as BitSelectContent } from '@/components/ui/8bit/select'
import { SelectItem as BitSelectItem } from '@/components/ui/8bit/select'
import { Label as BitLabel } from '@/components/ui/8bit/label'

type CategorySelectProps = {
  id?: string
  value?: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
}

export const CategorySelect = ({ 
  id = 'category', 
  value = '', 
  onChange, 
  label = 'Category',
  required = false 
}: CategorySelectProps) => {
  return (
    <div className="space-y-2">
      <BitLabel htmlFor={id}>{label}</BitLabel>
      <BitSelect
        value={value}
        onValueChange={onChange}
        required={required}
      >
        <BitSelectTrigger id={id}>
          <BitSelectValue placeholder="Select a category" />
        </BitSelectTrigger>
        <BitSelectContent>
          <BitSelectItem value="gold">Work </BitSelectItem>
          <BitSelectItem value="intelligence">Learning</BitSelectItem>
          <BitSelectItem value="health">Self-Care</BitSelectItem>
          <BitSelectItem value="strength">Workout</BitSelectItem>
          <BitSelectItem value="wisdom">Creativity</BitSelectItem>
          <BitSelectItem value="charisma">Socializing</BitSelectItem>
          <BitSelectItem value="stamina">Cardio</BitSelectItem>
          <BitSelectItem value="luck">Misc.</BitSelectItem>
        </BitSelectContent>
      </BitSelect>
    </div>
  )
}

