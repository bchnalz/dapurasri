import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function DatePicker({ value, onChange, placeholder = 'Pilih tanggal', className }) {
  const [open, setOpen] = useState(false)

  const dateValue = value ? new Date(value) : undefined

  function handleSelect(date) {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      onChange?.(formatted)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {dateValue ? format(dateValue, 'dd MMM yyyy', { locale: localeId }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          defaultMonth={dateValue}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
